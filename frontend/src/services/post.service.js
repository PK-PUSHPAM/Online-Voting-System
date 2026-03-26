import apiClient from "../lib/apiClient";

export const postService = {
  async getByElection(electionId, params = {}) {
    if (!electionId) {
      return { items: [], pagination: null };
    }

    const response = await apiClient.get(`/posts/election/${electionId}`, {
      params,
    });

    return response?.data?.data || { items: [], pagination: null };
  },

  async create(electionId, payload) {
    const response = await apiClient.post(
      `/posts/create/${electionId}`,
      payload,
    );
    return response?.data?.data || null;
  },

  async getById(postId) {
    const response = await apiClient.get(`/posts/${postId}`);
    return response?.data?.data || null;
  },

  async update(postId, payload) {
    const response = await apiClient.patch(`/posts/update/${postId}`, payload);
    return response?.data?.data || null;
  },

  async remove(postId) {
    const response = await apiClient.delete(`/posts/delete/${postId}`);
    return response?.data?.data || null;
  },
};
