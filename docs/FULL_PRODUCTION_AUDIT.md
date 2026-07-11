# Full Production Audit — Morris Services / Morris Hauling

**Audit date:** 2026-07-10  
**Mode:** Read-only audit (no product code changes)  
**Branch:** `main`  
**Commit:** `1172a7719a804f7d8976d195a4dc5b5c71d053e4`  
**Deployed commit:** same (Vercel production `dpl_2FdEDbvSxu3b5tmwnLxNh6sNy8hw`, 2026-06-29)  
**Vercel project:** `morrishauling`  
**GitHub:** `LiveStak-Brad/morrishauling`  
**Live URLs:** https://www.morris-services.com · https://morris-services.com (308 → www) · https://morrishauling.vercel.app

**Completeness rule used:** A feature is “complete” only if UI + API + DB + auth + errors + empty states + mobile usability + E2E testing (or clearly marked untested) all hold.

---

# Part 1 — Executive Summary

## Readiness scores

| # | Area | Score | Reasoning |
|---|------|------:|-----------|
| 1 | Overall production | **58%** | Ops/HR/disposal are real and substantial; revenue paths (booking + card pay), email, and clean production data are not. Untested E2E. |
| 2 | Public site | **82%** | Live, SSL, honest prelaunch copy, careers work. Minor misleading register copy; mobile needs checklist pass. |
| 3 | Internal operations | **68%** | Admin CRUD paths exist on Supabase; seed rows distort KPIs; some panels/JSON editors remain. |
| 4 | Employee / HR | **70%** | Strong ATS→hire→LMS loop; Time/Performance admin stubs; seed employees present. |
| 5 | Customer portal | **42%** | Auth + job/invoice view; pay/chat/tracking not real. |
| 6 | Payments | **22%** | Cash/check manual only; processors stubbed. |
| 7 | Mobile | **72%** | Public RC1 polish present; admin/planner not phone-first. |
| 8 | Deployment / security | **75%** | Correct prelaunch env; prior critical leaks fixed (verified); service-role architecture remains high-trust. |

## Go / no-go questions

| Question | Answer | Exact blockers |
|----------|--------|----------------|
| Public browse today? | **Yes** | None for browsing. |
| Career applications today? | **Yes** | Ensure hiring-mode badges understood; estimated pay ranges. |
| Prelaunch interest today? | **Yes (phone/contact)** | No first-class “interest list” CRM product; contact + careers interest modes. |
| Manually enter real jobs today? | **No (not safely)** | Production has seed `*-m*` jobs (8), customers (3), invoices (3), payments (2), employees (4). Clean first. |
| Employees use portal today? | **Partial** | Need non-seed employee + profile link; smoke-test clock/jobs. |
| Enable live booking today? | **No** | Env gates; E2E untested; schedule/pricing owner decisions; seed cleanup. |
| Enable payments today? | **No** | No Stripe wiring; online flag false; PCI/webhook plan incomplete. |

---

# Part 2 — Deployment and Domain Status

| Item | Status |
|------|--------|
| Vercel project name | `morrishauling` |
| Team / scope | `cannastreams-projects` |
| GitHub repository | https://github.com/LiveStak-Brad/morrishauling |
| Deployed branch | `main` (alias `morrishauling-git-main-…`) |
| Deployed commit | `1172a7719a804f7d8976d195a4dc5b5c71d053e4` |
| Vercel URL | https://morrishauling.vercel.app |
| Production deployment | `https://morrishauling-nc3i7wazi-cannastreams-projects.vercel.app` · Ready |
| morris-services.com | **Live** — 308 Permanent Redirect → `https://www.morris-services.com/` |
| www.morris-services.com | **Live** — 200 OK, primary serving host |
| Which domain is primary | **www** (apex redirects to www — opposite of older docs that recommended apex-primary) |
| SSL | Valid (HSTS `max-age=63072000` on both) |
| www redirect | Apex → www (correctly configured as currently set) |
| Auto GitHub → Vercel | Yes — production deploys from `main`; latest prod matches HEAD |
| Production env complete for prelaunch | **Yes** for required set (see below) |
| Missing required for prelaunch | None of the required prelaunch vars missing |
| Payment secrets | Correctly **unset** |
| DEMO_DATA / booking flags | Correctly **unset** (not in Vercel env list) |
| Supabase auth redirect URLs | **Must be confirmed in Supabase dashboard** (Site URL should include www; callback `/auth/callback`). Not verifiable from repo alone. |
| Local vs production | Local `.env.local` has DB password, pooler, admin setup password (scripts). Production has APP_STATUS + Supabase + STAFF_OWNER_EMAILS only. Local may lack `APP_STATUS` (defaults prelaunch). |

