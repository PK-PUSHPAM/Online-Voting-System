import apiClient from "../lib/apiClient";

export const userService = {
  async getPendingVoters(params = {}) {
    const response = await apiClient.get("/users/pending-voters", { params });
    return response?.data?.data || { items: [], pagination: null };
  },

  async getAllVoters(params = {}) {
    const response = await apiClient.get("/users/all-voters", { params });
    return response?.data?.data || { items: [], pagination: null };
  },

  async getVoterById(userId) {
    const response = await apiClient.get(`/users/voter/${userId}`);
    return response?.data?.data || null;
  },

  async approve(userId, payload = {}) {
    const response = await apiClient.patch(
      `/users/approve-voter/${userId}`,
      payload,
    );
    return response?.data?.data || response?.data || null;
  },

  async reject(userId, payload = {}) {
    const response = await apiClient.patch(
      `/users/reject-voter/${userId}`,
      payload,
    );
    return response?.data?.data || response?.data || null;
  },
};
