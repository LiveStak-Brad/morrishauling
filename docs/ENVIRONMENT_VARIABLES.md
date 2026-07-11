# Environment Variables — Morris Services

**Audit date:** 2026-07-10 (updated for operational launch)  
**Production project:** Vercel `morrishauling`  
**Never commit secret values.** This file lists **names and categories only**.

---

## Production operational contract

| Variable | Required value | Notes |
|----------|----------------|-------|
| `APP_STATUS` | `live` | Default in code is live; set `prelaunch` only to freeze |
| `NEXT_PUBLIC_APP_STATUS` | `live` | Keep in sync with `APP_STATUS` |
| `ALLOW_PUBLIC_BOOKING` | `true` | Set `false` only for emergency freeze |
| `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING` | `true` | Mirror of above |
| `DIVISION_*_LAUNCH_STATUS` | `accepting_bookings` | Fallback; DB `/admin/divisions` is source of truth |
| `NEXT_PUBLIC_USE_SUPABASE` | `true` | Required |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | Required |
| `STAFF_OWNER_EMAILS` | owner emails | Required |
| `DEMO_DATA` | unset / not `true` | Never enable in production |
| `NEXT_PUBLIC_STRIPE_ENABLED` | `false` until Stripe live | Flip to `true` with keys + webhook |
| `STRIPE_SECRET_KEY` | unset until Stripe | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | unset until Stripe | |
| `STRIPE_WEBHOOK_SECRET` | unset until Stripe | |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | browser Places key | Required for verified address booking |
| `GOOGLE_MAPS_API_KEY` | server Maps key | Places Details + Geocoding + Directions |

### Stripe activation (only remaining payment blocker)

1. Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
2. Set `NEXT_PUBLIC_STRIPE_ENABLED=true`
3. Redeploy — no additional code changes required

---

## Full catalog

### Required now (operational production)

| Variable | Visibility | Purpose |
|----------|------------|---------|
| `APP_STATUS` | Server | Master gate (`live` \| `prelaunch` freeze) |
| `NEXT_PUBLIC_APP_STATUS` | Public | Client UI mirror |
| `ALLOW_PUBLIC_BOOKING` | Server | Public booking on/off |
| `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING` | Public | Client mirror |
| `NEXT_PUBLIC_USE_SUPABASE` | Public | Enable Supabase data layer |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser/server anon key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Uploads, signed URLs, privileged writes |
| `STAFF_OWNER_EMAILS` | **Server-only** | Allowlist for admin/HR privileged roles |
| `NODE_ENV` | Server (auto) | Set by Vercel to `production` |
| `NEXT_PUBLIC_STRIPE_ENABLED` | Public | Online card checkout gate |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Places Autocomplete (referrer-restricted) |
| `GOOGLE_MAPS_API_KEY` | **Server-only** | Places Details, Geocoding, Directions |

### Optional / later

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe server API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `OSRM_URL` | Optional Directions fallback |
| Email/SMS provider keys | Notifications (in-app events already enqueue) |

See also `.env.example` for the current template.
