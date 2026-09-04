import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  createOrder,
  createPaymentIntent,
  confirmSandboxPayment,
  resetOrderCreation,
} from "../features/orders/ordersSlice.js";
import { clearCart } from "../features/cart/cartSlice.js";
import PaymentSandboxModal from "../components/PaymentSandboxModal.jsx";
import Toast from "../components/Toast.jsx";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const { items, subtotal, coupon, discount, shippingThreshold, shippingFee } = useSelector((s) => s.cart);
  const { currentOrder, orderCreationStatus, paymentStatus, error } = useSelector((s) => s.orders);

  const [step, setStep] = useState(1); // 1: Address & Shipping, 2: Payment, 3: Confirmation
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");

  // Shipping address state
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, navigate]);

  useEffect(() => {
    // If order was already paid, show confirmation step
    if (currentOrder && currentOrder.status === "paid") {
      setStep(3);
    }
  }, [currentOrder]);

  const effectiveShipping =
    shippingMethod === "express" ? 9.99 : subtotal >= shippingThreshold ? 0 : shippingFee;
  const grandTotal = Math.max(0, Math.round((subtotal - discount + effectiveShipping) * 100) / 100);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!address.fullName || !address.line1 || !address.city || !address.postalCode) {
      setToastMessage("Please fill in all required shipping address fields.");
      setToastType("error");
      return;
    }

    if (items.length === 0 && !currentOrder) {
      setToastMessage("Your cart is empty.");
      setToastType("error");
      navigate("/cart");
      return;
    }

    // Create the order if not created yet
    if (!currentOrder) {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const orderPayload = {
        address,
        shippingMethod,
        couponCode: coupon?.code,
        idempotencyKey,
      };

      try {
        const order = await dispatch(createOrder(orderPayload)).unwrap();
        await dispatch(createPaymentIntent(order._id)).unwrap();
        setStep(2);
      } catch (err) {
        setToastMessage(err || "Failed to create order");
        setToastType("error");
      }
    } else {
      setStep(2);
    }
  };

  const handleExecutePayment = async () => {
    if (!currentOrder?._id) return;
    try {
      await dispatch(confirmSandboxPayment(currentOrder._id)).unwrap();
      dispatch(clearCart());
      setStep(3);
      setToastMessage("Payment completed successfully!");
      setToastType("success");
    } catch (err) {
      setToastMessage(err || "Payment failed");
      setToastType("error");
    }
  };

  // Step 3: Order Confirmation View
  if (step === 3 && currentOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Payment Confirmed
        </span>
        <h1 className="font-display text-3xl font-bold text-ink mt-3 mb-2">Thank you for your order!</h1>
        <p className="text-sm text-ink/60 mb-6">
          Order number: <span className="font-mono font-bold text-ink">{currentOrder.orderNumber}</span>
        </p>

        <div className="bg-white rounded-soft border border-sage-100 p-6 text-left shadow-sm space-y-4 max-w-xl mx-auto mb-8">
          <h3 className="font-semibold text-sm text-ink border-b border-sage-100 pb-2">Order Receipt Summary</h3>

          <div className="space-y-2 text-xs">
            {currentOrder.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="font-semibold">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-sage-100 space-y-1.5 text-xs text-ink/80">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${currentOrder.pricing?.subtotal?.toFixed(2)}</span>
            </div>
            {currentOrder.pricing?.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-${currentOrder.pricing.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping ({currentOrder.shipping?.method}):</span>
              <span>
                {currentOrder.pricing?.shipping === 0 ? "FREE" : `$${currentOrder.pricing?.shipping?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-sage-100">
              <span>Total Paid:</span>
              <span className="text-sage-700">${currentOrder.pricing?.total?.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-sage-100 text-xs text-ink/70">
            <p className="font-semibold text-ink">Shipping To:</p>
            <p>{currentOrder.address?.fullName}</p>
            <p>{currentOrder.address?.line1}, {currentOrder.address?.city}, {currentOrder.address?.postalCode}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            to="/account"
            onClick={() => dispatch(resetOrderCreation())}
            className="rounded-soft bg-sage-600 text-white px-6 py-2.5 text-xs font-semibold hover:bg-sage-700 transition-colors shadow-sm"
          >
            View in My Orders
          </Link>
          <Link
            to="/products"
            onClick={() => dispatch(resetOrderCreation())}
            className="rounded-soft border border-sage-200 bg-white text-ink px-6 py-2.5 text-xs font-semibold hover:bg-sage-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <h1 className="font-display text-3xl font-bold text-ink mb-2">Secure Checkout</h1>
      <p className="text-xs text-ink/60 mb-8">Complete your order with 256-bit encrypted checkout.</p>

      {/* Checkout Progress Stepper */}
      <div className="flex items-center gap-4 mb-8 text-xs font-semibold">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-sage-700" : "text-ink/40"}`}>
          <span className="w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center text-[10px]">1</span>
          <span>Shipping & Delivery</span>
        </div>
        <span className="text-ink/30">──</span>
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-sage-700" : "text-ink/40"}`}>
          <span className="w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center text-[10px]">2</span>
          <span>Payment</span>
        </div>
        <span className="text-ink/30">──</span>
        <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-sage-700" : "text-ink/40"}`}>
          <span className="w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center text-[10px]">3</span>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm text-ink pb-2 border-b border-sage-100">
                  1. Shipping Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={address.fullName}
                      onChange={handleAddressChange}
                      className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={address.phone}
                      onChange={handleAddressChange}
                      className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="line1"
                    required
                    placeholder="123 Sprout St, Apt 4B"
                    value={address.line1}
                    onChange={handleAddressChange}
                    className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={address.city}
                      onChange={handleAddressChange}
                      className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={address.postalCode}
                      onChange={handleAddressChange}
                      className="w-full text-xs rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-ink pb-2 border-b border-sage-100">
                  2. Shipping Speed
                </h3>

                <label
                  className={`flex items-center justify-between p-3 rounded-soft border cursor-pointer transition-all ${
                    shippingMethod === "standard"
                      ? "border-sage-600 bg-sage-50/50"
                      : "border-sage-100 hover:border-sage-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className="text-sage-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-ink block">Standard Delivery (3-5 Business Days)</span>
                      <span className="text-[11px] text-ink/50">Tracked ground shipping</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sage-700">
                    {subtotal >= shippingThreshold ? "FREE" : "$4.99"}
                  </span>
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-soft border cursor-pointer transition-all ${
                    shippingMethod === "express"
                      ? "border-sage-600 bg-sage-50/50"
                      : "border-sage-100 hover:border-sage-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                      className="text-sage-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-ink block">Express Delivery (1-2 Business Days)</span>
                      <span className="text-[11px] text-ink/50">Priority expedited shipping</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sage-700">$9.99</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={orderCreationStatus === "loading"}
                className="w-full rounded-soft bg-sage-600 text-white py-3 font-semibold text-sm hover:bg-sage-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {orderCreationStatus === "loading" ? "Creating Order..." : "Continue to Payment →"}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-soft bg-sage-50 border border-sage-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-ink">Shipping to: </span>
                  <span className="text-ink/70">{address.fullName}, {address.line1}, {address.city}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sage-700 font-bold hover:underline"
                >
                  Edit
                </button>
              </div>

              <PaymentSandboxModal
                order={currentOrder || { pricing: { total: grandTotal }, address }}
                onPay={handleExecutePayment}
                loading={paymentStatus === "processing"}
              />
            </div>
          )}
        </div>

        {/* Right Side: Order Summary */}
        <div>
          <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-semibold text-sm text-ink pb-2 border-b border-sage-100">
              Review Cart ({items.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-sage-50 text-xs">
              {items.map((item) => (
                <div key={item._id} className="pt-2 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <img
                      src={item.product?.image || "https://via.placeholder.com/50"}
                      alt=""
                      className="w-10 h-10 object-contain rounded border border-sage-100"
                    />
                    <div className="max-w-[150px]">
                      <p className="font-medium text-ink truncate">{item.product?.name}</p>
                      <p className="text-ink/50 text-[10px]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-ink/80 pt-3 border-t border-sage-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({coupon?.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{effectiveShipping === 0 ? "FREE" : `$${effectiveShipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-sage-100">
                <span>Total Due</span>
                <span className="text-sage-700">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
