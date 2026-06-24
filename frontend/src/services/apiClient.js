import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Plain axios instance with NO interceptors, used only for the refresh call
// itself — keeps the refresh request from ever recursing back into this
// same response interceptor.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = []; // { resolve, reject } pairs waiting on the in-flight refresh

const processQueue = (error, newAccessToken = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  refreshQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("idToken");
  localStorage.removeItem("userRole");
  window.location.href = "/login";
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const isAuthError = error.response?.status === 401;
    const isAuthEndpointCall =
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login");

    // Only attempt a silent refresh for a normal protected-route 401 —
    // never for the login/refresh endpoints themselves, and never twice
    // for the same request.
    if (isAuthError && !isAuthEndpointCall && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error.response?.data || { message: error.message });
      }

      if (isRefreshing) {
        // A refresh is already in flight — wait for it instead of firing
        // a second one, then retry this request with the new token.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post("/auth/refresh", { refreshToken });
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(error.response?.data || { message: error.message });
      } finally {
        isRefreshing = false;
      }
    }

    if (isAuthError) {
      // 401 on login/refresh itself, or already retried once — give up,
      // same as the original behavior.
      forceLogout();
    }

    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default apiClient;