import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data || {};

export const systemNotificationService = {
  async getMyNotifications({ page = 1, limit = 10, unreadOnly } = {}) {
    const params = {
      page,
      limit,
    };

    if (typeof unreadOnly === "boolean") {
      params.unreadOnly = unreadOnly;
    }

    const response = await apiClient.get("/notifications/me", {
      params,
    });

    return extractData(response);
  },

  async markAsRead(notificationId) {
    if (!notificationId) return {};

    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );

    return extractData(response);
  },

  async markAllAsRead() {
    const response = await apiClient.patch("/notifications/mark-all-read");
    return extractData(response);
  },

  async deleteNotification(notificationId) {
    if (!notificationId) return {};

    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return extractData(response);
  },

  async clearReadNotifications() {
    const response = await apiClient.delete("/notifications/clear-read");
    return extractData(response);
  },
};
