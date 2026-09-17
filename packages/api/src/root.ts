import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";

export const appRouter = {
  auth: authRouter,
  post: postRouter,
};

// export type definition of API
export type AppRouter = typeof appRouter;
