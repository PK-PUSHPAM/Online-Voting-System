import { z } from "zod";

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

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "OTP must be 4 to 6 digits");

const dobSchema = z
  .string()
  .trim()
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date < new Date();
  }, "Invalid date of birth");

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
      .min(3, "Full name must be at least 3 characters long")
      .max(100, "Full name must not exceed 100 characters"),
    email: emailSchema,
    mobileNumber: mobileNumberSchema,
    password: passwordSchema,
    otp: otpSchema,
    dob: dobSchema,
    identityType: z
      .enum(["voterId", "collegeId", "aadhaarLast4", "other"])
      .optional()
      .default("other"),
    identityLast4: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Identity last 4 must be exactly 4 digits")
      .optional()
      .or(z.literal(""))
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
    password: z.string().min(1, "Password is required"),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const loginWithOtpSchema = z.object({
  body: z.object({
    mobileNumber: mobileNumberSchema,
    otp: otpSchema,
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const resetPasswordWithOtpSchema = z.object({
  body: z.object({
    mobileNumber: mobileNumberSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});
