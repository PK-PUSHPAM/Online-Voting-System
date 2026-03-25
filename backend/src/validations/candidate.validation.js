import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
  optionalBooleanQuerySchema,
  nonNegativeIntegerSchema,
} from "./common.validation.js";

const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);

const candidateBodyBaseSchema = z.object({
  userId: mongoIdSchema("userId").optional(),

  fullName: z.string().trim().min(3, "Candidate fullName is required"),

  partyName: z.string().trim().optional().default(""),
  manifesto: z.string().trim().optional().default(""),

  candidatePhotoUrl: z.string().trim().optional().default(""),
  candidatePhotoPublicId: z.string().trim().optional().default(""),

  // legacy compatibility
  photoPublicId: z.string().trim().optional(),

  displayOrder: nonNegativeIntegerSchema("displayOrder").optional(),
  isActive: z.boolean().optional(),
});

const normalizeCandidateBody = (data) => ({
  ...data,
  candidatePhotoPublicId:
    data.candidatePhotoPublicId?.trim() || data.photoPublicId?.trim() || "",
});

export const createCandidateSchema = z.object({
  body: candidateBodyBaseSchema.transform(normalizeCandidateBody),
  params: z.object({
    electionId: mongoIdSchema("electionId"),
    postId: mongoIdSchema("postId"),
  }),
  query: emptyObjectSchema,
});

export const updateCandidateSchema = z.object({
  body: candidateBodyBaseSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    })
    .transform(normalizeCandidateBody),
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
  query: paginationQuerySchema.extend({
    approvalStatus: approvalStatusSchema.optional(),
    isActive: optionalBooleanQuerySchema,
  }),
});

export const getCandidatesByElectionSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: paginationQuerySchema.extend({
    approvalStatus: approvalStatusSchema.optional(),
    isActive: optionalBooleanQuerySchema,
  }),
});

export const approveCandidateSchema = z.object({
  body: z
    .object({
      action: z.enum(["approve", "reject"]),
      rejectionReason: z.string().trim().max(500).optional().default(""),
    })
    .superRefine((data, ctx) => {
      if (
        data.action === "reject" &&
        (!data.rejectionReason || !data.rejectionReason.trim())
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["rejectionReason"],
          message: "rejectionReason is required when action is reject",
        });
      }
    }),
  params: z.object({
    candidateId: mongoIdSchema("candidateId"),
  }),
  query: emptyObjectSchema,
});
