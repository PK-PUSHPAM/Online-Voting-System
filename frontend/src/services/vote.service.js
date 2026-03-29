import apiClient from "../lib/apiClient";

export const voteService = {
  async castVote(payload) {
    const response = await apiClient.post("/votes/cast", payload);
    return response?.data?.data || null;
  },

  async getMyVotes(params = {}) {
    const response = await apiClient.get("/votes/my-votes", { params });
    return response?.data?.data || { items: [], pagination: null };
  },

  async getVotesByElectionForAdmin(electionId, params = {}) {
    if (!electionId) {
      return { items: [], pagination: null };
    }

    const response = await apiClient.get(`/votes/election/${electionId}`, {
      params,
    });

    return response?.data?.data || { items: [], pagination: null };
  },
};
