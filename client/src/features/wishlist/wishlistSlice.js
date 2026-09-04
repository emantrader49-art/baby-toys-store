import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/apiClient.js";

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { getState, rejectWithValue }) => {
  const { auth } = getState();
  if (!auth.user) return { products: [] };

  try {
    const { data } = await apiClient.get("/wishlist");
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch wishlist");
  }
});

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user) return rejectWithValue("Please log in to save items to your wishlist");

    try {
      const { data } = await apiClient.post(`/wishlist/${productId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to add to wishlist");
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.user) return rejectWithValue("Please log in");

    try {
      const { data } = await apiClient.delete(`/wishlist/${productId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to remove from wishlist");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.products || [];
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items = action.payload?.products || [];
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload?.products || [];
      });
  },
});

export default wishlistSlice.reducer;
