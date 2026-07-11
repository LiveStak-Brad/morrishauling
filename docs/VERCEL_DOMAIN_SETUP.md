# Vercel & Domain Setup — Morris Services (Prelaunch)

**Legal entity:** MORRIS SERVICE GROUP LLC  
**Public brand:** Morris Services  
**Domain:** https://morris-services.com  
**First operating company:** Morris Hauling & Junk Removal  
**Deployment mode:** `APP_STATUS=prelaunch` (no live booking, no card payments)

---

## 1. Pre-deploy checklist

Run locally before pushing:

```bash
npm run build
npm run verify:launch-blockers
npm run verify:public-site
npm run verify:prelaunch-deploy
```

| Check | Status |
|-------|--------|
| `npm run build` | Required — must pass |
| `APP_STATUS=prelaunch` in Vercel | Required |
| `DEMO_DATA` unset or `false` | Required |
| `ALLOW_PUBLIC_BOOKING` unset | Required |
| `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING` unset | Required |
| `NEXT_PUBLIC_USE_SUPABASE=true` | Required in production |
| `SUPABASE_SERVICE_ROLE_KEY` set | Required (server-only) |
| `STAFF_OWNER_EMAILS` set | Required (comma-separated owner emails) |
| Stripe/payment keys | Leave **unset** for prelaunch |

### Prelaunch behavior (code-enforced)

- `/book` — “Online booking is coming soon” + preview wizard (`?preview=1`, submissions disabled)
- `POST /api/jobs/create` — **403** unless `APP_STATUS=live` and booking flags enabled
- Online card/ACH — disabled (`isOnlineCardPaymentEnabled()` returns `false`)
- Invoice “send placeholder” email — rejected with 400
- Dev tools (`create-test` employee, data inspector, test-data-status) — **404** in production
- `/admin`, `/employee`, `/customer`, `/planner` — middleware auth required
- Public `/api/health/supabase` — minimal `{ ok }` only; full diagnostics admin-only

### Content review (manual — not code-blocked)

The Morris Hauling homepage (`/junk-removal`) still shows marketing copy from the restored design:

- “Rated 4.9”, “Same-week pickups”, “Licensed & insured”, “On-time guarantee”

Confirm these claims are accurate before public marketing, or update copy in `components/public/HaulingHomePage.tsx`. Prelaunch booking/payments are still blocked regardless.

---

## 2. Required Vercel environment variables

Set in **Vercel → Project → Settings → Environment Variables** for **Production** (and Preview if you test previews against prod Supabase).

| Variable | Required | Prelaunch value | Notes |
|----------|----------|-----------------|-------|
| `APP_STATUS` | Yes | `prelaunch` | Master launch gate; defaults to prelaunch if unset |
| `NEXT_PUBLIC_USE_SUPABASE` | Yes | `true` | Mock data layer disabled |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<project>.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | anon key | Public; RLS-scoped |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | service_role secret | **Server only** — never expose to client |
| `STAFF_OWNER_EMAILS` | Yes | `you@example.com,...` | Privileged admin/HR allowlist |
| `NODE_ENV` | Auto | `production` | Set by Vercel |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes (for booking) | browser Places key | **HTTP referrer** restricted to production + preview domains |
| `GOOGLE_MAPS_API_KEY` | Yes (for booking) | server Maps key | **Server only** — Places Details, Geocoding, Directions. Never expose to the browser |
| `DEMO_DATA` | No | **unset** | Never `true` in production |
| `ALLOW_PUBLIC_BOOKING` | No | **unset** | Do not set until go-live |
| `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING` | No | **unset** | Do not set until go-live |
| `SUPABASE_DB_PASSWORD` | No* | — | Only for local `npm run db:migrate` |
| `STRIPE_*`, `SQUARE_*`, `PAYPAL_*` | No | **unset** | Payments not live |

\*Apply migrations from your machine or CI using `SUPABASE_DB_PASSWORD`, not on Vercel runtime.

### Google Maps keys (required for verified booking)

