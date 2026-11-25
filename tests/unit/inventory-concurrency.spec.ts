import { test, expect } from '@playwright/test';

// Simulation of inventory reservation aggregation and locking logic
function aggregateAndSortItems(items: Array<{ product_id: string; quantity: number }>) {
  const map = new Map<string, number>();

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error(`INVALID_QUANTITY: Quantity must be positive, received ${item.quantity}`);
    }
    const current = map.get(item.product_id) || 0;
    map.set(item.product_id, current + item.quantity);
  }

  // Sort ascending by product_id to guarantee deterministic lock acquisition
  return Array.from(map.entries())
    .map(([product_id, total_quantity]) => ({ product_id, total_quantity }))
    .sort((a, b) => a.product_id.localeCompare(b.product_id));
}

// In-memory model of inventory ledger and state transitions for invariant verification
class MockInventoryEngine {
  products: Map<string, { stock: number; reserved_quantity: number }> = new Map();
  reservations: Map<string, Array<{ id: string; product_id: string; quantity: number; status: string; expires_at: number }>> = new Map();
  movements: Array<{ product_id: string; quantity_change: number; movement_type: string; notes: string }> = [];

  constructor() {
    this.products.set('prod-craft-1', { stock: 10, reserved_quantity: 0 });
    this.products.set('prod-craft-2', { stock: 5, reserved_quantity: 0 });
    this.products.set('prod-craft-final', { stock: 1, reserved_quantity: 0 }); // 1 unit left
  }

  reserveOrder(orderId: string, items: Array<{ product_id: string; quantity: number }>, now: number = Date.now()): boolean {
    // Idempotency: if pending reservation already exists for this orderId, return true
    const existing = this.reservations.get(orderId);
    if (existing && existing.some(r => r.status === 'PENDING' && r.expires_at > now)) {
      return true; // Idempotent success
    }

    const aggregated = aggregateAndSortItems(items);

    // Verify all products have sufficient stock
    for (const item of aggregated) {
      const prod = this.products.get(item.product_id);
      if (!prod) throw new Error(`PRODUCT_NOT_FOUND: ${item.product_id}`);
      const available = prod.stock - prod.reserved_quantity;
      if (available < item.total_quantity) {
        return false; // Insufficient stock
      }
    }

    // Apply reservations
    const orderRes = [];
    for (const item of aggregated) {
      const prod = this.products.get(item.product_id)!;
      prod.reserved_quantity += item.total_quantity;
      orderRes.push({
        id: `res-${Date.now()}-${item.product_id}`,
        product_id: item.product_id,
        quantity: item.total_quantity,
        status: 'PENDING',
        expires_at: now + 15 * 60 * 1000,
      });
      this.movements.push({
        product_id: item.product_id,
        quantity_change: item.total_quantity,
        movement_type: 'RESERVATION',
        notes: `Order ${orderId} reserved hold`,
      });
    }

    this.reservations.set(orderId, orderRes);
    return true;
  }

  confirmPayment(orderId: string): boolean {
    const orderRes = this.reservations.get(orderId);
    if (!orderRes) return false;

    // Idempotent: if already confirmed, do not deduct stock twice
    if (orderRes.every(r => r.status === 'CONFIRMED')) {
      return true;
    }

    for (const res of orderRes) {
      if (res.status === 'PENDING') {
        const prod = this.products.get(res.product_id)!;
        prod.stock -= res.quantity;
        prod.reserved_quantity = Math.max(0, prod.reserved_quantity - res.quantity);
        res.status = 'CONFIRMED';
        this.movements.push({
          product_id: res.product_id,
          quantity_change: -res.quantity,
          movement_type: 'RESERVATION_CONFIRMED',
          notes: `Order ${orderId} payment confirmed`,
        });
      }
    }

    return true;
  }

  cancelReservation(orderId: string): boolean {
    const orderRes = this.reservations.get(orderId);
    if (!orderRes) return false;

    for (const res of orderRes) {
      if (res.status === 'PENDING') {
        const prod = this.products.get(res.product_id)!;
        prod.reserved_quantity = Math.max(0, prod.reserved_quantity - res.quantity);
        res.status = 'RELEASED';
        this.movements.push({
          product_id: res.product_id,
          quantity_change: 0,
          movement_type: 'RESERVATION_RELEASED',
          notes: `Order ${orderId} cancelled`,
        });
      }
    }

    return true;
  }

  sweepExpired(now: number): number {
    let swept = 0;
    for (const [, resList] of this.reservations.entries()) {
      for (const res of resList) {
        if (res.status === 'PENDING' && res.expires_at <= now) {
          const prod = this.products.get(res.product_id)!;
          prod.reserved_quantity = Math.max(0, prod.reserved_quantity - res.quantity);
          res.status = 'EXPIRED';
          swept++;
        }
      }
    }
    return swept;
  }

  adjustPhysicalStock(productId: string, newStock: number): boolean {
    const prod = this.products.get(productId);
    if (!prod) return false;

    // Invariant: Cannot reduce physical stock below currently active reservations
    if (newStock < prod.reserved_quantity) {
      throw new Error(`BOUNDARY_VIOLATION: Cannot set stock to ${newStock} when ${prod.reserved_quantity} units are reserved`);
    }

    prod.stock = newStock;
    return true;
  }
}

