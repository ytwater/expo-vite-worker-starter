# Expo Vite Worker Starter

Turborepo monorepo starter with:

- **Expo** — mobile client
- **Vite** (`apps/web`) — web SPA (Better Auth + oRPC)
- **Cloudflare Worker** (`apps/workers-api`) — Hono API host
- **oRPC** — typesafe RPC (`/api/rpc`)
- **Better Auth** — Google + Expo (`/api/auth/*`)
- **Cloudflare D1** — SQLite via Drizzle

> Based on [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo) (MIT, Julius Marminge) — migrated to Cloudflare Workers + oRPC.

> Node `^22.21.0`, pnpm `^10.19.0` — see [`package.json#engines`](./package.json).

## Repo layout

```text
apps
  ├─ expo           Expo SDK 54 (oRPC + Better Auth clients)
  ├─ web            Vite + React SPA (oRPC + Better Auth)
  └─ workers-api    Cloudflare Worker (Hono) → /api/rpc, /api/auth
packages
  ├─ api            oRPC router / procedures
  ├─ auth           Better Auth config
  ├─ db             Drizzle schema + SQL migrations (D1)
  ├─ ui             shadcn/ui (optional)
  └─ validators     shared Zod schemas
```

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Wrangler logged in: `pnpm -F @acme/workers-api exec wrangler login`
3. Google OAuth client ([Better Auth Google docs](https://www.better-auth.com/docs/authentication/google))
   - Callback URL (local): `http://localhost:8787/api/auth/callback/google`
   - Callback URL (prod): `https://<your-worker>.workers.dev/api/auth/callback/google`

## Setup

### 1. Install & env

```bash
pnpm i

cp apps/workers-api/.dev.vars.example apps/workers-api/.dev.vars
```

Fill in `apps/workers-api/.dev.vars` (single source of truth for Worker auth secrets):

| Var | Purpose |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_PRODUCTION_URL` | Optional. Public Worker URL for OAuth redirects (defaults to request origin) |
| `WEB_APP_URL` | Optional. Production web origin trusted by Better Auth |

Wrangler reads `.dev.vars` for local `wrangler dev` and for `pnpm typegen` Env bindings. Do **not** duplicate these in a root `.env`.

After changing `wrangler.jsonc` or adding keys to `.dev.vars`, run:

```bash
pnpm typegen
```

`typecheck` / `dev` for `@acme/workers-api` also run typegen automatically via Turbo.

### 2. Provision D1

#### Local (dev)

No Cloudflare dashboard step needed. Wrangler creates a local SQLite D1 under `apps/workers-api/.wrangler/` the first time you migrate or run `wrangler dev`.

```bash
# generate SQL from Drizzle schema (if not already present)
pnpm db:generate

# apply migrations to local D1
pnpm db:migrate:local
```

The placeholder `database_id` in [`apps/workers-api/wrangler.jsonc`](./apps/workers-api/wrangler.jsonc) is fine for **local-only** use.

#### Remote (Cloudflare)

One-time per account/environment:

```bash
# 1. Create the database
pnpm -F @acme/workers-api exec wrangler d1 create my-app-db
```

Wrangler prints something like:

```text
✅ Successfully created DB 'my-app-db'

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

```bash
# 2. Paste database_id into apps/workers-api/wrangler.jsonc
#    under d1_databases[0].database_id (replace the all-zeros placeholder)

# 3. Apply migrations to the remote DB
pnpm db:migrate:remote
```

`migrations_dir` in wrangler points at [`packages/db/drizzle`](./packages/db/drizzle). New schema changes:

```bash
pnpm db:generate          # write new SQL under packages/db/drizzle
pnpm db:migrate:local     # local
pnpm db:migrate:remote    # production / remote
```

If you change Better Auth options and need a new auth schema:

```bash
pnpm auth:generate
pnpm db:generate
pnpm db:migrate:local   # and :remote when ready
```

### 3. Run locally

```bash
pnpm dev:api              # Worker on http://localhost:8787
pnpm dev:web              # Vite SPA on http://localhost:5173
pnpm -F @acme/expo dev    # Expo
```

Copy [`apps/web/.env.example`](./apps/web/.env.example) → `apps/web/.env` (`VITE_API_URL=http://localhost:8787`).

Expo resolves the API as `http://<lan-ip>:8787` via [`apps/expo/src/utils/base-url.ts`](./apps/expo/src/utils/base-url.ts). The web app uses `VITE_API_URL` and Google OAuth redirects back to `http://localhost:5173/` after the Worker callback.

Quick checks:

```bash
curl http://localhost:8787/
curl http://localhost:8787/api/auth/ok
curl -X POST http://localhost:8787/api/rpc/post/all \
  -H 'content-type: application/json' -d '{}'
```

## API (oRPC)

| Piece | Location |
| --- | --- |
| Router / procedures | [`packages/api`](./packages/api) |
| HTTP host | [`apps/workers-api`](./apps/workers-api) → `/api/rpc`, `/api/auth/*` |
| Expo client | [`apps/expo/src/utils/api.tsx`](./apps/expo/src/utils/api.tsx) |
| Web client | [`apps/web/src/lib/api.ts`](./apps/web/src/lib/api.ts) |

```ts
import { orpc } from "~/utils/api";

useQuery(orpc.post.all.queryOptions());
useMutation(orpc.post.create.mutationOptions());
```

## Deploy Workers API

Requires remote D1 already created and `database_id` set in `wrangler.jsonc` (see above).

```bash
pnpm db:migrate:remote

pnpm -F @acme/workers-api deploy

pnpm -F @acme/workers-api exec wrangler secret put AUTH_SECRET
pnpm -F @acme/workers-api exec wrangler secret put AUTH_GOOGLE_ID
pnpm -F @acme/workers-api exec wrangler secret put AUTH_GOOGLE_SECRET
# optional:
# pnpm -F @acme/workers-api exec wrangler secret put AUTH_PRODUCTION_URL
```

Then:

1. Set Google OAuth redirect to `https://<worker>.workers.dev/api/auth/callback/google`
2. Point Expo production `getBaseUrl()` at that Worker URL

## Expo (stores)

Use [EAS Build / Submit](https://docs.expo.dev/distribution/introduction) as usual. Native OAuth still talks to the Worker URL you configure in `getBaseUrl()`.

## Scripts cheat sheet

| Script | What it does |
| --- | --- |
| `pnpm dev:api` | `wrangler dev` for `@acme/workers-api` |
| `pnpm dev:web` | Vite SPA for `@acme/web` |
| `pnpm db:generate` | Drizzle → SQL in `packages/db/drizzle` |
| `pnpm db:migrate:local` | Apply migrations to local D1 |
| `pnpm db:migrate:remote` | Apply migrations to remote D1 |
| `pnpm db:studio` | Drizzle Studio (local SQLite file config) |
| `pnpm auth:generate` | Regen Better Auth tables → `auth-schema.ts` |
| `pnpm typegen` | `wrangler types` → `apps/workers-api/worker-configuration.d.ts` |

## References

- [oRPC](https://orpc.dev)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- [Better Auth](https://www.better-auth.com)
- [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)
