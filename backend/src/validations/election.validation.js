import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

const electionBodySchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long"),
  description: z.string().trim().optional().default(""),
  startDate: z.string().trim().min(1, "startDate is required"),
  endDate: z.string().trim().min(1, "endDate is required"),
  isPublished: z.boolean().optional(),
  allowedVoterType: z
    .enum(["verifiedOnly", "all"])
    .optional()
    .default("verifiedOnly"),
});

export const createElectionSchema = z.object({
  body: electionBodySchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const updateElectionSchema = z.object({
  body: electionBodySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: emptyObjectSchema,
});

export const getElectionByIdSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: emptyObjectSchema,
});

export const deleteElectionSchema = getElectionByIdSchema;

export const getAllElectionsSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    status: z.enum(["upcoming", "active", "ended"]).optional(),
    search: z.string().trim().optional(),
  }),
});

export const getActivePublishedElectionsForVoterSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
