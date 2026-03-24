import { z } from "zod";

export const sendOtpSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, "Full name required"),
    email: z.string().email("Invalid email"),
    mobileNumber: z.string().min(10).max(10),
    password: z.string().min(6, "Password too short"),
    otp: z.string().min(4).max(6),
    dob: z.string(),
    identityType: z.string(),
    identityLast4: z.string().length(4),
    documentUrl: z.string().url(),
    documentPublicId: z.string(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    mobileNumber: z.string().min(10).max(10),
    password: z.string().min(6),
  }),
});
