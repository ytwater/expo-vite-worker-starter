# Diablo 4 Character Scanner

Turborepo monorepo (from [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)) with:

- **Expo** — mobile client
- **Cloudflare Worker** (`apps/workers-api`) — Hono API host
- **oRPC** — typesafe RPC (`/api/rpc`)
- **Better Auth** — Discord + Expo (`/api/auth/*`)
- **Cloudflare D1** — SQLite via Drizzle

> Node `^22.21.0`, pnpm `^10.19.0` — see [`package.json#engines`](./package.json).

## Repo layout

```text
apps
  ├─ expo           Expo SDK 54 (oRPC + Better Auth clients)
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
3. Discord OAuth app ([Better Auth Discord docs](https://www.better-auth.com/docs/authentication/discord))
   - Callback URL (local): `http://localhost:8787/api/auth/callback/discord`
   - Callback URL (prod): `https://<your-worker>.workers.dev/api/auth/callback/discord`

## Setup

### 1. Install & env

```bash
pnpm i

cp .env.example .env
cp apps/workers-api/.dev.vars.example apps/workers-api/.dev.vars
```

Fill in both files:

| Var | Purpose |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_DISCORD_ID` | Discord client ID |
| `AUTH_DISCORD_SECRET` | Discord client secret |
| `AUTH_PRODUCTION_URL` | Optional. Public Worker URL for OAuth redirects (defaults to request origin) |

`.dev.vars` is what **wrangler** reads in local/dev. Root `.env` is for tooling (auth schema generate, etc.).

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
pnpm -F @acme/workers-api exec wrangler d1 create diablo-scanner-db
```

Wrangler prints something like:

```text
✅ Successfully created DB 'diablo-scanner-db'

[[d1_databases]]
binding = "DB"
database_name = "diablo-scanner-db"
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
pnpm -F @acme/expo dev    # Expo
```

Expo resolves the API as `http://<lan-ip>:8787` via [`apps/expo/src/utils/base-url.ts`](./apps/expo/src/utils/base-url.ts).

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
pnpm -F @acme/workers-api exec wrangler secret put AUTH_DISCORD_ID
pnpm -F @acme/workers-api exec wrangler secret put AUTH_DISCORD_SECRET
# optional:
# pnpm -F @acme/workers-api exec wrangler secret put AUTH_PRODUCTION_URL
```

Then:

1. Set Discord OAuth redirect to `https://<worker>.workers.dev/api/auth/callback/discord`
2. Point Expo production `getBaseUrl()` at that Worker URL

## Expo (stores)

Use [EAS Build / Submit](https://docs.expo.dev/distribution/introduction) as usual. Native OAuth still talks to the Worker URL you configure in `getBaseUrl()`.

## Scripts cheat sheet

| Script | What it does |
| --- | --- |
| `pnpm dev:api` | `wrangler dev` for `@acme/workers-api` |
| `pnpm db:generate` | Drizzle → SQL in `packages/db/drizzle` |
| `pnpm db:migrate:local` | Apply migrations to local D1 |
| `pnpm db:migrate:remote` | Apply migrations to remote D1 |
| `pnpm db:studio` | Drizzle Studio (local SQLite file config) |
| `pnpm auth:generate` | Regen Better Auth tables → `auth-schema.ts` |

## References

- [oRPC](https://orpc.dev)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- [Better Auth](https://www.better-auth.com)
- [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)
