import axios from "axios";
import { API_BASE_URL } from "./env";

const AUTH_ROUTES_TO_SKIP_REFRESH = [
  "/auth/login",
  "/auth/login-with-otp",
  "/auth/register",
  "/auth/send-otp",
  "/auth/reset-password",
  "/auth/refresh-token",
  "/auth/logout",
];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const isFormData = (payload) => {
  return typeof FormData !== "undefined" && payload instanceof FormData;
};

const getRequestUrl = (config = {}) => {
  return String(config.url || "");
};

const shouldSkipRefresh = (config = {}) => {
  const requestUrl = getRequestUrl(config);
  return AUTH_ROUTES_TO_SKIP_REFRESH.some((route) =>
    requestUrl.includes(route),
  );
};

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

const buildFriendlyError = (error) => {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.friendlyMessage;

  const networkMessage =
    error?.code === "ECONNABORTED"
      ? "Server response timed out. Please try again."
      : error?.message === "Network Error"
        ? "Unable to connect to the server. Check backend URL, CORS, and deployment status."
        : error?.message;

  return {
    ...error,
    friendlyMessage:
      serverMessage ||
      networkMessage ||
      "Something went wrong while talking to the server.",
  };
};

apiClient.interceptors.request.use(
  (config) => {
    if (isFormData(config.data)) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(buildFriendlyError(error)),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh-token");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("online-voting-session-expired"));
        }

        return Promise.reject(buildFriendlyError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(buildFriendlyError(error));
  },
);

export default apiClient;
