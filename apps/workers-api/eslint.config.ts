import { defineConfig } from "eslint/config";

import { baseConfig } from "@acme/eslint-config/base";

export default defineConfig(
  {
    ignores: [".wrangler/**", "dist/**", "worker-configuration.d.ts"],
  },
  baseConfig,
);
