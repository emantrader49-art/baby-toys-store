import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { fetchCart, mergeGuestCartOnLogin } from "../features/cart/cartSlice.js";
import { fetchWishlist } from "../features/wishlist/wishlistSlice.js";

export default function MainLayout() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(mergeGuestCartOnLogin()).then(() => {
        dispatch(fetchCart());
      });
      dispatch(fetchWishlist());
    } else {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink font-body">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
