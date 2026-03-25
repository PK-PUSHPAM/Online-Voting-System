import mongoose from "mongoose";
import { z } from "zod";

export const emptyObjectSchema = z.object({}).optional().default({});

export const mongoIdSchema = (fieldLabel = "Id") =>
  z
    .string()
    .trim()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: `Invalid ${fieldLabel}`,
    });

const parseBooleanQueryValue = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
};

export const booleanQuerySchema = z.preprocess(
  parseBooleanQueryValue,
  z.boolean({
    invalid_type_error: "Value must be true or false",
  }),
);

export const optionalBooleanQuerySchema = z.preprocess(
  parseBooleanQueryValue,
  z
    .boolean({
      invalid_type_error: "Value must be true or false",
    })
    .optional(),
);

export const nonNegativeIntegerSchema = (fieldLabel = "Value") =>
  z.coerce
    .number({
      invalid_type_error: `${fieldLabel} must be a number`,
    })
    .int(`${fieldLabel} must be an integer`)
    .min(0, `${fieldLabel} can not be negative`);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().trim().optional().default("createdAt"),
  sortType: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().trim().optional(),
});
