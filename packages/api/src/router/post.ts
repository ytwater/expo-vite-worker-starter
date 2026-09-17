import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { CreatePostSchema, Post } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../orpc";

export const postRouter = {
  all: publicProcedure.handler(({ context }) => {
    return context.db.query.Post.findMany({
      orderBy: desc(Post.id),
      limit: 10,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ context, input }) => {
      return context.db.query.Post.findFirst({
        where: eq(Post.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .handler(({ context, input }) => {
      return context.db.insert(Post).values(input);
    }),

  delete: protectedProcedure.input(z.string()).handler(({ context, input }) => {
    return context.db.delete(Post).where(eq(Post.id, input));
  }),
};
