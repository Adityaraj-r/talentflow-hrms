import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // send/receive the httpOnly accessToken/refreshToken cookies
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // accessToken now lives in an httpOnly cookie and is attached to every
    // request automatically by the browser — it's no longer readable or
    // settable from JS at all, which is the whole point (an XSS payload
    // can't steal it the way it could from localStorage).
    // idToken is a separate, unrelated auth mechanism — left untouched.
    const idToken = localStorage.getItem("idToken");
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = []; // { resolve, reject } pairs waiting on the in-flight refresh

const processQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshQueue = [];
};

const forceLogout = async () => {
  // Best-effort: also tell the server to revoke the refresh token, so the
  // session doesn't linger server-side until it naturally expires in 7 days.
  try {
    await refreshClient.post("/auth/logout");
  } catch {
    // already logging out regardless of whether this succeeds
  }
  localStorage.removeItem("idToken");
  localStorage.removeItem("userRole");

  // Guard against a redirect loop: if we're already sitting on /login with
  // no session (the normal case for a first-time visitor), this 401 →
  // refresh-fails → forceLogout chain would otherwise redirect to /login,
  // which reloads the page, which re-mounts AuthContext, which calls
  // /auth/profile again — repeating forever. Only redirect if we're
  // actually somewhere that requires a session.
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
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
      if (isRefreshing) {
        // A refresh is already in flight — wait for it instead of firing
        // a second one, then retry this request (the new accessToken
        // cookie will already be set by the time it resumes).
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest._retry = true;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // No body needed — the browser sends the httpOnly refreshToken
        // cookie automatically. The response sets new cookies via
        // Set-Cookie; nothing for JS to store.
        await refreshClient.post("/auth/refresh");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        await forceLogout();
        return Promise.reject(error.response?.data || { message: error.message });
      } finally {
        isRefreshing = false;
      }
    }

    if (isAuthError) {
      // 401 on login/refresh itself, or already retried once — give up.
      await forceLogout();
    }

    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default apiClient;