1. Create (or reuse) a Google Cloud project with **Places API**, **Geocoding API**, and **Directions API** (or Routes API) enabled.
2. Create **two** API keys:
   - **Browser key** → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
     - Application restriction: **HTTP referrers**
     - Allow: `https://morris-services.com/*`, `https://www.morris-services.com/*`, `https://*.vercel.app/*` (preview), and local `http://localhost:3000/*` if needed
     - API restriction: Maps JavaScript API + Places API
   - **Server key** → `GOOGLE_MAPS_API_KEY`
     - Application restriction: **None** on Vercel (dynamic egress) or IP allowlist if you have static IPs
     - API restriction: Places API, Geocoding API, Directions API
     - **Never** prefix with `NEXT_PUBLIC_` — server only
3. Set both in Vercel Production + Preview, then redeploy.
4. Apply Supabase migrations `039_verified_addresses.sql` and `040_hauling_stops_verification.sql`.

Without these keys, public booking shows “address verification unavailable” and blocks continue (no free-text bypass).

### Go-live later (not now)

```env
APP_STATUS=live
ALLOW_PUBLIC_BOOKING=true
NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING=true
# + Stripe keys when payments are wired
```

---

## 3. Import project into Vercel

### Option A — GitHub (recommended)

1. Push this repo to GitHub (if not already).
2. Go to [vercel.com/new](https://vercel.com/new).
3. **Import** the `MorrisHaulingAndJunkRemoval` repository.
4. Framework preset: **Next.js** (auto-detected).
5. Build command: `npm run build` (default).
6. Output directory: `.next` (default).
7. Add environment variables from section 2.
8. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
cd MorrisHaulingAndJunkRemoval
vercel login
vercel          # first deploy (preview)
vercel --prod   # production deploy
```

Set env vars via dashboard or:

```bash
vercel env add APP_STATUS production
# repeat for each variable
```

### After first deploy

Your Vercel URL will look like:

`https://<project-name>-<team>.vercel.app`

Record this URL — use it for smoke tests before DNS is connected.

---

## 4. Supabase production setup

Before or immediately after first deploy:

1. **Run migrations** on production Supabase (from dev machine):

   ```bash
   # .env.local with production SUPABASE_DB_PASSWORD + URL
   npm run db:migrate
   ```

2. **Auth → URL configuration** (Supabase Dashboard):

   | Setting | Value |
   |---------|-------|
   | Site URL | `https://morris-services.com` |
   | Redirect URLs | `https://morris-services.com/auth/callback` |
   | | `https://morris-services.com/auth/callback?next=/update-password` |
   | | `https://<your-project>.vercel.app/auth/callback` (for pre-DNS testing) |

3. **Storage** — buckets from migrations (`031`, `032`, etc.) must be applied.

4. **Smoke test** (optional):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/smoke-test-production-workflows.mjs
   ```

---

## 5. Connect morris-services.com (GoDaddy DNS)

> **Live config (2026-07-10 audit):** **www is primary**. Apex `morris-services.com` **308-redirects to** `https://www.morris-services.com/`. Align Supabase Auth Site URL to www. See [`FULL_PRODUCTION_AUDIT.md`](./FULL_PRODUCTION_AUDIT.md) Part 2.

**Previously recommended:** apex-primary (not what is live today).  
**Current live:** `www.morris-services.com` primary; apex → www.

### Step 1 — Add domains in Vercel

1. Vercel → Project → **Settings → Domains**
2. Add `morris-services.com`
3. Add `www.morris-services.com`
4. Vercel shows **exact DNS records** for your project — use those values (they may differ from generic examples below).

### Step 2 — GoDaddy DNS records

Log in to GoDaddy → **My Products → morris-services.com → DNS**.

#### Apex domain (`morris-services.com`)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `76.76.21.21` | 600 (or default) |

> Vercel may show a **project-specific** A record IP in Domain Settings. Prefer the value shown in your Vercel dashboard over this generic IP.

#### WWW subdomain

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `www` | `cname.vercel-dns.com` | 600 |

> Newer Vercel projects may show a project-specific CNAME (e.g. `xxxx.vercel-dns-016.com`). Use the value from **Vercel Domain Settings**.

#### Domain verification (if prompted)

Vercel may ask for a **TXT** record during first setup — add exactly as shown in the dashboard.

### Step 3 — SSL

- Vercel provisions Let's Encrypt certificates automatically after DNS propagates.
- Status: **Domains → morris-services.com → Valid Configuration** (green).
- Propagation: usually 5–60 minutes; up to 48 hours globally.

### Step 4 — WWW redirect

In Vercel Domains:

- Set `morris-services.com` as **primary**
- Enable redirect from `www.morris-services.com` → `morris-services.com`

---

## 6. Post-deploy verification checklist

Replace `BASE` with `https://morris-services.com` (or Vercel URL before DNS).

```bash
BASE_URL=https://morris-services.com npm run verify:launch-blockers
```

### Public pages

| URL | Expect |
|-----|--------|
| `/` | Morris Services parent portal |
| `/junk-removal` or `/hauling` | Full Morris Hauling homepage (redirect alias) |
| `/careers` | Careers live; company breadcrumb |
| `/book` | “Online booking is coming soon”; preview button works |
| `/book?preview=1` | Wizard visible; submit disabled |
| `/login` | Login form |
| `/pricing`, `/services` | Company pages with breadcrumb |

### Protected routes (logged out → redirect to `/login`)

| URL | Expect |
|-----|--------|
| `/admin` | Redirect to login |
| `/employee` | Redirect to login |
| `/customer` | Redirect to login |

### Admin (logged in as owner)

| Check | Expect |
|-------|--------|
| Supabase status card | Full health at `/api/admin/health/supabase` |
| Data inspector | **404** in production |
| Create test employee | **404** in production |
| Customer payments | Contact-only / disabled card pay |

### Mobile

- Test `/` and `/junk-removal` on phone
- Hamburger menu shows nav links below `md` breakpoint
- Breadcrumb “Back to Morris Services” visible
- Phone tap-to-call works

### API spot checks

```bash
# Unauthenticated store — 401
curl -s -o /dev/null -w "%{http_code}" https://morris-services.com/api/data/store

# Public health — minimal JSON
curl -s https://morris-services.com/api/health/supabase

# Job create without auth — 401 or 403
curl -s -X POST https://morris-services.com/api/jobs/create -H "Content-Type: application/json" -d "{}"
```

---

## 7. Rollback

### Instant rollback (Vercel)

1. **Deployments** → select previous successful deployment → **⋯ → Promote to Production**

### DNS rollback

1. Remove or revert A/CNAME records in GoDaddy to previous host.
2. Wait for propagation.

### Launch mode rollback

Set in Vercel env and redeploy:

```env
APP_STATUS=prelaunch
```

Remove `ALLOW_PUBLIC_BOOKING` if set.

---

## 8. Blockers & notes

| Item | Severity | Action |
|------|----------|--------|
| Supabase migrations not applied on prod | **Blocker** | Run `npm run db:migrate` against prod |
| `STAFF_OWNER_EMAILS` missing | **Blocker** | Set in Vercel; build logs warn via `instrumentation.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` missing | **Blocker** | Uploads/PDFs/storage fail |
| Marketing claims (4.9★, licensed/insured) | **Review** | Confirm accuracy or edit `HaulingHomePage.tsx` |
| Vercel deployment URL | **You fill in** | Available after first `vercel --prod` |
| Email provider | **Not connected** | Send-placeholder disabled by design |
| Stripe | **Not connected** | Card UI disabled by design |

---

## 9. Quick reference — GoDaddy steps for you

1. Deploy to Vercel first; copy the **exact** DNS values from **Project → Settings → Domains**.
2. GoDaddy → **DNS** for `morris-services.com`.
3. Add **A** record: Host `@` → Vercel IP (often `76.76.21.21`).
4. Add **CNAME** record: Host `www` → Vercel CNAME target.
5. Save; wait for Vercel to show **Valid Configuration** and SSL active.
6. Set Supabase Site URL + redirect URLs to `https://morris-services.com`.
7. Run post-deploy checklist (section 6).

---

*Last updated: 2026-06-29 — prelaunch deployment for morris-services.com*