### Confirmed production settings (Vercel Production)

| Variable | Expected | Observed |
|----------|----------|----------|
| `APP_STATUS` | `prelaunch` | **`prelaunch`** |
| `NEXT_PUBLIC_APP_STATUS` | `prelaunch` | **`prelaunch`** |
| `NEXT_PUBLIC_USE_SUPABASE` | `true` | **`true`** |
| `DEMO_DATA` | unset/false | **unset** |
| `ALLOW_PUBLIC_BOOKING` | unset/false | **unset** |
| `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING` | unset/false | **unset** |
| Payment provider secrets | unset | **unset** |
| `NEXT_PUBLIC_SUPABASE_URL` | set | set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set | set |
| `SUPABASE_SERVICE_ROLE_KEY` | set | set |
| `STAFF_OWNER_EMAILS` | set | set |

### Live probe results (2026-07-10)

| Check | Result |
|-------|--------|
| Public pages (`/`, `/junk-removal`, `/book`, `/careers`, …) | 200 |
| `/api/health/supabase` | `{"ok":true}` (minimal) |
| `/api/data/store` unauthenticated | **401** |
| `/admin` logged out | **307** → `/login?redirect=%2Fadmin` |
| Careers postings API | 200 · 19 postings |
| Pricing effective API | 200 |

Full env catalog: [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md).

---

# Part 3 — Public Website Audit

| Route | Purpose | Status | Prod loads | Mobile | Data | Nav | Misleading? | Public-ready? | Remaining work |
|-------|---------|--------|------------|--------|------|-----|-------------|---------------|----------------|
| `/` | Morris Services parent home | Done (prelaunch) | Yes | Good intent (`overflow-x-hidden`) | Static config | Yes | Low | **Yes** | Owner content polish |
| `/services` | Planned services | Done | Yes | OK | Company context / static | Yes | Low (prelaunch banner) | Yes | Prefer DB-driven catalog |
| `/junk-removal` | Hauling division home | Done | Yes | Hero contain fixes shipped | Static + company | Breadcrumb | Low — stats say Soon/Preview | Yes | Re-verify phones |
| `/hauling` | Alias | Done | Yes → junk-removal | — | — | — | — | Yes | — |
| `/pricing` | Illustrative rates | Done | Yes | OK | `/api/pricing/effective` + fallback | Yes | Low if disclaimer read | Yes | Owner approve numbers |
| `/careers` | Careers landing | Done | Yes | OK | API + reference fallback | Yes | Medium if modes ignored | Yes | Clarify active hiring |
| `/careers/jobs` | Job list | Done | Yes | OK | DB postings | Yes | Same | Yes | — |
| `/careers/jobs/[slug]` | Job detail | Done | Yes | OK | DB | Yes | Same | Yes | — |
| `/careers/apply/[postingId]` | Apply | Done | Yes | Form OK | POST Supabase | Yes | Low | Yes | UX: replace `alert()` errors |
| `/book` | Booking closed landing | Done | Yes | OK | Gated | Yes | Low | Yes | — |
| `/book?preview=1` | Non-live wizard | Done | Yes | OK | Demo mode no submit | Yes | Low if banner visible | Yes | Keep banner unmistakable |
| `/about` | About | Done | Yes | OK | Static | Yes | Low | Yes | — |
| `/contact` | Contact / interest | Done | Yes | OK | Static + phone | Yes | Low | Yes | Optional form → CRM |
| `/login` | Unified login | Done | Yes | OK | Supabase | Yes | Low | Yes | — |
| `/register` | Customer signup | Partial | Yes | OK | Supabase | Yes | **Yes — “pay online”** | Caution | Fix copy |
| `/forgot-password` | Reset request | Done | Yes | OK | Supabase reset email | Yes | Low | Yes | Confirm Supabase email templates + redirect URLs |
| `/update-password` | Set new password | Done | Yes | OK | Auth callback | Yes | Low | Yes | E2E test |
| `/company-login` | Alias → `/login` | Done | Yes | — | — | — | — | Yes | — |
| `/account` | Profile summary | Partial | Auth | OK | Profile | — | Low | Internal | Edit profile |
| `/customer/*` | Customer portal | Partial | Auth | Mixed | Supabase | Bottom nav | Tracking/chat/pay | Soft-launch only | See Part 8 |
| `/employee/*` | Employee portal | Partial | Auth | Mixed | Supabase | Bottom nav | Low | Internal test | See Part 7 |
| `/planner` | Dispatch | Partial | Auth | Weak | Planner API | Tabs | Route “optimize” heuristic | Internal | Maps API later |
| `/platform` | → `/admin` | Done | — | — | — | — | — | — | — |

