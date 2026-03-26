import apiClient from "../lib/apiClient";

export const resultService = {
  async getElectionResults(electionId) {
    const response = await apiClient.get(`/results/election/${electionId}`);
    return response?.data?.data || null;
  },

  async getPostResults(electionId, postId) {
    const response = await apiClient.get(
      `/results/election/${electionId}/post/${postId}`,
    );
    return response?.data?.data || null;
  },
};
