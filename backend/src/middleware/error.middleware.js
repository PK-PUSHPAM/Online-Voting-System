const errorHandler = (err, req, res, next) => {
  let statusCode = Number(err.statusCode) || 500;
  let message = err.message || "Internal Server Error";
  let errors = Array.isArray(err.errors) ? err.errors : [];

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors || {}).map((item) => item.message);
  } else if (err.name === "ZodError") {
    statusCode = 400;
    message = err.issues?.[0]?.message || "Validation failed";
    errors = err.issues?.map((issue) => issue.message) || [];
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or malformed token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message || "File upload error";
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = `${duplicateField} already exists`;
  } else if (err.message === "Not allowed by CORS") {
    statusCode = 403;
    message = "Request origin is not allowed";
  }

  if (statusCode < 400) {
    statusCode = 500;
  }

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    data: null,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
