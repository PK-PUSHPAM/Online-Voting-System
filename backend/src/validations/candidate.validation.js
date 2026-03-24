import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

const candidateBodySchema = z.object({
  fullName: z.string().trim().min(3, "Candidate fullName is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid mobile number")
    .optional()
    .or(z.literal("")),
  partyName: z.string().trim().optional().default(""),
  partySymbolUrl: z.string().trim().optional().default(""),
  candidatePhotoUrl: z.string().trim().optional().default(""),
  photoPublicId: z.string().trim().optional().default(""),
  manifesto: z.string().trim().optional().default(""),
  isApproved: z.boolean().optional(),
});

export const createCandidateSchema = z.object({
  body: candidateBodySchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
    postId: mongoIdSchema("postId"),
  }),
  query: emptyObjectSchema,
});

export const updateCandidateSchema = z.object({
  body: candidateBodySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),
  params: z.object({
    candidateId: mongoIdSchema("candidateId"),
  }),
  query: emptyObjectSchema,
});

export const getCandidateByIdSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    candidateId: mongoIdSchema("candidateId"),
  }),
  query: emptyObjectSchema,
});

export const deleteCandidateSchema = getCandidateByIdSchema;

export const getCandidatesByPostSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    postId: mongoIdSchema("postId"),
  }),
  query: paginationQuerySchema,
});

export const getCandidatesByElectionSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: paginationQuerySchema,
});