### Branding / claim verification

| Check | Result |
|-------|--------|
| Morris Services parent branding | Present on `/` |
| Morris Hauling division branding | Present on `/junk-removal` |
| Back to Morris Services / breadcrumb | Present (verify script PASS) |
| Mobile hero sizing / no crop | Code fixes in RC1 (`ad4a2bf`); **re-test on device** |
| No horizontal scroll | `overflow-x-hidden` on key pages; re-test |
| No fake ratings / reviews / customer counts | PASS on public components (verify:public-site) |
| No “licensed and insured” | PASS (removed from public components) |
| No same-day/same-week guarantee | PASS |
| Clear prelaunch messaging | PASS |
| Booking preview non-live | PASS (demo mode + API 403) |
| Pricing labeled planned | PASS |
| Future divisions coming soon | PASS on parent home |

---

# Part 4 — Admin and Owner Console Audit

Auth: middleware + `STAFF_OWNER_EMAILS` allowlist for privileged roles.

| Module | Route | Data source | CRUD | Forms | Related nav | Prod-ready? | Deficiencies |
|--------|-------|-------------|------|-------|-------------|-------------|--------------|
| Mission Control | `/admin` | `/api/admin/operations` | Read | N/A | Yes | Partial | Coming-soon tiles; seed KPIs if seed rows remain |
| Jobs | `/admin/jobs` | `/api/admin/jobs` | Create + list | Intake form good | Partial | Partial | No rich inline edit; seed jobs present |
| Customers | `/admin/customers` | operations-depth | Interactions | Good | Partial | Partial | Seed customers |
| Employees | `/admin/employees` | → HR | — | — | Yes | — | Redirect only |
| Review Queue | `/admin/review` | jobs filter | Update | Good | Yes | Partial | Client-side filter of all jobs |
| Estimates | `/admin/estimates` | jobs | Create/list | OK | Yes | Partial | — |
| Invoices | `/admin/invoices*` | invoices API | Create/read/update | Good | Yes | Partial | Email send blocked; seed invoices |
| Payments | `/admin/payments*` | payments API | Create cash/check | Good | Yes | Partial | Card coming soon; seed payments |
| Financing | `/admin/financing` | financing API | Approve/deny | OK | Yes | Partial | Risk score simplistic |
| Schedule | `/admin/schedule` | slots API | Update | OK | Yes | Partial | Needs real capacity plan |
| Pricing | `/admin/pricing` | company-settings | Update | Multi-section | Yes | Partial | Public may lag static config |
| Services | `/admin/services` | company-settings | Update | Mixed/JSON | Yes | Partial | Public `/services` not fully DB-driven |
| Fleet | `/admin/fleet` | operations-depth | Update | OK | Yes | Partial | Limited real fleet (1 truck/1 trailer) |
| Disposal | `/admin/dump-sites*` | disposal APIs | Full CRUD | Good | Yes | **Strong** | Haversine not road miles |
| Disposal Review | `/admin/disposal-review` | review API | Approve/flag | OK | Yes | Strong | Untested with real volume |
| Dispatch | `/planner` | planner API | Assign | OK | Yes | Partial | Heuristic routing |
| Settings | `/admin/settings` | company-settings | Update | Mixed | Yes | Partial | JSON editors; data inspector prod-gated |
| Terms | `/admin/terms` | company-settings | Update | OK | Yes | Partial | Legal owner review |
| Branding | `/admin/branding` | company-settings | Update | OK | Yes | Partial | Public may use static provider |

