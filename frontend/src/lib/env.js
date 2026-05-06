const normalizeApiBaseUrl = (url) => {
  const value = String(url || "").trim();

  if (!value) {
    return "http://localhost:5000/api/v1";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
);
