import apiClient from "../lib/apiClient";

export const adminService = {
  async getDashboardSummary() {
    const res = await apiClient.get("/admin/dashboard-summary");
    return res?.data?.data || null;
  },

  async getAllAdmins(params = {}) {
    const res = await apiClient.get("/admin/all-admins", { params });
    return res?.data?.data || { items: [], pagination: null };
  },

  async createAdmin(payload) {
    const res = await apiClient.post("/admin/create-admin", payload);
    return res?.data?.data || null;
  },

  async updateAdminStatus(userId, payload) {
    const res = await apiClient.patch(
      `/admin/update-status/${userId}`,
      payload,
    );
    return res?.data?.data || null;
  },

  async changeAdminRole(userId, payload) {
    const res = await apiClient.patch(`/admin/change-role/${userId}`, payload);
    return res?.data?.data || null;
  },

  async getAuditLogs(params = {}) {
    const res = await apiClient.get("/admin/audit-logs", { params });
    return res?.data?.data || { items: [], pagination: null };
  },
};
