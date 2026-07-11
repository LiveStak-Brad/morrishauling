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
| `PAYMENTS_PROVIDER` | `manual` until Stripe | Set `stripe` to activate provider |
| `STRIPE_ENABLED` | `false` until ready | Server enable flag |
| `NEXT_PUBLIC_STRIPE_ENABLED` | `false` until Stripe live | Client checkout gate |
| `STRIPE_SECRET_KEY` | unset until Stripe | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | unset until Stripe | |
| `STRIPE_WEBHOOK_SECRET` | unset until Stripe | Point to `/api/payments/webhook` |
| `NOTIFICATIONS_EMAIL_ENABLED` | `false` until ready | |
| `RESEND_API_KEY` or `SMTP_*` | unset until email | |
| `EMAIL_FROM` | optional | From address |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | browser Places key | Required for verified address booking |
| `GOOGLE_MAPS_API_KEY` | server Maps key | Places Details + Geocoding + Directions |

### Stripe activation checklist

1. Apply migration `045_stripe_email_tokens.sql`
2. Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Set webhook endpoint to `https://www.morris-services.com/api/payments/webhook`
4. Set `PAYMENTS_PROVIDER=stripe`, `STRIPE_ENABLED=true`, `NEXT_PUBLIC_STRIPE_ENABLED=true`
5. Run `npm run verify:production` and a $1 test charge + refund
6. Manual cash/check remains available when Stripe is off

### Email activation checklist

1. Set `RESEND_API_KEY` (or `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`) and `EMAIL_FROM`
2. Set `NOTIFICATIONS_EMAIL_ENABLED=true`
3. Optional: cron `POST /api/admin/notifications/retry` with `Authorization: Bearer $CRON_SECRET`
4. Without credentials, sends stay `skipped` and staff copy customer links

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
| `PAYMENTS_PROVIDER` | Server | `manual` \| `stripe` |
| `STRIPE_ENABLED` | Server | Server Stripe enable |
| `NEXT_PUBLIC_STRIPE_ENABLED` | Public | Online card checkout gate |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Places Autocomplete (referrer-restricted) |
| `GOOGLE_MAPS_API_KEY` | **Server-only** | Places Details, Geocoding, Directions |

### Optional / later

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console HTML tag verification token (meta content value only — do not invent) |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Optional: `plausible` \| `ga4` \| unset (hooks exist; no vendor loaded until configured) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain when provider is plausible |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement ID when provider is ga4 |
| `STRIPE_SECRET_KEY` | Stripe server API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js / Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `NOTIFICATIONS_EMAIL_ENABLED` | Enable outbound email worker |
| `RESEND_API_KEY` | Resend provider |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP fallback |
| `EMAIL_FROM` / `RESEND_FROM` | From address |
| `CRON_SECRET` | Auth for email retry cron |
| `OSRM_URL` | Optional Directions fallback |
| `NOTIFICATIONS_SMS_ENABLED` | SMS (not implemented yet) |

### Search Console & analytics (later)

1. In Google Search Console, add `https://www.morris-services.com` (www preferred).
2. Choose HTML tag verification; set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the token value only.
3. After deploy, submit sitemap: `https://www.morris-services.com/sitemap.xml`
4. Wire analytics by setting `NEXT_PUBLIC_ANALYTICS_PROVIDER` and the matching ID/domain — marketing events already call `trackMarketingEvent` (no PII).

See also `.env.example` for the current template.
