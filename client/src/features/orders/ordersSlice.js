import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../services/apiClient.js";

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderPayload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/orders", orderPayload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to create order");
    }
  }
);

export const createPaymentIntent = createAsyncThunk(
  "orders/createPaymentIntent",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/payments/create-intent", { orderId });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to initialize payment");
    }
  }
);

export const confirmSandboxPayment = createAsyncThunk(
  "orders/confirmSandboxPayment",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/payments/confirm-sandbox", { orderId });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Payment confirmation failed");
    }
  }
);

export const fetchMyOrders = createAsyncThunk("orders/fetchMyOrders", async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get("/orders");
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch orders");
  }
});

export const fetchOrderById = createAsyncThunk("orders/fetchOrderById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch order");
  }
});

export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAllOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/orders", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to fetch admin orders");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ orderId, status, note }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/orders/${orderId}/status`, { status, note });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || "Failed to update status");
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    myOrders: [],
    currentOrder: null,
    adminOrders: [],
    adminMeta: null,
    paymentIntent: null,
    status: "idle",
    orderCreationStatus: "idle",
    paymentStatus: "idle",
    error: null,
  },
  reducers: {
    resetOrderCreation: (state) => {
      state.orderCreationStatus = "idle";
      state.currentOrder = null;
      state.paymentIntent = null;
      state.paymentStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.orderCreationStatus = "loading";
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderCreationStatus = "succeeded";
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderCreationStatus = "failed";
        state.error = action.payload;
      })
      // createPaymentIntent
      .addCase(createPaymentIntent.pending, (state) => {
        state.paymentStatus = "loading";
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.paymentStatus = "intent_created";
        state.paymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.paymentStatus = "failed";
        state.error = action.payload;
      })
      // confirmSandboxPayment
      .addCase(confirmSandboxPayment.pending, (state) => {
        state.paymentStatus = "processing";
      })
      .addCase(confirmSandboxPayment.fulfilled, (state, action) => {
        state.paymentStatus = "succeeded";
        state.currentOrder = action.payload;
      })
      .addCase(confirmSandboxPayment.rejected, (state, action) => {
        state.paymentStatus = "failed";
        state.error = action.payload;
      })
      // fetchMyOrders
      .addCase(fetchMyOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // fetchOrderById
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      // fetchAllOrders (admin)
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.adminOrders = action.payload.data;
        state.adminMeta = action.payload.meta;
      })
      // updateOrderStatus (admin)
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.adminOrders.findIndex((o) => o._id === updated._id);
        if (idx !== -1) {
          state.adminOrders[idx] = updated;
        }
        if (state.currentOrder?._id === updated._id) {
          state.currentOrder = updated;
        }
      });
  },
});

export const { resetOrderCreation } = ordersSlice.actions;
export default ordersSlice.reducer;
