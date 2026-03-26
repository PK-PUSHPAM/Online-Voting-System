import apiClient from "../lib/apiClient";

export const candidateService = {
  async getByElection(electionId, params = {}) {
    if (!electionId) {
      return { items: [], pagination: null };
    }

    const response = await apiClient.get(`/candidates/election/${electionId}`, {
      params,
    });

    return response?.data?.data || { items: [], pagination: null };
  },

  async getByPost(postId, params = {}) {
    if (!postId) {
      return { items: [], pagination: null };
    }

    const response = await apiClient.get(`/candidates/post/${postId}`, {
      params,
    });

    return response?.data?.data || { items: [], pagination: null };
  },

  async create(electionId, postId, payload) {
    const response = await apiClient.post(
      `/candidates/create/${electionId}/${postId}`,
      payload,
    );
    return response?.data?.data || null;
  },

  async update(candidateId, payload) {
    const response = await apiClient.patch(
      `/candidates/update/${candidateId}`,
      payload,
    );
    return response?.data?.data || null;
  },

  async approve(candidateId, payload) {
    const response = await apiClient.patch(
      `/candidates/approve/${candidateId}`,
      payload,
    );
    return response?.data?.data || null;
  },

  async remove(candidateId) {
    const response = await apiClient.delete(
      `/candidates/delete/${candidateId}`,
    );
    return response?.data?.data || null;
  },
};
