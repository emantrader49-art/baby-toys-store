import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh-token cookie
});

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || apiClient.post("/auth/refresh");
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
