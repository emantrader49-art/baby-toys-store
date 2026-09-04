import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/apiClient.js";

const GUEST_CART_KEY = "little_sprout_guest_cart";

function loadGuestCart() {
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save guest cart:", err);
  }
}

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.user) {
    const guestItems = loadGuestCart();
    return { items: guestItems, subtotal: guestItems.reduce((s, i) => s + (i.unitPrice * i.quantity || 0), 0) };
  }
  try {
    const { data } = await apiClient.get("/cart");
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch cart");
  }
});

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ product, variantId = null, quantity = 1 }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    const productId = product._id || product.id;
    const price = product.price;

    if (!auth.user) {
      const items = loadGuestCart();
      const existing = items.find(
        (i) => i.product._id === productId && String(i.variantId || "") === String(variantId || "")
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          _id: `guest_${Date.now()}_${Math.random()}`,
          product: {
            _id: productId,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url || product.image,
            price: product.price,
          },
          variantId,
          quantity,
          unitPrice: price,
          lineTotal: price * quantity,
          availableStock: product.stock,
        });
      }
      saveGuestCart(items);
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return { items, subtotal: Math.round(subtotal * 100) / 100 };
    }

    try {
      const { data } = await apiClient.post("/cart/items", { productId, variantId, quantity });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to add item to cart");
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user) {
      let items = loadGuestCart();
      if (quantity <= 0) {
        items = items.filter((i) => i._id !== itemId);
      } else {
        const target = items.find((i) => i._id === itemId);
        if (target) {
          target.quantity = quantity;
          target.lineTotal = target.unitPrice * quantity;
        }
      }
      saveGuestCart(items);
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return { items, subtotal: Math.round(subtotal * 100) / 100 };
    }

    try {
      const { data } = await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to update item quantity");
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user) {
      let items = loadGuestCart();
      items = items.filter((i) => i._id !== itemId);
      saveGuestCart(items);
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return { items, subtotal: Math.round(subtotal * 100) / 100 };
    }

    try {
      const { data } = await apiClient.delete(`/cart/items/${itemId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to remove item");
    }
  }
);

export const clearCart = createAsyncThunk("cart/clearCart", async (_, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.user) {
    saveGuestCart([]);
    return { items: [], subtotal: 0 };
  }

  try {
    const { data } = await apiClient.delete("/cart");
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Failed to clear cart");
  }
});

export const mergeGuestCartOnLogin = createAsyncThunk(
  "cart/mergeGuestCartOnLogin",
  async (_, { rejectWithValue }) => {
    const guestItems = loadGuestCart();
    if (!guestItems.length) return null;

    try {
      const payload = guestItems.map((i) => ({
        productId: i.product._id,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      const { data } = await apiClient.post("/cart/merge", { items: payload });
      localStorage.removeItem(GUEST_CART_KEY);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to merge cart");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    subtotal: 0,
    coupon: null,
    discount: 0,
    shippingThreshold: 50,
    shippingFee: 4.99,
    status: "idle",
    error: null,
  },
  reducers: {
    applyCoupon: (state, action) => {
      const code = action.payload?.toUpperCase();
      if (code === "WELCOME10") {
        state.coupon = { code: "WELCOME10", type: "percent", value: 10 };
        state.discount = Math.round((state.subtotal * 0.1) * 100) / 100;
      } else if (code === "SAVE5") {
        state.coupon = { code: "SAVE5", type: "fixed", value: 5 };
        state.discount = Math.min(5, state.subtotal);
      } else {
        state.coupon = null;
        state.discount = 0;
      }
    },
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
    },
  },
  extraReducers: (builder) => {
    const handleCartData = (state, action) => {
      if (!action.payload) return;
      state.status = "succeeded";
      state.items = action.payload.items || [];
      state.subtotal = action.payload.subtotal || 0;
      // recalculate coupon if exists
      if (state.coupon) {
        if (state.coupon.type === "percent") {
          state.discount = Math.round((state.subtotal * (state.coupon.value / 100)) * 100) / 100;
        } else {
          state.discount = Math.min(state.coupon.value, state.subtotal);
        }
      }
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, handleCartData)
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, handleCartData)
      .addCase(updateCartItem.fulfilled, handleCartData)
      .addCase(removeCartItem.fulfilled, handleCartData)
      .addCase(clearCart.fulfilled, handleCartData)
      .addCase(mergeGuestCartOnLogin.fulfilled, (state, action) => {
        if (action.payload) handleCartData(state, action);
      });
  },
});

export const { applyCoupon, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
