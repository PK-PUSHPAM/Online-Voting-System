import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.validatedData = result;

    next();
  } catch (error) {
    const message = error.errors?.[0]?.message || "Validation error";
    next(new ApiError(400, message));
  }
};

export default validate;
