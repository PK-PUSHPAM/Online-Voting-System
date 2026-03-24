import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const getPendingVotersSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    search: z.string().trim().optional(),
  }),
});

export const getAllVotersSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    search: z.string().trim().optional(),
    verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    isEligibleToVote: z.enum(["true", "false"]).optional(),
    mobileVerified: z.enum(["true", "false"]).optional(),
    ageVerified: z.enum(["true", "false"]).optional(),
  }),
});

export const getVoterByIdSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});

export const approveRejectVoterSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});
