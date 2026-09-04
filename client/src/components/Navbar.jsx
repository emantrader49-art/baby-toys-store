import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice.js";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const cartItems = useSelector((s) => s.cart.items || []);
  const wishlistItems = useSelector((s) => s.wishlist.items || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalWishlistCount = wishlistItems.length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isStaffOrAdmin = user && ["admin", "staff"].includes(user.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-sage-100">
      {/* Top promotional bar */}
      <div className="bg-sage-700 text-white text-xs text-center py-1.5 px-4 font-medium tracking-wide">
        🌿 100% Non-Toxic & Safety Certified • Free Shipping On Orders Over $50 with code <span className="underline font-bold">WELCOME10</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
            🌱
          </span>
          <span className="font-display text-xl font-bold text-sage-700 tracking-tight">Little Sprout</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search safe toys, rattles, Montessori..."
              className="w-full text-xs rounded-full border border-sage-100 bg-sage-50/50 py-2 pl-4 pr-10 focus:bg-white focus:border-sage-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-3 top-2 text-ink/40 hover:text-sage-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Navigation Items & Actions */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/products" className="text-ink/80 hover:text-sage-600 transition-colors hidden sm:inline">
            Shop Catalog
          </Link>

          {/* Admin Dashboard shortcut if admin/staff */}
          {isStaffOrAdmin && (
            <Link
              to="/admin"
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-apricot-100 text-apricot-500 hover:bg-apricot-200 transition-colors flex items-center gap-1"
            >
              📊 <span>Admin</span>
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            to="/account?tab=wishlist"
            className="relative p-1.5 text-ink/70 hover:text-sage-600 transition-colors"
            title="Wishlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {totalWishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-apricot-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalWishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link with Badge */}
          <Link
            to="/cart"
            className="relative p-1.5 text-ink/70 hover:text-sage-600 transition-colors flex items-center gap-1.5"
            title="Shopping Cart"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-sage-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-sage-700">Cart</span>
          </Link>

          {/* User Account / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink bg-sage-50 py-1.5 px-3 rounded-full hover:bg-sage-100 transition-colors"
              >
                <span>{user.name.split(" ")[0]}</span>
                <span className="text-[10px] text-ink/40">▼</span>
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-soft shadow-lg border border-sage-100 py-2 z-50 animate-fade-in"
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-sage-100">
                    <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-[10px] text-ink/50 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-sage-700 bg-sage-50 px-2 py-0.5 rounded">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-ink/80 hover:bg-sage-50 hover:text-sage-700"
                  >
                    📦 My Orders & Profile
                  </Link>

                  {isStaffOrAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-apricot-500 font-semibold hover:bg-apricot-50"
                    >
                      📊 Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      dispatch(logout());
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    🚪 Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs text-ink/80 hover:text-sage-600">
                Log in
              </Link>
              <Link
                to="/register"
                className="text-xs bg-sage-600 text-white px-3 py-1.5 rounded-full hover:bg-sage-700 transition-colors font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
