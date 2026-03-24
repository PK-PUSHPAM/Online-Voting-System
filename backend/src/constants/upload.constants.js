export const CLOUDINARY_FOLDERS = {
  candidatePhotos: "online-voting-system/candidate-photos",
  voterDocuments: "online-voting-system/voter-documents",
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

export const MAX_CANDIDATE_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_VOTER_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB
