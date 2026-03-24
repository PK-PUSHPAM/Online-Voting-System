import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized request."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to access this resource.",
        ),
      );
    }

    next();
  };
};

export default authorizeRoles;
