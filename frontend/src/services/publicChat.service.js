import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data || {};

export const publicChatService = {
  async getMyStatus() {
    const response = await apiClient.get("/chat/public/status");
    return extractData(response);
  },

  async getMessages({ page = 1, limit = 20, includeDeleted = false } = {}) {
    const response = await apiClient.get("/chat/public/messages", {
      params: {
        page,
        limit,
        includeDeleted,
      },
    });

    return extractData(response);
  },

  async sendMessage(message) {
    const response = await apiClient.post("/chat/public/messages", {
      message,
    });

    return extractData(response);
  },
};
