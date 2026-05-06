export const CLOUDINARY_FOLDERS = {
  candidatePhotos: "online-voting-system/candidate-photos",
  voterDocuments: "online-voting-system/voter-documents",
  profilePhotos: "online-voting-system/profile-photos",
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_CANDIDATE_PHOTO_SIZE = 2 * 1024 * 1024;
export const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;
export const MAX_VOTER_DOCUMENT_SIZE = 5 * 1024 * 1024;
