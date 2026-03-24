import { z } from "zod";

const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid mobile number");

const emailSchema = z.string().trim().email("Invalid email");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long");

export const sendOtpSchema = z.object({
  body: z.object({
    mobileNumber: mobileNumberSchema,
    purpose: z
      .enum(["register", "login", "reset-password"])
      .optional()
      .default("register"),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters long"),
    email: emailSchema,
    mobileNumber: mobileNumberSchema,
    password: passwordSchema,
    otp: z
      .string()
      .trim()
      .regex(/^\d{4,6}$/, "OTP must be 4 to 6 digits"),
    dob: z.string().trim().min(1, "Date of birth is required"),
    identityType: z.string().trim().optional().default("other"),
    identityLast4: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Identity last 4 must be exactly 4 digits")
      .optional()
      .default(""),
    documentUrl: z.string().trim().optional().default(""),
    documentPublicId: z.string().trim().optional().default(""),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrMobile: z
      .string()
      .trim()
      .min(1, "Email or mobile number is required"),
    password: passwordSchema,
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});