### HR Platform

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| HR Dashboard | `/admin/hr` | Partial | Real stats; create-test **404 in prod** |
| Applicants | `/admin/hr/applicants*` | Strong | Pipeline + hire |
| HR Employees | `/admin/hr/employees*` | Strong | Activate/terminate/docs |
| Onboarding | `/admin/hr/onboarding` | Partial | Tracker view |
| Job Postings | `/admin/hr/postings*` | Strong | 19 published (templates + modes) |
| Payroll | `/admin/hr/payroll` | Partial | Tracking/CSV — not a payroll processor |
| Tax Tracking | `/admin/hr/taxes` | Partial | Tracking only disclaimer |
| Time & Attendance | `/admin/hr/time` | **Placeholder** | `HrPlaceholderPage` |
| Scheduling | `/admin/hr/schedule` | Partial | PTO approvals |
| Compliance | `/admin/hr/compliance` | Partial | Document templates |
| Training | `/admin/hr/training` | Strong | Courses/assign/matrix |
| Equipment | `/admin/hr/equipment` | Partial | Photo placeholder remnants |
| Performance | `/admin/hr/performance` | **Placeholder** | `HrPlaceholderPage` |

### Fake / seed data confirmation (production Supabase counts)

| Table | Rows | Seed-like (`%-m%` sample) |
|-------|-----:|---------------------------:|
| companies | 1 | — |
| profiles | 12 | — |
| customers | 8 | **3** |
| jobs | 11 | **8** |
| estimates | 3 | — |
| invoices | 5 | **3** |
| payments | 2 | **2** |
| financing_requests | 1 | — |
| employees | 7 | **4** |
| job_postings | 19 | reference templates (intentional) |
| applicants | 2 | — |
| applications | 0 | — |
| dump_sites | 8 | real MO reference facilities |
| disposal_events | 0 | — |
| schedule_slots | 25 | review legitimacy |
| trucks / trailers | 1 / 1 | placeholder fleet OK for prelaunch |
| training_courses | 12 | intentional LMS seed |
| equipment_assets | 1 | — |
| activity_log | 5 | — |

**Verdict:** Fake operational financial/job records **are present** and will affect Mission Control metrics. Job postings + dump sites + training courses are intentional reference seeds.

### Safe cleanup

Use SQL from `lib/data/seed-cleanup-sql.ts` (`buildSeedCleanupSql()`):

1. Open Supabase SQL editor (production project).
2. Paste generated cleanup SQL.
3. **Review** deletes (jobs/customers/invoices/payments with mock prefixes).
4. Optionally uncomment employee deletes only if those rows are not real people.
5. Run inside a transaction; verify Mission Control empties appropriately.
6. Do **not** delete dump_sites reference facilities or training courses unless intentional.

---

# Part 5 — Job Workflow Audit

| # | Step | Status | Backing |
|---|------|--------|---------|
| 1 | Customer interest / booking | Partial / gated | Phone/contact; `/book` closed; preview demo |
| 2 | Customer record creation | Works | Register API + admin intake |
| 3 | Job creation | Works (admin); public blocked | `/api/jobs/create` 403 in prelaunch |
| 4 | Estimate calculation | Works | Pricing engine + effective API |
| 5 | Photo upload | Partial | Job photos API + storage; needs field test |
| 6 | Estimate review | Works | Review queue |
| 7 | Approval / revision | Works | Estimate review actions |
| 8 | Scheduling | Partial | Slots exist; capacity planning manual |
| 9 | Crew assignment | Partial | Planner/HR assign |
| 10 | Fleet assignment | Partial | Limited fleet data |
| 11 | Employee job view | Works | `/employee/jobs/[id]` |
| 12 | Clock in | Works | Timeclock APIs |
| 13 | Travel / arrival | Partial | Status updates; no GPS |
| 14 | Before photos | Partial | Upload path exists; E2E untested |
| 15 | Job work | Partial | Status workflow |
| 16 | Disposal recommendation | Works | Haversine engine |
| 17 | Disposal completion | Works | Record + gate |
| 18 | Receipt / weight ticket | Works | `disposal-receipts` bucket |
| 19 | Actual cost / profit | Works | Profit calc module |
| 20 | After photos | Partial | Same as photo upload |
| 21 | Completion | Works | Status + disposal gate |
| 22 | Invoice generation | Partial | Manual create; not auto on complete |
| 23 | PDF generation | Partial | pdf-lib + storage; E2E untested in prod |
| 24 | Payment | Manual only | Cash/check; card blocked |
| 25 | Customer receipt | Not built | Receipts button “coming soon” |
| 26 | Reporting | Partial | Command center + disposal reports |
| 27 | Activity log | Partial | Table + `logActivity` used unevenly |

