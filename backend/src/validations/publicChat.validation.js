import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  optionalBooleanQuerySchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const getMyPublicChatStatusSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const getPublicChatMessagesSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema.extend({
    includeDeleted: optionalBooleanQuerySchema,
  }),
});

export const sendPublicChatMessageSchema = z.object({
  body: z.object({
    message: z
      .string()
      .trim()
      .min(1, "Message can not be empty")
      .max(1000, "Message must not exceed 1000 characters"),
  }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const deletePublicChatMessageSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300).optional().default(""),
  }),
  params: z.object({
    messageId: mongoIdSchema("messageId"),
  }),
  query: emptyObjectSchema,
});

export const blockUserFromPublicChatSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .trim()
      .max(500, "Block reason must not exceed 500 characters")
      .optional()
      .default(""),
  }),
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});

export const unblockUserFromPublicChatSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});

export const getPublicChatBlockedUsersSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema,
});
