import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data || {};

export const voterProfileService = {
  async updateMyProfile(payload) {
    const response = await apiClient.patch("/users/me/profile", payload);
    return extractData(response);
  },

  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    const response = await apiClient.patch("/users/me/profile-photo", formData);

    return extractData(response);
  },
};
