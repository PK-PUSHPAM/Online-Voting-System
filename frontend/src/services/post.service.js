import apiClient from "../lib/apiClient";

const normalizePost = (post, election = null) => {
  if (!post) return post;

  return {
    ...post,
    electionId:
      typeof post.electionId === "object" && post.electionId !== null
        ? post.electionId
        : election
          ? {
              _id: election._id,
              title: election.title,
              status: election.status,
              isPublished: election.isPublished,
            }
          : post.electionId,
  };
};

export const postService = {
  async getAll(params = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      electionId = "",
      isActive = "",
      sortBy = "createdAt",
      sortType = "desc",
    } = params;

    if (electionId) {
      const response = await apiClient.get(`/posts/election/${electionId}`, {
        params: {
          page,
          limit,
          sortBy,
          sortType,
          ...(isActive !== "" ? { isActive } : {}),
        },
      });

      const data = response?.data?.data || {
        items: [],
        pagination: null,
      };

      const filteredItems = Array.isArray(data.items)
        ? data.items.filter((post) => {
            if (!search.trim()) return true;

            const keyword = search.trim().toLowerCase();

            return (
              String(post?.title || "")
                .toLowerCase()
                .includes(keyword) ||
              String(post?.description || "")
                .toLowerCase()
                .includes(keyword)
            );
          })
        : [];

      return {
        ...data,
        items: filteredItems,
      };
    }

    const electionResponse = await apiClient.get("/elections/all", {
      params: {
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortType: "desc",
      },
    });

    const elections = Array.isArray(electionResponse?.data?.data?.items)
      ? electionResponse.data.data.items
      : [];

    const allPostGroups = await Promise.all(
      elections.map(async (election) => {
        try {
          const response = await apiClient.get(
            `/posts/election/${election._id}`,
            {
              params: {
                page: 1,
                limit: 100,
                sortBy,
                sortType,
                ...(isActive !== "" ? { isActive } : {}),
              },
            },
          );

          const posts = Array.isArray(response?.data?.data?.items)
            ? response.data.data.items
            : [];

          return posts.map((post) => normalizePost(post, election));
        } catch {
          return [];
        }
      }),
    );

    const keyword = search.trim().toLowerCase();

    const mergedPosts = allPostGroups
      .flat()
      .filter((post) => {
        if (!keyword) return true;

        return (
          String(post?.title || "")
            .toLowerCase()
            .includes(keyword) ||
          String(post?.description || "")
            .toLowerCase()
            .includes(keyword) ||
          String(post?.electionId?.title || "")
            .toLowerCase()
            .includes(keyword)
        );
      })
      .sort((first, second) => {
        const firstValue = new Date(first?.createdAt || 0).getTime();
        const secondValue = new Date(second?.createdAt || 0).getTime();

        return sortType === "asc"
          ? firstValue - secondValue
          : secondValue - firstValue;
      });

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.max(Number(limit) || 10, 1);
    const totalItems = mergedPosts.length;
    const totalPages = Math.max(Math.ceil(totalItems / pageLimit), 1);
    const startIndex = (currentPage - 1) * pageLimit;
    const items = mergedPosts.slice(startIndex, startIndex + pageLimit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        page: currentPage,
        limit: pageLimit,
        hasPrevPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    };
  },

  async getByElection(electionId, params = {}) {
    if (!electionId) {
      return { items: [], pagination: null };
    }

    const response = await apiClient.get(`/posts/election/${electionId}`, {
      params,
    });

    return response?.data?.data || { items: [], pagination: null };
  },

  async create(firstArg, secondArg) {
    const electionId =
      typeof firstArg === "string" ? firstArg : firstArg?.electionId;

    const payload =
      typeof firstArg === "string"
        ? secondArg
        : {
            title: firstArg?.title,
            description: firstArg?.description,
            maxVotesPerVoter: firstArg?.maxVotesPerVoter,
            displayOrder: firstArg?.displayOrder,
            isActive: firstArg?.isActive,
          };

    if (!electionId) {
      throw new Error("Election ID is required to create a post");
    }

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
