import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

const postBodySchema = z.object({
  title: z.string().trim().min(2, "Post title is required"),
  description: z.string().trim().optional().default(""),
  maxVotesPerVoter: z.coerce
    .number()
    .int("maxVotesPerVoter must be an integer")
    .min(1, "maxVotesPerVoter must be at least 1")
    .optional(),
  isActive: z.boolean().optional(),
});

export const createPostSchema = z.object({
  body: postBodySchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: emptyObjectSchema,
});

export const getPostsByElectionSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: paginationQuerySchema,
});

export const getPostByIdSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    postId: mongoIdSchema("postId"),
  }),
  query: emptyObjectSchema,
});

export const updatePostSchema = z.object({
  body: postBodySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
    }),
  params: z.object({
    postId: mongoIdSchema("postId"),
  }),
  query: emptyObjectSchema,
});

export const deletePostSchema = getPostByIdSchema;

export const getActivePostsWithCandidatesForElectionSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: emptyObjectSchema,
});
