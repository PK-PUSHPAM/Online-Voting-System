import apiClient from "../lib/apiClient";

export const voterService = {
  async getActiveElections() {
    const response = await apiClient.get("/elections/voter/active");
    return response?.data?.data || { count: 0, elections: [] };
  },

  async getElectionPostsWithCandidates(electionId) {
    if (!electionId) return [];

    const response = await apiClient.get(`/posts/voter/election/${electionId}`);
    return response?.data?.data || [];
  },
};
