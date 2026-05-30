# Contributing to DrMindit

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org |
| npm | ≥ 11 | bundled with Node |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |

## First-time setup

```bash
# 1. Clone
git clone https://github.com/your-org/drmindit.git && cd drmindit

# 2. Install all workspace dependencies
npm install

# 3. Copy env files and fill in your keys
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# 4. Start the local Supabase stack (requires Docker)
npm run db:start

# 5. Apply migrations
npm run db:push

# 6. Start everything
npm run dev
```

## Database migrations

> **Do not** use `run-migration.js` or the raw `pg` driver — that file has been removed. Use the Supabase CLI exclusively.

| Command | What it does |
|---|---|
| `npm run db:start` | Start local Supabase stack (Docker) |
| `npm run db:push` | Apply pending migrations to local/remote DB |
| `npm run db:reset` | Wipe local DB and re-apply all migrations from scratch |
| `npm run db:stop` | Stop local Supabase stack |

New migrations go in `supabase/migrations/` with the naming convention `YYYYMMDDHHMMSS_description.sql`. Generate with:

```bash
supabase migration new your_description
```

## CI/CD — Required GitHub Secrets

Add the following in **Settings → Secrets and variables → Actions**:

| Secret | Used by |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | `ci.yml` — migration validation |
| `SUPABASE_DB_PASSWORD` | `ci.yml` — migration validation |
| `VERCEL_TOKEN` | `preview.yml` — Vercel preview deploy |
| `VERCEL_ORG_ID` | `preview.yml` |
| `VERCEL_PROJECT_ID` | `preview.yml` |
| `EXPO_TOKEN` | `eas-check.yml` — Expo smoke test |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `eas-check.yml` |

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — triggers Vercel prod deploy |
| `feat/*` | Feature branches — trigger preview deploy + CI on PR |
| `fix/*` | Bug fix branches |

## AI Safety

Every message sent to `/api/chat` is screened by a local crisis keyword detector **before** any call to OpenAI. If a crisis signal is found the route returns Indian helpline numbers immediately and the LLM is never invoked. Do not remove or weaken this gate.
