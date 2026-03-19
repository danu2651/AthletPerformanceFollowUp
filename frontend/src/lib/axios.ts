import axios from "axios";

const api = axios.create({
  /**
   * FIX: Using 127.0.0.1 instead of localhost avoids DNS issues
   * and prevents 'ERR_CONNECTION_REFUSED'.
   */
  baseURL: "http://127.0.0.1:5000/api",
});

/**
 * AUTH INTERCEPTOR:
 * This automatically attaches your 'token' to every request sent
 * to the backend. Essential for the Dashboard to know who you are.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
