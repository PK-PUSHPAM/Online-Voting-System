import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  optionalBooleanQuerySchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const getMySystemNotificationsSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    unreadOnly: optionalBooleanQuerySchema,
  }),
});

export const markNotificationAsReadSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    notificationId: mongoIdSchema("notificationId"),
  }),
  query: emptyObjectSchema,
});

export const deleteMyNotificationSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    notificationId: mongoIdSchema("notificationId"),
  }),
  query: emptyObjectSchema,
});

export const clearMyReadNotificationsSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const markAllNotificationsAsReadSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const createAdminSystemNotificationSchema = z.object({
  body: z
    .object({
      recipientIds: z
        .array(mongoIdSchema("recipientId"))
        .optional()
        .default([]),
      roles: z
        .array(z.enum(["super_admin", "admin", "voter"]))
        .optional()
        .default([]),
      title: z
        .string()
        .trim()
        .min(3, "Notification title must be at least 3 characters")
        .max(120, "Notification title must not exceed 120 characters"),
      message: z
        .string()
        .trim()
        .min(3, "Notification message must be at least 3 characters")
        .max(1000, "Notification message must not exceed 1000 characters"),
      type: z
        .enum(["info", "success", "warning", "danger"])
        .optional()
        .default("info"),
      link: z.string().trim().max(300).optional().default(""),
    })
    .refine((data) => data.recipientIds.length > 0 || data.roles.length > 0, {
      message: "Either recipientIds or roles is required",
    }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