test.describe('Inventory Concurrency & Invariant Verification Suite', () => {
  test('Duplicate product IDs in cart are aggregated correctly', () => {
    const rawCart = [
      { product_id: 'prod-craft-1', quantity: 2 },
      { product_id: 'prod-craft-2', quantity: 1 },
      { product_id: 'prod-craft-1', quantity: 3 },
      { product_id: 'prod-craft-2', quantity: 4 },
    ];

    const aggregated = aggregateAndSortItems(rawCart);

    expect(aggregated).toEqual([
      { product_id: 'prod-craft-1', total_quantity: 5 },
      { product_id: 'prod-craft-2', total_quantity: 5 },
    ]);
  });

  test('Aggregated items are sorted in deterministic ascending order', () => {
    const rawCart = [
      { product_id: 'zebra-figurine', quantity: 1 },
      { product_id: 'aardvark-figurine', quantity: 1 },
      { product_id: 'kangaroo-figurine', quantity: 2 },
    ];

    const aggregated = aggregateAndSortItems(rawCart);

    expect(aggregated.map(i => i.product_id)).toEqual([
      'aardvark-figurine',
      'kangaroo-figurine',
      'zebra-figurine',
    ]);
  });

  test('Zero and negative quantities are rejected before database lock attempts', () => {
    expect(() => aggregateAndSortItems([{ product_id: 'prod-1', quantity: 0 }])).toThrow('INVALID_QUANTITY');
    expect(() => aggregateAndSortItems([{ product_id: 'prod-1', quantity: -3 }])).toThrow('INVALID_QUANTITY');
  });

  test('Reservation creation is strictly idempotent for identical order ID', () => {
    const engine = new MockInventoryEngine();
    const orderId = 'ORD-1001';
    const items = [{ product_id: 'prod-craft-1', quantity: 2 }];

    const first = engine.reserveOrder(orderId, items);
    expect(first).toBe(true);

    const prodAfterFirst = engine.products.get('prod-craft-1')!;
    expect(prodAfterFirst.reserved_quantity).toBe(2);

    // Call second time with same orderId
    const second = engine.reserveOrder(orderId, items);
    expect(second).toBe(true);

    // Reserved quantity must NOT double
    expect(prodAfterFirst.reserved_quantity).toBe(2);
  });

  test('Simulated concurrency: two users race for 1 final available stock', () => {
    const engine = new MockInventoryEngine();
    const finalProduct = engine.products.get('prod-craft-final')!;
    expect(finalProduct.stock).toBe(1);
    expect(finalProduct.reserved_quantity).toBe(0);

    // User A reserves
    const userASucceeded = engine.reserveOrder('ORD-USER-A', [{ product_id: 'prod-craft-final', quantity: 1 }]);
    expect(userASucceeded).toBe(true);
    expect(finalProduct.reserved_quantity).toBe(1);

    // User B tries to reserve simultaneously
    const userBSucceeded = engine.reserveOrder('ORD-USER-B', [{ product_id: 'prod-craft-final', quantity: 1 }]);
    expect(userBSucceeded).toBe(false); // Gracefully rejected, zero oversell

    // User A confirms payment
    engine.confirmPayment('ORD-USER-A');
    expect(finalProduct.stock).toBe(0);
    expect(finalProduct.reserved_quantity).toBe(0);
  });

  test('Expired reservations are swept and stock availability is restored', () => {
    const engine = new MockInventoryEngine();
    const now = Date.now();

    engine.reserveOrder('ORD-EXPIRE-TEST', [{ product_id: 'prod-craft-final', quantity: 1 }], now);
    const prod = engine.products.get('prod-craft-final')!;
    expect(prod.reserved_quantity).toBe(1);

    // Advance time past 15-minute expiration
    const futureTime = now + 16 * 60 * 1000;
    const sweptCount = engine.sweepExpired(futureTime);

    expect(sweptCount).toBe(1);
    expect(prod.reserved_quantity).toBe(0); // Available stock restored
    expect(prod.stock).toBe(1); // Physical stock intact
  });

  test('Manual stock adjustments cannot lower stock below active reservations', () => {
    const engine = new MockInventoryEngine();
    engine.reserveOrder('ORD-HOLD-1', [{ product_id: 'prod-craft-1', quantity: 4 }]);

    const prod = engine.products.get('prod-craft-1')!;
    expect(prod.stock).toBe(10);
    expect(prod.reserved_quantity).toBe(4);

    // Valid adjustment to 8
    expect(engine.adjustPhysicalStock('prod-craft-1', 8)).toBe(true);
    expect(prod.stock).toBe(8);

    // Invalid adjustment to 3 (below reserved 4)
    expect(() => engine.adjustPhysicalStock('prod-craft-1', 3)).toThrow('BOUNDARY_VIOLATION');
    expect(prod.stock).toBe(8); // Unchanged
  });
});
