import apiClient from "../lib/apiClient";

const normalizeCandidate = (candidate, election = null, post = null) => {
  if (!candidate) return candidate;

  return {
    ...candidate,
    electionId:
      typeof candidate.electionId === "object" && candidate.electionId !== null
        ? candidate.electionId
        : election
          ? {
              _id: election._id,
              title: election.title,
              status: election.status,
              isPublished: election.isPublished,
            }
          : candidate.electionId,
    postId:
      typeof candidate.postId === "object" && candidate.postId !== null
        ? candidate.postId
        : post
          ? {
              _id: post._id,
              title: post.title,
              electionId: post.electionId,
            }
          : candidate.postId,
  };
};

export const candidateService = {
  async getAll(params = {}) {
    const {
      page = 1,
      limit = 10,
      electionId = "",
      postId = "",
      approvalStatus = "",
      isActive = "",
      sortBy = "createdAt",
      sortType = "desc",
    } = params;

    if (postId) {
      const response = await apiClient.get(`/candidates/post/${postId}`, {
        params: {
          page,
          limit,
          sortBy,
          sortType,
          ...(approvalStatus ? { approvalStatus } : {}),
          ...(isActive !== "" ? { isActive } : {}),
        },
      });

      return response?.data?.data || { items: [], pagination: null };
    }

    if (electionId) {
      const response = await apiClient.get(
        `/candidates/election/${electionId}`,
        {
          params: {
            page,
            limit,
            sortBy,
            sortType,
            ...(approvalStatus ? { approvalStatus } : {}),
            ...(isActive !== "" ? { isActive } : {}),
          },
        },
      );

      return response?.data?.data || { items: [], pagination: null };
    }

    return { items: [], pagination: null };
  },

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

  async create(firstArg, secondArg, thirdArg) {
    const electionId =
      typeof firstArg === "string" ? firstArg : firstArg?.electionId;

    const postId = typeof firstArg === "string" ? secondArg : firstArg?.postId;

    const payload =
      typeof firstArg === "string"
        ? thirdArg
        : {
            userId: firstArg?.userId,
            fullName: firstArg?.fullName,
            partyName: firstArg?.partyName,
            manifesto: firstArg?.manifesto,
            candidatePhotoUrl: firstArg?.candidatePhotoUrl,
            candidatePhotoPublicId: firstArg?.candidatePhotoPublicId,
            displayOrder: firstArg?.displayOrder,
            isActive: firstArg?.isActive,
          };

    if (!electionId || !postId) {
      throw new Error(
        "Election ID and Post ID are required to create candidate",
      );
    }

    const response = await apiClient.post(
      `/candidates/create/${electionId}/${postId}`,
      payload,
    );

    return response?.data?.data || null;
  },

  async getById(candidateId) {
    const response = await apiClient.get(`/candidates/${candidateId}`);
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

  async reject(candidateId, rejectionReason = "Rejected by admin") {
    const response = await apiClient.patch(
      `/candidates/approve/${candidateId}`,
      {
        action: "reject",
        rejectionReason,
      },
    );

    return response?.data?.data || null;
  },

  async remove(candidateId) {
    const response = await apiClient.delete(
      `/candidates/delete/${candidateId}`,
    );
    return response?.data?.data || null;
  },

  normalizeCandidate,
};
