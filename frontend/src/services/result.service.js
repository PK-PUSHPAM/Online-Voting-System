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

  async getVoterResultElections() {
    const response = await apiClient.get("/results/voter/elections");
    return (
      response?.data?.data || {
        count: 0,
        elections: [],
      }
    );
  },

  async getVoterElectionResults(electionId) {
    if (!electionId) return null;

    const response = await apiClient.get(
      `/results/voter/election/${electionId}`,
    );
    return response?.data?.data || null;
  },
};
