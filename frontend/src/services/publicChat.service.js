import apiClient from "../lib/apiClient";
import { API_BASE_URL } from "../lib/env";

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

  async deleteMessage(messageId, reason = "Removed by administrator") {
    if (!messageId) return {};

    const response = await apiClient.delete(
      `/chat/public/messages/${messageId}`,
      {
        data: {
          reason,
        },
      },
    );

    return extractData(response);
  },

  async blockUser(userId, reason = "Blocked by administrator") {
    if (!userId) return {};

    const response = await apiClient.patch(`/chat/public/block/${userId}`, {
      reason,
    });

    return extractData(response);
  },

  async unblockUser(userId) {
    if (!userId) return {};

    const response = await apiClient.patch(`/chat/public/unblock/${userId}`);

    return extractData(response);
  },

  async getBlockedUsers({ page = 1, limit = 20 } = {}) {
    const response = await apiClient.get("/chat/public/blocked-users", {
      params: {
        page,
        limit,
      },
    });

    return extractData(response);
  },

  createPublicChatStream({ onEvent, onError, onOpen } = {}) {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return null;
    }

    const streamUrl = `${API_BASE_URL}/chat/public/stream`;

    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    eventSource.addEventListener("open", () => {
      onOpen?.();
    });

    eventSource.addEventListener("public_chat_event", (event) => {
      try {
        const parsedEvent = JSON.parse(event.data);
        onEvent?.(parsedEvent);
      } catch (error) {
        console.warn(`Failed to parse public chat event: ${error.message}`);
      }
    });

    eventSource.addEventListener("error", (error) => {
      onError?.(error);
    });

    return eventSource;
  },
};