**Workflow stops before payments:** After invoice generation/PDF, the system supports **manual cash/check recording** only. Online card/ACH, deposits, refunds, and customer self-pay are **not live**. Soft-launch ops should stop at: complete job → create invoice → collect cash/check → record payment in admin.

---

# Part 6 — Disposal Module Audit

| Capability | Classification |
|------------|----------------|
| Real facilities (8 MO reference) | **Fully working** (reference data) |
| Materials accepted / rejected | Fully working |
| Hours / access type | Fully working |
| Pricing / fees | Fully working (facility fields) |
| Distance calculation | **Estimated / haversine** × road factor |
| Recommendation score | Fully working (engine) |
| cheapest/closest/fastest/profitable modes | Fully working |
| Avoid-vendor penalty | Fully working |
| Preferred vendor logic | Fully working |
| Job-specific recommendations | Fully working |
| Receipt / weight ticket upload | Fully working |
| Actual disposal cost | Fully working |
| Wait / unload time | Partial — improves with history (`jobCount >= 3`) |
| Disposal completion gate | Fully working |
| Admin override / skip | Fully working |
| Profitability update | Fully working |
| Disposal review queue | Fully working |
| Reporting | Fully working (API) |
| Historical learning | **Requires real job volume** |
| Google Maps road distance | **Future** (stub provider; UI links only) |

---

# Part 7 — HR, Careers, Employee Workflow

| # | Step | Status |
|---|------|--------|
| 1–3 | Public posting / careers / apply | Completed (real data + modes) |
| 4 | Applicant documents | Completed (API + storage) |
| 5–6 | HR review / interview status | Partial (status pipeline; interview notes schema) |
| 7–8 | Hire / employee creation | Completed |
| 9–10 | Onboarding / required docs | Partial–completed |
| 11 | E-signatures | Partial (sign API; PDF viewer gaps) |
| 12–15 | Training assign → lesson → quiz → certificate | Completed (LMS) |
| 16–17 | Equipment assign / ack | Completed |
| 18 | Schedule | Partial |
| 19 | Time clock | Completed (employee); admin Time page placeholder |
| 20 | PTO | Completed (request + approve) |
| 21 | Payroll rollup | Partial (export/tracking only) |
| 22 | Performance | **Not built** (admin placeholder; tables exist) |
| 23 | Termination / offboarding | Partial (terminate action) |

### Careers verification

| Check | Result |
|-------|--------|
| Reference roles render | Yes (19 postings live) |
| Pay ranges estimated | Prelaunch pay note in copy |
| Hiring language | Modes: `accepting_interest`, `hiring_soon`, `future_opening` |
| Application buttons | Wired |
| Document upload | API present; needs manual QA |
| Admin preview employee portal | Banner pattern exists |
| Staff login / owner allowlist | `STAFF_OWNER_EMAILS` set in prod |
| Employee selector / employee number | Present in HR UI patterns — smoke-test |

---

# Part 8 — Customer Portal Audit

| Feature | Status |
|---------|--------|
| Registration / login / password reset | Works |
| Profile | Read-only summary (`/account`) |
| Booking history / job status | Works when jobs exist |
| Estimates / invoices | View paths work |
| Payments | Balance shown; **card pay disabled** |
| Document/photo access | Partial |
| Invoice PDF | Path exists; authorize + test |
| Communications | Chat links dead (`#`) |
| Support/admin customer view | Admin CRM partial |

**Safe today:** Register, log in, view empty or real jobs/invoices, request financing on eligible jobs.  
**Will fail / mislead:** Pay online, live tracking, chat, receipts export, review rewards.

---

# Part 9 — Payments Readiness Audit

| Area | Status |
|------|--------|
| Provider abstraction | `lib/payment-provider.ts` |
| Mock provider | Active conceptually; online flag blocks cards |
| Stripe / Square / PayPal | Stubs reject “not configured” |
| Customer pay buttons | Disabled notice |
| Invoice balance pay | Disabled |
| Deposit / partial / refunds | Not implemented for cards |
| Webhooks / idempotency / reconciliation | Not built |
| Payout destination | N/A until Stripe Connect/account |
| Receipt generation | Not customer-facing |
| PCI | No card fields collected (good for now) |
| Security | Do not enable mock completed card charges |

