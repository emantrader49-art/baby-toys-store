import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/apiClient.js";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/products", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch products");
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  "products/fetchProductBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch product");
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/categories");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch categories");
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  "products/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/products/${productId}/reviews`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch reviews");
    }
  }
);

export const submitReview = createAsyncThunk(
  "products/submitReview",
  async ({ productId, rating, title, comment }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/products/${productId}/reviews`, { rating, title, comment });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to submit review");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    meta: null,
    currentProduct: null,
    categories: [],
    reviews: [],
    status: "idle",
    productStatus: "idle",
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.reviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProductBySlug.pending, (state) => {
        state.productStatus = "loading";
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.productStatus = "succeeded";
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.productStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
