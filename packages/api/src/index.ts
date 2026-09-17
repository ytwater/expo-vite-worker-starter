import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";

import type { AppRouter } from "./root";

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: string }
 */
type RouterInputs = InferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = InferRouterOutputs<AppRouter>;

export { type AppRouter, appRouter } from "./root";
export { createORPCContext } from "./orpc";
export { validationErrorInterceptor } from "./validation-interceptor";
export type { RouterInputs, RouterOutputs };
