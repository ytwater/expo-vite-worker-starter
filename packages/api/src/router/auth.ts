import { protectedProcedure, publicProcedure } from "../orpc";

export const authRouter = {
  getSession: publicProcedure.handler(({ context }) => {
    return context.session;
  }),
  getSecretMessage: protectedProcedure.handler(() => {
    return "you can see this secret message!";
  }),
};
