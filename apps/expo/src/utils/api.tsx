import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

import type { AppRouter } from "@acme/api";

import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ...
    },
  },
});

const link = new RPCLink({
  url: `${getBaseUrl()}/api/rpc`,
  headers() {
    const headers = new Map<string, string>();
    headers.set("x-orpc-source", "expo-react");

    const cookies = authClient.getCookie();
    if (cookies) {
      headers.set("Cookie", cookies);
    }
    return Object.fromEntries(headers);
  },
});

export const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * A set of typesafe helpers for consuming your API with TanStack Query.
 */
export const orpc = createTanstackQueryUtils(client);

export type { RouterInputs, RouterOutputs } from "@acme/api";
