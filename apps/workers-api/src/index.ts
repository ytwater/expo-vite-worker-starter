import { Hono } from "hono";
import { cors } from "hono/cors";
import { CORSPlugin } from "@orpc/server/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";

import {
  appRouter,
  createORPCContext,
  validationErrorInterceptor,
} from "@acme/api";
import { initAuth } from "@acme/auth";
import type { Auth } from "@acme/auth";
import { createDb } from "@acme/db/client";
import type { DB } from "@acme/db/client";

type Variables = {
  db: DB;
  auth: Auth;
  baseUrl: string;
};

const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new CORSPlugin()],
  interceptors: [
    validationErrorInterceptor,
    onError((error) => {
      console.error("[ORPC]", error);
    }),
  ],
});

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "x-orpc-source"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  }),
);

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const productionUrl = c.env.AUTH_PRODUCTION_URL || baseUrl;

  const db = createDb(c.env.DB);
  const auth = initAuth({
    db,
    baseUrl,
    productionUrl,
    secret: c.env.AUTH_SECRET,
    googleClientId: c.env.AUTH_GOOGLE_ID,
    googleClientSecret: c.env.AUTH_GOOGLE_SECRET,
    trustedOrigins: [
      "http://localhost:5173",
      ...(c.env.WEB_APP_URL ? [c.env.WEB_APP_URL] : []),
    ],
  });

  c.set("db", db);
  c.set("auth", auth);
  c.set("baseUrl", baseUrl);
  await next();
});

app.on(["GET", "POST"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

app.all("/api/rpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/api/rpc",
    context: await createORPCContext({
      headers: c.req.raw.headers,
      auth: c.var.auth,
      db: c.var.db,
    }),
  });

  if (matched) {
    return response;
  }

  return c.text("Not Found", 404);
});

app.get("/", (c) =>
  c.json({
    name: "diablo-4-character-scanner-api",
    status: "ok",
  }),
);

export default app;
