import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues?.[0];

      return next(
        new ApiError(400, firstIssue?.message || "Validation failed"),
      );
    }

    return next(error);
  }
};

export default validate;
