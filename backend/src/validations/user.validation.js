import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(64, "Password must not exceed 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]/,
    "Password must contain at least one special character",
  );

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

export const updateMyProfileSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(80, "Full name must not exceed 80 characters")
        .optional(),

      identityType: z
        .enum(["voterId", "collegeId", "aadhaarLast4", "other"])
        .optional(),

      identityLast4: z
        .string()
        .trim()
        .regex(
          /^[0-9A-Za-z]{0,4}$/,
          "Identity last 4 must be up to 4 letters or numbers",
        )
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const changeMyPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
