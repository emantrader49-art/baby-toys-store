import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyOrders } from "../features/orders/ordersSlice.js";
import { fetchWishlist, removeFromWishlist } from "../features/wishlist/wishlistSlice.js";
import { addToCart } from "../features/cart/cartSlice.js";
import { logout } from "../features/auth/authSlice.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Toast from "../components/Toast.jsx";

export default function AccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const user = useSelector((s) => s.auth.user);
  const { myOrders, status: ordersStatus } = useSelector((s) => s.orders);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);

  const initialTab = params.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/account");
      return;
    }
    dispatch(fetchMyOrders());
    dispatch(fetchWishlist());
  }, [dispatch, user, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setParams({ tab });
  };

  const handleAddToCartFromWishlist = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    setToastMessage(`Added "${product.name}" to your cart!`);
    setToastType("success");
  };

  const handleRemoveFromWishlist = (productId) => {
    dispatch(removeFromWishlist(productId));
    setToastMessage("Removed from wishlist");
    setToastType("info");
  };

  if (!user) return null;

  const isStaffOrAdmin = ["admin", "staff"].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      {/* Header Profile Greeting */}
      <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display font-bold text-xl">
            {user.name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-sage-50 text-sage-700 border border-sage-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-ink/60 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isStaffOrAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-soft bg-apricot-500 text-white text-xs font-semibold hover:bg-apricot-400 transition-colors shadow-sm flex items-center gap-1.5"
            >
              📊 Open Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => dispatch(logout())}
            className="px-4 py-2 rounded-soft border border-sage-200 text-xs font-semibold text-ink hover:bg-sage-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <button
            onClick={() => handleTabChange("orders")}
            className={`w-full text-left px-4 py-3 rounded-soft text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === "orders" ? "bg-sage-600 text-white shadow-sm" : "bg-white text-ink/70 hover:bg-sage-50"
            }`}
          >
            <span className="flex items-center gap-2">📦 My Orders</span>
            <span className="text-[11px] opacity-80">({myOrders.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("wishlist")}
            className={`w-full text-left px-4 py-3 rounded-soft text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === "wishlist" ? "bg-sage-600 text-white shadow-sm" : "bg-white text-ink/70 hover:bg-sage-50"
            }`}
          >
            <span className="flex items-center gap-2">❤️ My Wishlist</span>
            <span className="text-[11px] opacity-80">({wishlistItems.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("profile")}
            className={`w-full text-left px-4 py-3 rounded-soft text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === "profile" ? "bg-sage-600 text-white shadow-sm" : "bg-white text-ink/70 hover:bg-sage-50"
            }`}
          >
            <span className="flex items-center gap-2">👤 Profile Details</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="md:col-span-3">
          {/* TAB 1: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-ink mb-4">Order History</h2>

              {ordersStatus === "loading" ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-36 rounded-soft bg-sage-50 animate-pulse" />
                  ))}
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-white rounded-soft border border-sage-100 p-8 text-center">
                  <span className="text-3xl block mb-2">📦</span>
                  <h3 className="font-semibold text-sm text-ink mb-1">No orders yet</h3>
                  <p className="text-xs text-ink/60 mb-4">When you purchase toys, your receipts and tracking appear here.</p>
                  <Link
                    to="/products"
                    className="inline-block px-4 py-2 rounded-soft bg-sage-600 text-white text-xs font-medium hover:bg-sage-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sage-100">
                      <div>
                        <span className="text-xs font-mono font-bold text-ink block">{order.orderNumber}</span>
                        <span className="text-[11px] text-ink/50">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-bold text-sm text-sage-700">
                          ${order.pricing?.total?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || "https://via.placeholder.com/60"}
                              alt=""
                              className="w-12 h-12 rounded border border-sage-100 object-contain p-1"
                            />
                            <div>
                              <p className="font-semibold text-ink">{item.name}</p>
                              <p className="text-ink/50 text-[11px]">
                                Qty: {item.quantity} • ${(item.unitPrice || 0).toFixed(2)} each
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Tracking Timeline */}
                    <div className="pt-3 border-t border-sage-100 text-xs bg-sage-50/50 p-3 rounded-soft">
                      <div className="flex items-center justify-between text-[11px] text-ink/60">
                        <span>
                          <strong>Delivery Status:</strong> {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span>
                          <strong>Payment:</strong> {order.payment?.status?.toUpperCase()} (Stripe)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-ink mb-4">Saved Favorites ({wishlistItems.length})</h2>

              {wishlistItems.length === 0 ? (
                <div className="bg-white rounded-soft border border-sage-100 p-8 text-center">
                  <span className="text-3xl block mb-2">❤️</span>
                  <h3 className="font-semibold text-sm text-ink mb-1">Your wishlist is empty</h3>
                  <p className="text-xs text-ink/60 mb-4">Click the heart icon on any toy to save it for later!</p>
                  <Link
                    to="/products"
                    className="inline-block px-4 py-2 rounded-soft bg-sage-600 text-white text-xs font-medium hover:bg-sage-700 transition-colors"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-soft border border-sage-100 p-4 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex gap-3">
                        <Link to={`/products/${product.slug}`} className="w-20 h-20 rounded bg-sage-50 overflow-hidden flex-shrink-0">
                          <img
                            src={product.images?.[0]?.url || "https://via.placeholder.com/100"}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </Link>
                        <div>
                          <Link to={`/products/${product.slug}`} className="font-semibold text-xs text-ink hover:text-sage-700 line-clamp-2">
                            {product.name}
                          </Link>
                          <span className="font-bold text-sm text-sage-700 block mt-1">
                            ${product.price?.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-ink/50 uppercase font-bold">{product.ageRange}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-sage-100">
                        <button
                          onClick={() => handleAddToCartFromWishlist(product)}
                          className="flex-1 rounded-soft bg-sage-600 text-white py-1.5 text-xs font-semibold hover:bg-sage-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemoveFromWishlist(product._id)}
                          className="px-3 py-1.5 rounded-soft border border-sage-200 text-xs text-ink/60 hover:text-rose-600 hover:border-rose-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-soft border border-sage-100 p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-ink mb-2">Account Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-sage-50/50 rounded-soft border border-sage-100">
                  <span className="text-ink/50 block mb-1">Full Name</span>
                  <span className="font-semibold text-ink text-sm">{user.name}</span>
                </div>
                <div className="p-3 bg-sage-50/50 rounded-soft border border-sage-100">
                  <span className="text-ink/50 block mb-1">Email Address</span>
                  <span className="font-semibold text-ink text-sm">{user.email}</span>
                </div>
                <div className="p-3 bg-sage-50/50 rounded-soft border border-sage-100">
                  <span className="text-ink/50 block mb-1">Account Role</span>
                  <span className="font-semibold text-ink text-sm uppercase">{user.role}</span>
                </div>
                <div className="p-3 bg-sage-50/50 rounded-soft border border-sage-100">
                  <span className="text-ink/50 block mb-1">Member Since</span>
                  <span className="font-semibold text-ink text-sm">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active Member"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
