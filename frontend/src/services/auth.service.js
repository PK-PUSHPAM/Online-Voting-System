import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data;

export const authService = {
  async sendOtp(payload) {
    const response = await apiClient.post("/auth/send-otp", payload);
    return extractData(response);
  },

  async register(payload) {
    const response = await apiClient.post("/auth/register", payload);
    return extractData(response);
  },

  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return extractData(response);
  },

  async loginWithOtp(payload) {
    const response = await apiClient.post("/auth/login-with-otp", payload);
    return extractData(response);
  },

  async resetPassword(payload) {
    const response = await apiClient.post("/auth/reset-password", payload);
    return extractData(response);
  },

  async getCurrentUser() {
    const response = await apiClient.get("/auth/me");
    return extractData(response);
  },

  async logout() {
    const response = await apiClient.post("/auth/logout");
    return response?.data;
  },
};
