import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient, setAccessToken } from "../../services/apiClient.js";

export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post("/auth/login", { email, password });
    setAccessToken(data.data.accessToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Login failed");
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post("/auth/register", payload);
    setAccessToken(data.data.accessToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || "Registration failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await apiClient.post("/auth/logout");
  setAccessToken(null);
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
