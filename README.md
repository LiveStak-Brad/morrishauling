# Morris Hauling & Junk Removal Operating System

Custom operations platform for **Morris Hauling & Junk Removal** — booking, dispatch, field crew tools, customer portal, payments, financing, and admin mission control.

**Service area:** Warren, Lincoln & St. Charles Counties, MO  
**Phone:** (636) 751-4645

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL) for persistence
- Morris brand: `#9B1B30`

## Getting started

```bash
npm install
cp .env.example .env.local   # add Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

1. Run `supabase/migrations/001_initial_schema.sql` and `002_expand_operations_schema.sql` in the Supabase SQL Editor
2. `npm run db:seed`
3. Set `NEXT_PUBLIC_USE_SUPABASE=true` in `.env.local`

See [supabase/README.md](supabase/README.md) for details.

## Configuration

All business config lives in **`lib/morris-config.ts`** — branding, pricing, service area, disclaimers, payment/financing options.

The database retains `company_id` (`morris-hauling`) for future multi-location support; the app is single-company.

## Dev toolbar

In development, use the bottom toolbar to switch roles: **customer**, **employee**, **planner**, **admin**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed Morris demo data |
| `npm run db:migrate` | Run SQL migrations (if DB connection works) |

## API health

- `GET /api/health/supabase` — table readiness
- `GET /api/data/store?companyId=morris-hauling` — company data for client hydration
