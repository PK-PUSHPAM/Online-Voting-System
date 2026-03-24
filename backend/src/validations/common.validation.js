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

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().trim().optional().default("createdAt"),
  sortType: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().trim().optional(),
});
