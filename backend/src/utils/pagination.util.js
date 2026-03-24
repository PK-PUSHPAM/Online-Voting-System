import ApiError from "./ApiError.js";

export const buildPagination = (query = {}) => {
  let { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) {
    throw new ApiError(400, "Invalid page number");
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }

  const skip = (page - 1) * limit;

  const sortOrder = sortType === "asc" ? 1 : -1;

  const sort = {
    [sortBy]: sortOrder,
  };

  return {
    page,
    limit,
    skip,
    sort,
  };
};
