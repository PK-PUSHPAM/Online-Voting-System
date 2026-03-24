import { v2 as cloudinary } from "cloudinary";

const requiredCloudinaryEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;

  const missingEnvVars = requiredCloudinaryEnvVars.filter(
    (envKey) => !process.env[envKey],
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing Cloudinary environment variables: ${missingEnvVars.join(", ")}`,
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
};

// Lazy initialization wrapper
export const getCloudinary = () => {
  configureCloudinary();
  return cloudinary;
};

export default cloudinary;
