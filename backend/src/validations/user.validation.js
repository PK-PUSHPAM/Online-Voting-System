import { z } from "zod";
import {
  emptyObjectSchema,
  mongoIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const getPendingVotersSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: paginationQuerySchema,
});

export const approveRejectVoterSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    userId: mongoIdSchema("userId"),
  }),
  query: emptyObjectSchema,
});