### Stripe implementation plan (do not implement yet)

1. **Account:** Stripe account under MORRIS SERVICE GROUP LLC; verify business details; connect bank for payouts.
2. **Vercel vars (later):** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`; keep test keys until Phase D.
3. **Code:** Replace stub with Stripe provider; flip `isOnlineCardPaymentEnabled()` behind env; never use Mock for live.
4. **Webhook:** `/api/payments/webhook` — verify signature; idempotent `payment_intent.succeeded` / `charge.refunded`.
5. **Flows:** Deposit at booking approval; final balance on invoice; on-site = cash/check/card-present (Stripe Terminal later).
6. **Refunds:** Admin-only; Stripe refund + DB status.
7. **Accounting:** Map Stripe fees to invoice notes; export for bookkeeper; sales tax decision (owner).
8. **Test mode → live mode:** Full checklist with $1 live charge then refund before public enable.

---

# Part 10 — Database and Supabase Audit

- **Migrations:** 38 files in `supabase/migrations/` (alphabetical apply). Two `036_*` files — order is alphabetical (`036_career_templates` then `036_disposal_receipts_and_profit`).
- **Unapplied:** Not independently verified against `schema_migrations` table in this audit; app features depending on 031–037 appear live (storage health ok path, disposal, careers). **Confirm with `npm run db:migrate` dry awareness / Supabase dashboard.**
- **RLS:** Enabled broadly; app writes mostly via **service role** (RLS not primary boundary).
- **Storage buckets (private):** `job-photos`, `employee-documents`, `applicant-documents`, `hr-documents`, `invoice-pdfs`, `disposal-receipts`.
- **Signed URLs:** Server-created via service role.
- **Backup/recovery:** Rely on Supabase plan backups — **confirm PITR/backup tier with owner**.

### Table purposes (major groups)

| Group | Examples | Purpose |
|-------|----------|---------|
| Core ops | companies, customers, jobs, estimates, invoices, payments, financing_* | Revenue ops |
| Field | job_photos, job_notes, job_assignments, hauling_details, junk_removal_details | Job execution |
| Fleet | trucks, trailers, truck_maintenance_logs, routes, route_stops | Dispatch assets |
| Disposal | dump_sites, disposal_events | Dump network |
| Schedule | schedule_slots | Capacity |
| Auth | profiles | Roles / links |
| HR/ATS | job_postings, applicants, applications, departments, positions, … | Hiring |
| Time | timeclock_punches, employee_timeclock, timesheet_* | Attendance |
| Payroll | pay_periods, payroll_entries, contractor_1099_yearly | Tracking |
| Training | training_courses, lessons, quizzes, completions | LMS |
| Equipment | equipment_assets, assignments, damage_reports | Assets |
| Performance | performance_reviews, disciplinary_actions, … | Mostly unused UI |
| Audit | activity_log, document_audit_log | Logging |

**Unused / incomplete UI:** many performance/HR investigation tables; `mock-analytics` dead code.

**Row counts:** see Part 4.

---

# Part 11 — Security Audit

### Verified fixed / passing (static + live)

| ID | Finding | Severity now | Notes |
|----|---------|--------------|-------|
| SEC-001 | `/api/data/store` auth | Was Critical → **Fixed** | Live 401; static PASS |
| SEC-002 | Public health detail leak | Was Critical → **Fixed** | Minimal `{ok:true}` |
| SEC-005 | Online card complete via mock | Mitigated | Flag false + create route blocks cards |
| SEC-006 | Invoice PDF auth | Fixed per verify script | `canAccessInvoice` |
| SEC-007 | Rate limits | Improved | Register, careers, slots, health, store |
| SEC-008 | create-test in prod | Fixed | 404 via dev tools gate |
| UX-010 | Forgot password | Fixed | Real form |

### Remaining findings

| Severity | Finding | Path / area | Recommendation |
|----------|---------|-------------|----------------|
| **Critical** | Service role is primary write path — any missed API auth = full DB | `lib/supabase/admin.ts`, `lib/db/*` | Continuous route auth audit; prefer least privilege |
| **High** | Production seed data pollutes financial truth | Supabase rows `*-m*` | Cleanup SQL before soft launch |
| **High** | No automated security/E2E regression suite | `package.json` | Add Playwright smoke + CI |
| **Medium** | Admin API role checks inconsistent (`admin`/`planner` string vs `isAdmin()`) | `app/api/admin/*` | Standardize `requireApiRole` / allowlist |
| **Medium** | Applicant doc upload gated by statusToken | `app/api/careers/applications/documents` | Keep rate limit; monitor abuse |
| **Medium** | Pricing/slots public exposure | `/api/pricing/effective`, `/api/schedule/slots` | Accept for prelaunch; rate-limit pricing |
| **Medium** | Register copy implies pay online | `app/register/page.tsx` | Fix copy |
| **Low** | Hardcoded owner email fallback if env missing | `lib/auth/staff-allowlist.ts` | Prod already validates STAFF_OWNER_EMAILS |
| **Low** | Lint 68 errors | many admin pages | Clean before scale |
| **Low** | Middleware → proxy deprecation warning | Next 16 | Plan migration |

**Impersonation:** Admin employee preview banner — ensure exit returns to admin (smoke-test).

---

# Part 12 — Mobile and Responsive Audit

**Method:** Code review + prior RC1 commits + live HTML; **not** a full device lab pass this session.

| Breakpoint | Public | Customer | Employee | Planner | Admin |
|------------|--------|----------|----------|---------|-------|
| 320–430 | Likely OK after hero/hamburger fixes | Bottom nav OK; tables weak | Bottom nav OK; job forms OK | Cramped | Sidebar/tables poor |
| 768 | OK | OK | OK | Usable | Usable |
| 1024+ | OK | OK | OK | OK | Primary target |

### Known / likely issues

| Route | Component | Severity | Fix |
|-------|-----------|----------|-----|
| `/junk-removal` | HeroBanner | Medium | Device re-test contain vs cover |
| `/admin/*` | Data tables | High on phone | Card layouts / horizontal scroll containers |
| `/planner` | Board | High on phone | Already tabbed — verify assign flows |
| `/admin` | Mission Control | Medium | Stack KPIs; hide coming-soon noise |
| Employee clock | Controls | Low | Verify 44px targets |
| Careers apply | Form | Low | File upload on iOS |
| Disposal complete | Upload | Medium | Camera roll permissions |

Screenshot recommendation: iPhone SE + iPhone 14 + Pixel for `/`, `/junk-removal`, `/book`, `/careers/apply/…`, `/employee/clock`, `/admin/jobs`.

---

# Part 13 — Testing Status

| Command | Result | Duration (approx) | Real Supabase? |
|---------|--------|-------------------|----------------|
| `npm run build` | **PASS** | ~24s | No (compile) |
| `npm run lint` | **FAIL** — 68 errors, 77 warnings | ~20s | No |
| `npm run verify:launch-blockers` | **PASS** (static; HTTP skipped) | &lt;5s | No |
| `npm run verify:public-site` | **PASS** | &lt;5s | No |
| `npm run verify:prelaunch-deploy` | **PASS** | &lt;5s | No |
| Unit / integration / Playwright | **None** | — | — |
| `smoke-test-production-workflows.mjs` | Not run this audit | — | Would hit real SB |
| `verify-storage-readiness.mjs` | Not run | — | Would hit real SB |

**Manual QA checklist:** [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md).

---

# Part 14 — Launch Readiness Roadmap

See [`LAUNCH_ROADMAP.md`](./LAUNCH_ROADMAP.md) for Phases A–D with effort/risk/order.

---

# Part 15 — Owner Decisions

See [`OWNER_DECISIONS.md`](./OWNER_DECISIONS.md).

---

## Top 10 next tasks

1. Clean production seed `*-m*` operational rows  
2. Manual QA public + careers + auth (checklist)  
3. Fix register “pay online” copy  
4. Confirm Supabase Site URL + redirect URLs for **www**  
5. Soft-launch job intake dry run (one fake-then-delete job) after cleanup  
6. Owner decisions: insurance, pricing, pay ranges, service area  
7. Employee portal smoke with one real employee  
8. Disposal recommendation smoke on a test job address  
9. Invoice PDF generate + open signed URL  
10. Keep booking + Stripe disabled  

## Must not enable yet

- Live booking flags  
- Online card payments  
- `DEMO_DATA=true` in Vercel  
- `db:seed` on production  
