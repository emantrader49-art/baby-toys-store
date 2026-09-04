import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/apiClient.js";

export const fetchDashboardOverview = createAsyncThunk(
  "analytics/fetchDashboardOverview",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/analytics/overview");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch analytics overview");
    }
  }
);

export const fetchSalesTrends = createAsyncThunk(
  "analytics/fetchSalesTrends",
  async (days = 30, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/analytics/sales-trends?days=${days}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch sales trends");
    }
  }
);

export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async (limit = 5, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/analytics/top-products?limit=${limit}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch top products");
    }
  }
);

export const fetchCategoryPerformance = createAsyncThunk(
  "analytics/fetchCategoryPerformance",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/analytics/category-performance");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch category performance");
    }
  }
);

export const fetchInventoryAlerts = createAsyncThunk(
  "analytics/fetchInventoryAlerts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/analytics/inventory-alerts");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch inventory alerts");
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  "analytics/fetchRecentActivities",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/analytics/activities");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch activities");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    overview: null,
    salesTrends: [],
    topProducts: [],
    categoryPerformance: [],
    inventoryAlerts: [],
    recentActivities: { logs: [], recentOrders: [] },
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSalesTrends.fulfilled, (state, action) => {
        state.salesTrends = action.payload;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload;
      })
      .addCase(fetchCategoryPerformance.fulfilled, (state, action) => {
        state.categoryPerformance = action.payload;
      })
      .addCase(fetchInventoryAlerts.fulfilled, (state, action) => {
        state.inventoryAlerts = action.payload;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivities = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
