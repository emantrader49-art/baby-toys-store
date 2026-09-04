import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../features/cart/cartSlice.js";
import Toast from "../components/Toast.jsx";

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, subtotal, coupon, discount, shippingThreshold, shippingFee } = useSelector((s) => s.cart);
  const user = useSelector((s) => s.auth.user);

  const [couponInput, setCouponInput] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const effectiveShipping = subtotal >= shippingThreshold || subtotal === 0 ? 0 : shippingFee;
  const grandTotal = Math.max(0, Math.round((subtotal - discount + effectiveShipping) * 100) / 100);
  const amountToFreeShipping = Math.max(0, shippingThreshold - subtotal);
  const shippingProgressPct = Math.min(100, Math.round((subtotal / shippingThreshold) * 100));

  const handleQuantityChange = (itemId, newQty) => {
    dispatch(updateCartItem({ itemId, quantity: newQty }));
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeCartItem(itemId));
    setToastMessage("Item removed from cart");
    setToastType("info");
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === "WELCOME10" || code === "SAVE5") {
      dispatch(applyCoupon(code));
      setToastMessage(`Coupon "${code}" applied!`);
      setToastType("success");
      setCouponInput("");
    } else {
      setToastMessage("Invalid coupon code. Try WELCOME10 or SAVE5");
      setToastType("error");
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-sage-50 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🛍️
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mb-2">Your cart is empty</h1>
        <p className="text-ink/60 max-w-sm mx-auto mb-8 text-sm">
          Looks like you haven't added any toys yet. Discover our curated, non-toxic toys collection for your little one!
        </p>
        <Link
          to="/products"
          className="inline-block rounded-soft bg-sage-600 text-white px-6 py-3 text-sm font-semibold hover:bg-sage-700 transition-colors shadow-sm"
        >
          Explore All Toys
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <h1 className="font-display text-3xl font-bold text-ink mb-6">Shopping Cart ({items.length} items)</h1>

      {/* Free Shipping Progress Bar */}
      <div className="mb-8 p-4 bg-white rounded-soft border border-sage-100 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-ink mb-2">
          {amountToFreeShipping > 0 ? (
            <span>
              🚚 Add <strong className="text-sage-700 font-bold">${amountToFreeShipping.toFixed(2)}</strong> more to unlock <strong className="text-sage-700">FREE Shipping</strong>!
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1">
              🎉 Congratulations! You have unlocked <strong>FREE Standard Shipping</strong>!
            </span>
          )}
          <span>{shippingProgressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-sage-50 overflow-hidden">
          <div
            className="h-full bg-sage-600 rounded-full transition-all duration-500"
            style={{ width: `${shippingProgressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-soft border border-sage-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-sage-100">
              {items.map((item) => {
                const product = item.product || {};
                const imageUrl =
                  product.image || product.images?.[0]?.url || "https://via.placeholder.com/150";

                return (
                  <div key={item._id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <Link to={`/products/${product.slug}`} className="w-20 h-20 rounded-soft border border-sage-100 bg-sage-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      </Link>

                      <div>
                        <Link to={`/products/${product.slug}`} className="font-semibold text-sm text-ink hover:text-sage-700 line-clamp-1">
                          {product.name}
                        </Link>
                        {item.variantId && (
                          <span className="text-xs text-ink/50 block mt-0.5">Variant SKU: {item.variantId}</span>
                        )}
                        <span className="text-xs font-semibold text-sage-700 block mt-1">
                          ${(item.unitPrice || 0).toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-sage-200 rounded-soft bg-white">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-ink/60 hover:text-ink text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-ink/60 hover:text-ink text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-bold text-sm text-ink">
                          ${((item.unitPrice || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-ink/40 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-sage-50/50 border-t border-sage-100 flex justify-between items-center text-xs">
              <Link to="/products" className="text-sage-700 font-semibold hover:underline">
                ← Continue Shopping
              </Link>
              <button
                onClick={() => dispatch(clearCart())}
                className="text-rose-600 hover:underline font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-ink pb-3 border-b border-sage-100">
              Order Summary
            </h3>

            {/* Coupon Application */}
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">Have a Promo Code?</label>
              {coupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-soft bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <div>
                    <strong className="font-bold">{coupon.code}</strong> (Applied)
                  </div>
                  <button onClick={() => dispatch(removeCoupon())} className="text-rose-600 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 text-xs rounded-soft border border-sage-100 px-3 py-2 uppercase focus:border-sage-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-soft bg-sage-600 text-white text-xs font-medium hover:bg-sage-700 transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              <p className="text-[11px] text-ink/40 mt-1">Try demo codes: WELCOME10 (10% off) or SAVE5 ($5 off)</p>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-ink/80 pt-2 border-t border-sage-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>{effectiveShipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `$${effectiveShipping.toFixed(2)}`}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-ink pt-3 border-t border-sage-100">
                <span>Estimated Total</span>
                <span className="text-sage-700 text-base">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full rounded-soft bg-apricot-500 text-white py-3 font-semibold text-sm hover:bg-apricot-400 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              🔒 Proceed to Checkout
            </button>
          </div>

          {/* Guarantee Badges */}
          <div className="p-4 rounded-soft bg-sage-50/70 border border-sage-100 text-xs text-ink/70 space-y-2">
            <div className="flex items-center gap-2">
              <span>🛡️</span> <span>Safe and encrypted checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌱</span> <span>100% Non-toxic certified baby toys</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📦</span> <span>Fast shipping with live tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
