export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const getApiErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.friendlyMessage ||
    error?.message ||
    "Something went wrong"
  );
};

export const formatRoleLabel = (role = "") => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
