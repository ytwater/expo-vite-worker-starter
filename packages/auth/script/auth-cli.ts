/**
 * @fileoverview Better Auth CLI Configuration
 *
 * This file is used exclusively by the Better Auth CLI to generate database schemas.
 * DO NOT USE THIS FILE DIRECTLY IN YOUR APPLICATION.
 *
 * This configuration is consumed by the CLI command:
 * `pnpx @better-auth/cli generate --config script/auth-cli.ts --output ../db/src/auth-schema.ts`
 *
 * For actual authentication usage, import from "../src/index.ts" instead.
 */

import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

/**
 * CLI-only authentication configuration for schema generation.
 *
 * Uses a stub database adapter so the CLI does not require a live D1 binding.
 *
 * @warning This configuration is NOT intended for runtime use.
 * @warning Use the main auth configuration from "../src/index.ts" for your application.
 */
export const auth = betterAuth({
  database: drizzleAdapter({} as never, {
    provider: "sqlite",
  }),
  baseURL: "http://localhost:8787",
  secret: "secret",
  plugins: [
    oAuthProxy({
      productionURL: "http://localhost:8787",
    }),
    expo(),
  ],
  socialProviders: {
    google: {
      clientId: "1234567890",
      clientSecret: "1234567890",
    },
  },
  trustedOrigins: ["expo://"],
});
