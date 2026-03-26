import apiClient from "../lib/apiClient";

export const adminService = {
  async getDashboardSummary() {
    const res = await apiClient.get("/admin/dashboard-summary");
    return res.data.data;
  },
};
