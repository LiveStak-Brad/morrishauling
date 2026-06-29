# Supabase setup — Morris Hauling

## 1. Environment (already in `.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key (client-safe) |
| `SUPABASE_DB_PASSWORD` | DB password for `npm run db:migrate` only |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional — server admin / seed scripts |
| `NEXT_PUBLIC_USE_SUPABASE` | `true` = hydrate app from Supabase |

**Never commit `.env.local` or share service role keys publicly.**

## 2. Create tables

**Option A — Supabase Dashboard (recommended if migrate script fails)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

**Option B — CLI script**

```bash
npm run db:migrate
```

## 3. Seed demo data

```bash
npm run db:seed
```

## 4. Verify

```bash
npm run dev
```

- Health check: `GET /api/health/supabase`
- Data sync: `GET /api/data/store?companyId=morris-hauling`

## Architecture

- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server components / route handlers
- `lib/supabase/queries.ts` — row ↔ TypeScript mappers
- `app/api/data/store/route.ts` — loads company data into the app
- `components/data/DataHydrator.tsx` — merges Supabase data into the in-memory store on load

Writes still update the local store first; Supabase sync on write can be added per entity via `lib/supabase/queries.ts` upsert helpers.

## Security note

RLS policies are **open for development** (`using (true)`). Tighten before production and add Supabase Auth.
