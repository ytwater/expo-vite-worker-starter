import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod/v4";

/**
 * Rewrites oRPC input validation failures into flattened Zod field errors
 * so clients can render per-field messages.
 */
export async function validationErrorInterceptor<T>({
  next,
}: {
  next: () => Promise<T>;
}): Promise<T> {
  try {
    return await next();
  } catch (error) {
    if (
      error instanceof ORPCError &&
      error.code === "BAD_REQUEST" &&
      error.cause instanceof ValidationError
    ) {
      const zodError = new z.ZodError(
        error.cause.issues as z.core.$ZodIssue[],
      );

      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        message: z.prettifyError(zodError),
        data: z.flattenError(zodError),
        cause: error,
      });
    }

    throw error;
  }
}
