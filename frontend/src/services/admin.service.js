import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data || {};

const normalizePaginationResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        totalItems: data.length,
        totalPages: 1,
        currentPage: 1,
        limit: data.length || 10,
        hasPrevPage: false,
        hasNextPage: false,
      },
    };
  }

  return {
    items: Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.admins)
        ? data.admins
        : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.logs)
            ? data.logs
            : [],
    pagination: data?.pagination || null,
    ...data,
  };
};

export const adminService = {
  async getDashboardSummary() {
    const response = await apiClient.get("/admin/dashboard-summary");
    return extractData(response);
  },

  async getAuditLogs(params = {}) {
    const safeParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.action?.trim() ? { action: params.action.trim() } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.actorRole ? { actorRole: params.actorRole } : {}),
      ...(params.targetType?.trim()
        ? { targetType: params.targetType.trim() }
        : {}),
      ...(params.actorId ? { actorId: params.actorId } : {}),
      ...(params.targetId ? { targetId: params.targetId } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
      sortOrder: params.sortOrder || "desc",
    };

    const response = await apiClient.get("/admin/audit-logs", {
      params: safeParams,
    });

    return normalizePaginationResponse(extractData(response));
  },

  async getAdmins(params = {}) {
    const response = await apiClient.get("/admin/all-admins", {
      params,
    });

    return normalizePaginationResponse(extractData(response));
  },

  async getAllAdmins(params = {}) {
    return this.getAdmins(params);
  },

  async createAdmin(payload) {
    const response = await apiClient.post("/admin/create-admin", payload);
    return extractData(response);
  },

  async updateAdminStatus(userId, payload = {}) {
    const response = await apiClient.patch(
      `/admin/update-status/${userId}`,
      payload,
    );

    return extractData(response);
  },

  async activateAdmin(userId) {
    return this.updateAdminStatus(userId, {
      isActive: true,
    });
  },

  async deactivateAdmin(userId) {
    return this.updateAdminStatus(userId, {
      isActive: false,
    });
  },

  async changeAdminRole(userId, roleOrPayload) {
    const payload =
      typeof roleOrPayload === "string"
        ? { role: roleOrPayload }
        : roleOrPayload;

    const response = await apiClient.patch(
      `/admin/change-role/${userId}`,
      payload,
    );

    return extractData(response);
  },
};
