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

  async removeProfilePhoto() {
    const response = await apiClient.delete("/users/me/profile-photo");
    return extractData(response);
  },

  async uploadVoterDocument(file) {
    const formData = new FormData();
    formData.append("document", file);

    const response = await apiClient.patch("/users/me/document", formData);
    return extractData(response);
  },

  async changeMyPassword(payload) {
    const response = await apiClient.patch(
      "/users/me/change-password",
      payload,
    );
    return response?.data || {};
  },
};
