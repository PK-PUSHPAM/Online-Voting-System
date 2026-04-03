import apiClient from "../lib/apiClient";

const extractData = (response) => response?.data?.data;

export const uploadService = {
  async uploadVoterDocument(file, oldPublicId = "") {
    const formData = new FormData();
    formData.append("document", file);

    if (oldPublicId) {
      formData.append("oldPublicId", oldPublicId);
    }

    const response = await apiClient.post("/uploads/voter-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return extractData(response);
  },

  async uploadCandidatePhoto(file, oldPublicId = "") {
    const formData = new FormData();
    formData.append("candidatePhoto", file);

    if (oldPublicId) {
      formData.append("oldPublicId", oldPublicId);
    }

    const response = await apiClient.post(
      "/uploads/candidate-photo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return extractData(response);
  },
};
