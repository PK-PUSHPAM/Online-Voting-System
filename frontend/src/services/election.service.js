import apiClient from "../lib/apiClient";

export const electionService = {
  async getAll(params = {}) {
    const response = await apiClient.get("/elections/all", { params });
    return response?.data?.data || { items: [], pagination: null };
  },

  async create(payload) {
    const response = await apiClient.post("/elections/create", payload);
    return response?.data?.data || null;
  },

  async getById(electionId) {
    const response = await apiClient.get(`/elections/${electionId}`);
    return response?.data?.data || null;
  },

  async update(electionId, payload) {
    const response = await apiClient.patch(
      `/elections/update/${electionId}`,
      payload,
    );
    return response?.data?.data || null;
  },

  async remove(electionId) {
    const response = await apiClient.delete(`/elections/delete/${electionId}`);
    return response?.data?.data || null;
  },
};
