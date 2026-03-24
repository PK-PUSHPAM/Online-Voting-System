import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid mobile number");

const emailSchema = z.string().trim().email("Invalid email");

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

const dateStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

export const createAdminSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters long")
      .max(100, "Full name must not exceed 100 characters"),
    email: emailSchema,
    mobileNumber: mobileNumberSchema,
    password: passwordSchema,
    dob: dateStringSchema,
    role: z.enum(["admin", "super_admin"]).optional().default("admin"),
  }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const updateAdminStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({
      required_error: "isActive is required",
      invalid_type_error: "isActive must be boolean",
    }),
  }),
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});

export const changeAdminRoleSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "super_admin"], {
      errorMap: () => ({ message: "Role must be admin or super_admin" }),
    }),
  }),
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});

export const getAllAdminsSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    role: z.enum(["admin", "super_admin"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().optional(),
  }),
});

export const getAuditLogsSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    action: z.string().trim().optional(),
    status: z.enum(["success", "failure"]).optional(),
    actorRole: z
      .enum(["super_admin", "admin", "voter", "system", "unknown"])
      .optional(),
    targetType: z.string().trim().optional(),
    actorId: mongoIdSchema("actorId").optional(),
    targetId: mongoIdSchema("targetId").optional(),
    search: z.string().trim().optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getDashboardSummarySchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
