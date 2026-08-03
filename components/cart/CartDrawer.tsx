'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer() {
  const { isOpen, items, toggleCart, updateQuantity, removeItem } = useCartStore();

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 499 ? 0 : 60;
  const total = subtotal + shippingFee;

  return (
    <>
      <div className="cart-overlay" onClick={toggleCart}></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>Your Cart 🛒</h2>
          <button className="close-btn" onClick={toggleCart}>×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <span className="mascot-emoji">🦘</span>
              <p>Your cart is looking a little empty!</p>
              <button className="continue-shopping" onClick={toggleCart}>
                Start Creating!
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="cart-item">
                <Image src={item.image} alt={item.name} width={80} height={80} className="item-image" />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>₹{item.price}</p>
                  <div className="quantity-selector">
                    <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.productId)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            <Link href="/checkout" className="checkout-btn" onClick={toggleCart}>
              Proceed to Checkout
            </Link>
            <button className="continue-shopping-link" onClick={toggleCart}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
