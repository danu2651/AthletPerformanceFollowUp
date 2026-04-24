import axios from "axios";

const api = axios.create({
  // Using 127.0.0.1 is more stable than 'localhost' in some Node environments
  baseURL: "http://127.0.0.1:5000/api",
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Unified key name: athlete_token
      const token = localStorage.getItem("athlete_token");
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
