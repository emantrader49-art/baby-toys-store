import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import cartReducer from "../features/cart/cartSlice.js";
import productsReducer from "../features/products/productsSlice.js";
import ordersReducer from "../features/orders/ordersSlice.js";
import wishlistReducer from "../features/wishlist/wishlistSlice.js";
import analyticsReducer from "../features/analytics/analyticsSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    orders: ordersReducer,
    wishlist: wishlistReducer,
    analytics: analyticsReducer,
  },
});
