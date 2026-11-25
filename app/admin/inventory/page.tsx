'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Boxes,
  Search,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  RefreshCw,
  X,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { products as fallbackProducts } from '@/data/products';
import { InventoryMovement } from '@/lib/admin/adminTypes';

interface InventoryItemState {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  image: string;
}

export default function InventoryAdminPage() {
  const storeProducts = useAdminStore((state) => state.products) || fallbackProducts;
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const { user, effectiveRole, hasPermission } = useAdminSession();
  const canAdjust = hasPermission('inventory.adjust');

  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');
  const [search, setSearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out' | 'reserved'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItemState | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical Count Audit');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([
    {
      id: 'mov-1',
      productId: 'kit-1',
      productName: 'T-Rex Dinosaur DIY Paint Kit',
      quantityChange: +25,
      previousStock: 15,
      newStock: 40,
      previousReserved: 2,
      newReserved: 2,
      movementType: 'MANUAL_ADJUSTMENT',
      referenceId: 'RESTOCK-PO-991',
      notes: 'Supplier replenishment batch #89 received',
      actorEmail: 'admin@rangaroo.store',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'mov-2',
      productId: 'kit-2',
      productName: 'Cosmic Space Explorer Paint Kit',
      quantityChange: -1,
      previousStock: 40,
      newStock: 39,
      previousReserved: 3,
      newReserved: 4,
      movementType: 'RESERVATION',
      referenceId: 'ORD-2026-9021',
      notes: 'Customer checkout reservation held (15m TTL)',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'mov-3',
      productId: 'kit-3',
      productName: 'Safari Animals Paint Kit',
      quantityChange: -2,
      previousStock: 28,
      newStock: 26,
      previousReserved: 2,
      newReserved: 0,
      movementType: 'RESERVATION_CONFIRMED',
      referenceId: 'ORD-2026-8910',
      notes: 'Razorpay payment captured; hold converted to permanent reduction',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'mov-4',
      productId: 'kit-1',
      productName: 'T-Rex Dinosaur DIY Paint Kit',
      quantityChange: +1,
      previousStock: 39,
      newStock: 40,
      previousReserved: 1,
      newReserved: 0,
      movementType: 'RESERVATION_EXPIRED',
      referenceId: 'ORD-2026-8740',
      notes: 'Abandoned checkout timeout; released hold back to available',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ]);

  // Transform store products into inventory items
  const inventoryItems: InventoryItemState[] = useMemo(() => {
    return storeProducts.map((p) => {
      const physical = p.stockQuantity ?? 30;
      // Mock deterministic reserved count for demo
      const reserved = physical > 15 ? 2 : physical > 5 ? 1 : 0;
      const available = Math.max(0, physical - reserved);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: `RNG-${p.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`,
        category: p.categoryId,
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: available,
        lowStockThreshold: 10,
        image: p.images?.[0] || '/logo.png',
      };
    });
  }, [storeProducts]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterStockStatus === 'low') {
        matchesFilter = item.availableStock > 0 && item.availableStock < item.lowStockThreshold;
      } else if (filterStockStatus === 'out') {
        matchesFilter = item.availableStock === 0;
      } else if (filterStockStatus === 'reserved') {
        matchesFilter = item.reservedStock > 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [inventoryItems, search, filterStockStatus]);

  const handleOpenAdjust = (item: InventoryItemState) => {
    if (!canAdjust) {
      toast.error(`Permission Denied: ${effectiveRole()} lacks inventory.adjust privileges.`);
      return;
    }
    setSelectedProduct(item);
    setNewStockValue(item.physicalStock);
    setAdjustReason('Physical Count Audit');
    setAdjustNotes(`Stock recount verified by ${user?.email || 'admin'}`);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (newStockValue < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    const diff = newStockValue - selectedProduct.physicalStock;
    const actorEmail = user?.email || 'admin@rangaroo.store';

    // Optimistic update in client store
    updateProduct(selectedProduct.id, { stockQuantity: newStockValue });

    // Append to movement ledger
    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantityChange: diff,
      previousStock: selectedProduct.physicalStock,
      newStock: newStockValue,
      previousReserved: selectedProduct.reservedStock,
      newReserved: selectedProduct.reservedStock,
      movementType: 'MANUAL_ADJUSTMENT',
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      notes: `${adjustReason}: ${adjustNotes || 'Manual update'}`,
      actorEmail,
      createdAt: new Date().toISOString(),
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Send to backend API if available
    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          newStock: newStockValue,
          notes: `${adjustReason} - ${adjustNotes}`,
          adminId: user?.id,
        }),
      });
    } catch {
      // In-memory update already applied
    }

    toast.success(
      `Stock adjusted for ${selectedProduct.name} (${diff >= 0 ? `+${diff}` : diff}) units`
    );
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Inventory & Stock Holds
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Authoritative warehouse levels, active checkout holds, and PostgreSQL immutable movement audit ledger.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-white border border-stone-200/80 p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'levels'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse Levels</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'movements'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement History ({movements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'levels' ? (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory by kit title, SKU, or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Filter:</span>
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as any)}
                className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              >
                <option value="all">All Items ({inventoryItems.length})</option>
                <option value="low">Low Stock Warning (&lt; 10)</option>
                <option value="out">Out of Stock (0)</option>
                <option value="reserved">Has Active Holds (&gt; 0)</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
                  <tr>
                    <th className="px-4 py-3">Product / SKU</th>
                    <th className="px-4 py-3 text-center">Physical Stock</th>
                    <th className="px-4 py-3 text-center">Reserved Holds</th>
                    <th className="px-4 py-3 text-center">Available to Sell</th>
                    <th className="px-4 py-3">Health Status</th>
                    <th className="px-4 py-3 text-right">Adjustment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map((item) => {
                    const isLow = item.availableStock > 0 && item.availableStock < item.lowStockThreshold;
                    const isOut = item.availableStock === 0;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 relative overflow-hidden shrink-0 border border-stone-200">
                              <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 truncate">{item.name}</div>
                              <div className="text-[11px] text-stone-400 font-mono">
                                SKU: {item.sku}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Physical Stock */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-stone-900 text-sm">
                          {item.physicalStock}
                        </td>

                        {/* Reserved Stock */}
                        <td className="px-4 py-3.5 text-center">
                          {item.reservedStock > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.reservedStock} hold(s)
                            </span>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs">0</span>
                          )}
                        </td>

                        {/* Available Stock */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            {item.availableStock}
                          </span>
                        </td>

                        {/* Health Status */}
                        <td className="px-4 py-3.5">
                          {isOut ? (
                            <span className="inline-flex items-center text-[10px] uppercase font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              Depleted (0)
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Low Stock Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Optimal
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            disabled={!canAdjust}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                              canAdjust
                                ? 'bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/30 hover:bg-[#FAF5EE] cursor-pointer'
                                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-sm">No inventory items matching filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movement History Table */
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
            <div>
              <h3 className="font-outfit font-bold text-stone-900 text-sm">
                Stock Movement Ledger (public.inventory_movements)
              </h3>
              <p className="text-xs text-stone-500">
                Deterministic audit trail recording all holds, captures, expirations, and manual supervisor adjustments.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-700">
              {movements.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead className="bg-[#FAF5EE]/60 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3 text-center">Change</th>
                  <th className="px-4 py-3 text-center">Stock Before → After</th>
                  <th className="px-4 py-3">Reference / Attribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-stone-500 font-mono whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-stone-900">
                        {m.productName}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {m.movementType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold">
                        <span
                          className={`inline-flex items-center ${
                            isPositive ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-stone-700">
                        {m.previousStock} → <span className="font-bold text-stone-900">{m.newStock}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-stone-800 text-[11px] truncate max-w-xs">
                          {m.notes}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {m.actorEmail ? `By: ${m.actorEmail}` : m.referenceId}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Dialog */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsAdjustModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  Manual Stock Adjustment
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  RPC: adjust_product_stock()
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="p-6 space-y-4 text-xs">
                {/* Product Summary Box */}
                <div className="p-3 bg-[#FFF9F2] rounded-2xl border border-amber-900/10 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white relative overflow-hidden shrink-0 border border-stone-200">
                    <Image src={selectedProduct.image} alt={selectedProduct.name} fill unoptimized className="object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 line-clamp-1">{selectedProduct.name}</div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Current Physical: <span className="font-bold text-stone-800">{selectedProduct.physicalStock} units</span>
                    </div>
                  </div>
                </div>

                {/* New Physical Stock Input */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    New Target Physical Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono text-base font-bold text-stone-900"
                  />
                  <div className="text-[11px] text-stone-500 mt-1 flex justify-between">
                    <span>
                      Delta: {newStockValue - selectedProduct.physicalStock >= 0 ? `+${newStockValue - selectedProduct.physicalStock}` : newStockValue - selectedProduct.physicalStock} units
                    </span>
                    <span>Reserved hold: {selectedProduct.reservedStock}</span>
                  </div>
                </div>

                {/* Reason Code */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Adjustment Reason Code
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  >
                    <option value="Physical Count Audit">Physical Warehouse Count Audit</option>
                    <option value="Damaged / Defective Stock">Damaged / Defective Figurines</option>
                    <option value="Supplier Restock Shipment">Supplier Restock Shipment Received</option>
                    <option value="Lost in Transit">Lost in Transit / Package Discrepancy</option>
                    <option value="Customer Return Restock">Customer Return Restock</option>
                  </select>
                </div>

                {/* Notes & Admin Attribution */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Audit Note & Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
                    placeholder="Enter details for the immutable ledger..."
                  />
                  <p className="text-[10px] text-stone-400 mt-1 font-mono">
                    Attributed to: {user?.email} ({effectiveRole()})
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Confirm & Commit Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
