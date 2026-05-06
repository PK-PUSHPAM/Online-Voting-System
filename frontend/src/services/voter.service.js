import apiClient from "../lib/apiClient";

export const voterService = {
  async getPublishedElections() {
    const response = await apiClient.get("/elections/voter/published");

    return (
      response?.data?.data || {
        count: 0,
        elections: [],
        upcomingCount: 0,
        activeCount: 0,
        upcomingElections: [],
        activeElections: [],
      }
    );
  },

  async getActiveElections() {
    const response = await apiClient.get("/elections/voter/active");
    return response?.data?.data || { count: 0, elections: [] };
  },

  async getElectionPostsWithCandidates(electionId) {
    if (!electionId) {
      return {
        election: null,
        canVoteNow: false,
        posts: [],
      };
    }

    const response = await apiClient.get(`/posts/voter/election/${electionId}`);

    const data = response?.data?.data;

    if (Array.isArray(data)) {
      return {
        election: null,
        canVoteNow: true,
        posts: data,
      };
    }

    return (
      data || {
        election: null,
        canVoteNow: false,
        posts: [],
      }
    );
  },
};
