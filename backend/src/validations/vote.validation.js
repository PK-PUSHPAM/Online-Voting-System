import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const castVoteSchema = z.object({
  body: z.object({
    electionId: mongoIdSchema("electionId"),
    postId: mongoIdSchema("postId"),
    candidateId: mongoIdSchema("candidateId"),
  }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const getMyVotesSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema,
});

export const getVotesByElectionForAdminSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    electionId: mongoIdSchema("electionId"),
  }),
  query: paginationQuerySchema,
});
