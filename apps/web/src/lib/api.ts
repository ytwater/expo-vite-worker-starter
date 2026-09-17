import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

import type { AppRouter } from "@acme/api";

function getApiUrl() {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error("VITE_API_URL is not set");
  }
  return url;
}

export const queryClient = new QueryClient();

const link = new RPCLink({
  url: `${getApiUrl()}/api/rpc`,
  fetch(request, init) {
    return globalThis.fetch(request, {
      ...init,
      credentials: "include",
    });
  },
  headers() {
    return {
      "x-orpc-source": "vite-react",
    };
  },
});

export const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * Typesafe helpers for consuming the API with TanStack Query.
 */
export const orpc = createTanstackQueryUtils(client);

export type { RouterInputs, RouterOutputs } from "@acme/api";
