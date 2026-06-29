# Morris OS — Production Audit

**Date:** 2026-06-29  
**Scope:** Full system — 77 pages, 112 API routes, 38 migrations, ~108 tables, all admin modules, portals, integrations  
**Status:** Audit only — **no fixes applied**

> **Supersedes:** [`PRODUCTION_READINESS_AUDIT.md`](./PRODUCTION_READINESS_AUDIT.md) (partially stale; see corrections in Section 1)

---

## 1. Executive Summary

Morris OS is a **hybrid application**: a substantial Supabase schema, service-role-backed API layer, and real HR/disposal workflows coexist with a **residual in-memory mock layer** (`lib/mock-data.ts`), static fallbacks (`lib/morris-config.ts`), and several **placeholder integrations** (email, card payments, SMS, cron jobs).

### Production environment gates

| Gate | Variable / file | Effect if wrong |
|------|-----------------|-----------------|
| Supabase enabled | `NEXT_PUBLIC_USE_SUPABASE=true` | `isDbReady()` fails → empty data or mock fallbacks |
| Server writes | `SUPABASE_SERVICE_ROLE_KEY` | Writes blocked or fall back to anon client |
| Demo data | `DEMO_DATA` must be **unset** in production | Enables mock customers, jobs, planner/command-center fallbacks |
| Staff privileges | `STAFF_OWNER_EMAILS` | Non-owner accounts downgraded from admin/HR at read time |

Validated by [`lib/env/production.ts`](../lib/env/production.ts).

### Architecture

```
UI pages → /api/* routes → lib/db/* (isDbReady?)
                              ├─ Supabase (service role writes)
                              └─ lib/mock-data.ts (RAM fallback when DEMO_DATA=true)
morris-config.ts → CompanyProvider (public site branding/services — static)
DataHydrator → syncs Supabase → mock store when DEMO_DATA=true
```

### Corrections vs prior audit (verified in code)

| Prior claim | Current state |
|-------------|---------------|
| Booking ignores DB pricing | **Fixed** — `useEffectivePricing` + `/api/pricing/effective` |
| `isDemoDataEnabled()` true in dev | **Fixed** — only when `DEMO_DATA=true` |
| `updateJob` mock-first | **Fixed** — reads Supabase first (`lib/db/operations.ts` L308–336) |
| HR Compliance is placeholder | **Wrong** — real document template UI at `app/admin/hr/compliance/page.tsx` |
| Branding/Services/Terms read-only | **Wrong** — editable, saved to `company_settings`; public site still uses `morrisConfig` via `CompanyProvider` |

### Launch blockers (summary)

1. **Card payments are mock** — no real processor wired
2. **Email delivery not implemented** — invoice/quote send is placeholder
3. **Critical API data leak** — unauthenticated `/api/data/store` returns full company data
4. **No password reset** — customers/employees cannot self-recover accounts
5. **Developer tools in admin** — Data Inspector, test employee creator, JSON editors
6. **No scheduled jobs** — reminders, overdue invoices, training expiry unautomated

---

## 2. Production Readiness Scores

Scores reflect **verified code state** as of audit date. Each score explains what works, what is partial, and what blocks production.

| Module | Score | Rationale |
|--------|-------|-----------|
| **Mission Control** | 82% | Real KPIs from payments/jobs when DB live (`/api/admin/operations`). Deductions: demo fallback when `DEMO_DATA=true` or API failure; 5 "Coming soon" tiles (weather, fuel, GPS, notifications); hardcoded daily revenue goal default $2,500; `payrollDueAmount` always 0; unbounded parallel fetches. |
| **Jobs** | 88% | Full CRUD via `/api/admin/jobs`; status workflow + disposal gate work. Deductions: `createJobFromBooking` still calls `mockCreateJob` before Supabase upsert; no pagination; review queue loads all jobs client-side. |
| **Customers** | 90% | CRM with interactions/callbacks real. Deductions: depth panel demo fallback when `DEMO_DATA=true`. |
| **Employees** | 85% | `/admin/employees` redirects to HR. Deductions: dead `AdminEmployeesPanel` export; planner/clock fall back to `morrisConfig.employees` names. |
| **HR Platform** | 86% | ATS, payroll export, training LMS, compliance doc templates, equipment, PTO approval all wired. Deductions: Time & Attendance and Performance pages are `HrPlaceholderPage` stubs; test employee button on dashboard. |
| **Review Queue** | 87% | Filters `needs_review` jobs; `EstimateReviewCard` actions work via API. Deductions: no dedicated paginated queue API. |
| **Estimates** | 88% | Engine + review API + admin list. Deductions: internal profit exposed via `showInternalProfit`. |
| **Invoices** | 75% | DB CRUD, PDF generation, mark paid/void work. Deductions: no auto-invoice on job completion; "Send placeholder" email; standalone invoices create placeholder jobs. |
| **Payments** | 55% | Manual cash/check recording to DB works. Deductions: `MockPaymentProvider` active; Stripe/Square/PayPal stubs reject; customer pay balance disabled; card UI misleading. |
| **Financing** | 70% | Approve/deny via API to Supabase works. Deductions: `createFinancingRequest` mock-first; `inHouseFinancingProvider` RAM-only for some UI paths; risk score defaults to 50. |
| **Schedule** | 85% | Slot CRUD + reservation on booking real. Deductions: production depends on admin creating slots; seed generation only in demo path. |
| **Pricing** | 80% | Admin saves to `company_settings`; booking reads effective pricing. Deductions: travel/minimums card says "contact dev"; public `/pricing` uses effective API but `CompanyProvider` static elsewhere. |
| **Services** | 78% | Admin catalog editable (forms + JSON). Deductions: public `/services` reads `morrisConfig` via `useCompany()`, not DB. |
| **Fleet** | 82% | Truck CRUD + maintenance logs real. Deductions: trailers partially from config; demo depth fallback. |
| **Disposal** | 91% | Strongest module: facilities CRUD, recommendation engine, receipt upload, completion gate (037), review queue, reports. Deductions: demo facilities when DB empty + `DEMO_DATA`; N+1 in review queue; `DisposalSchemaStatus` dev component. |
| **Dispatch** | 78% | `/api/admin/planner` bundles jobs/slots/depth. Deductions: route planner mock fallback; O(jobs×crew) sequential assign fetches; crew names from config when HR roster missing. |
| **Settings** | 72% | Company settings save to DB. Deductions: 11 `AdvancedJsonEditor` panels; Data Inspector dev tool linked; QA/test warnings. |
| **Terms** | 80% | Editable to DB. Deductions: public consumption may still use static config; JSON editor exposed. |
| **Branding** | 80% | Editable to DB. Deductions: `CompanyProvider` always serves `morrisConfig` — admin branding changes may not appear on public site without reload hook. |
| **Employee Portal** | 84% | Dashboard, clock, jobs, training LMS, equipment, onboarding, PTO all work. Deductions: SMS disabled; field payment placeholder; profile photo coming soon. |
| **Customer Portal** | 72% | Real data from `/api/me/customer`. Deductions: Chat/Refer dead `#` links; hardcoded "Today, 10am–2pm"; pay balance/receipts disabled; misleading "Crew en route" chip. |
| **Careers** | 88% | DB postings + public apply flow. Deductions: reference template fallback when API fails; `alert()` on application errors. |
| **Authentication** | 70% | Supabase sign-in/register work; middleware protects routes. Deductions: no password reset; owner email allowlist hardcoded default; no MFA. |
| **Permissions** | 60% | DB tables + seed in migration 013; HR API uses TS permission map. Deductions: Postgres `has_permission()` never called from app; `is_admin()` RLS ≠ app `isAdmin()`. |
| **Notifications** | 25% | Preference toggles saved to DB. Deductions: no send pipeline; command center shows notifications as coming soon. |
| **Emails** | 15% | Placeholder flags only (`sendPlaceholder` on invoice/payment routes). Deductions: no Resend/SendGrid/SMTP integration. |
| **Uploads / Storage** | 75% | 6 buckets; job photos, disposal receipts, invoice PDFs, HR docs wired. Deductions: some UI upload buttons still disabled; storage RLS is service-role-only. |
| **Reports** | 65% | Command center KPIs + disposal reports API. Deductions: no dedicated reports admin page; no P&L/GL module. |
| **Analytics** | 50% | Command center computes real metrics when filtered. Deductions: `lib/mock-analytics.ts` dead code with fake KPIs; no analytics dashboard page. |
| **Search** | 40% | Per-page filters (HR employees, pricing items, disposal facilities). Deductions: no global search. |
| **Logging** | 70% | `activity_log` table + `logActivity()` used. Deductions: no structured app logging, APM, or error tracking. |
| **API Routes** | 75% | Most routes use `requireApiProfile` / permissions. Deductions: 2 critical unauthenticated leaks; inconsistent role checks; no rate limiting. |
| **Cron / Workers** | 0% | No `vercel.json` cron, no Supabase Edge Functions, no background workers. |
| **Supabase / Schema** | 80% | 108 tables, RLS enabled everywhere. Deductions: 25+ unused tables; missing FKs on legacy columns; duplicate 036 migrations. |
| **Overall System** | **78%** | Core ops + HR + disposal are strong; payments, email, notifications, security gaps, and demo remnants prevent confident launch without remediation. |

---

## 3. Issues Register

Every issue uses: **Severity**, **Module**, **Description**, **Risk**, **Recommendation**, **Estimated effort** (XS &lt;2h | S 2–8h | M 1–3d | L 3–5d | XL 1–2w).

---

### 3A. Security

#### SEC-001 Unauthenticated company data store leak
- **Severity:** Critical
- **Module:** API routes / Data layer
- **Description:** `GET /api/data/store?companyId=...` has no auth requirement. `filterStoreByProfile()` returns the **full unfiltered store** when `profile` is null (`lib/db/operations.ts` L1488).
- **Risk:** Any anonymous caller with a `companyId` can download all jobs, invoices, payments, and financing requests.
- **Recommendation:** Require authentication; return 401 when unauthenticated; never return unfiltered data.
- **Estimated effort:** S

#### SEC-002 Public health endpoint exposes infrastructure
- **Severity:** Critical
- **Module:** API routes
- **Description:** `GET /api/health/supabase` is unauthenticated. Returns table probe results, storage health, production env validation flags (`app/api/health/supabase/route.ts`).
- **Risk:** Attackers can map database schema readiness and environment misconfiguration.
- **Recommendation:** Restrict to admin auth or internal network; strip sensitive detail in public responses.
- **Estimated effort:** S

#### SEC-003 Service-role writes bypass RLS
- **Severity:** Critical
- **Module:** Supabase / API routes
- **Description:** `sbWrite()` in `lib/db/operations.ts` uses `createAdminClient()` (service role) for nearly all mutations. RLS is not the primary security boundary.
- **Risk:** Any missed auth check on an API route grants full database write access.
- **Recommendation:** Audit every route handler; add defense-in-depth with RLS where feasible; centralize auth middleware for `/api/*`.
- **Estimated effort:** L

#### SEC-004 Timeclock punch allows cross-employee punching
- **Severity:** High
- **Module:** API routes / HR
- **Description:** `/api/timeclock/punch` accepts `body.employeeId` for any authenticated user except employees punching for someone else (`app/api/timeclock/punch/route.ts` L12–16). Customers, planners, and admins can punch for arbitrary employees.
- **Risk:** Fraudulent time records; payroll corruption.
- **Recommendation:** Restrict to `employee` role (self only) or `admin`/`hr` with explicit permission.
- **Estimated effort:** S

#### SEC-005 Mock payments mark completed without verification
- **Severity:** Critical
- **Module:** Payments
- **Description:** `/api/payments/create` uses `MockPaymentProvider`; card payments recorded as `status: "completed"` without processor confirmation (`lib/payment-provider.ts`).
- **Risk:** Financial records show payment received when no money was collected.
- **Recommendation:** Integrate real processor or restrict to manual admin-recorded payments only; disable card UI until wired.
- **Estimated effort:** L

#### SEC-006 Invoice PDF weak authorization for non-customers
- **Severity:** High
- **Module:** Customer portal / API
- **Description:** `/api/customer/invoices/[id]/pdf` only validates customer ownership when `role === "customer"`. Other roles can fetch any invoice PDF by ID (`app/api/customer/invoices/[id]/pdf/route.ts` L18–20).
- **Risk:** Invoice data exposure to unauthorized authenticated users (e.g., employee knowing UUID).
- **Recommendation:** Apply `canAccessInvoice()` for all roles.
- **Estimated effort:** S

#### SEC-007 No rate limiting on public endpoints
- **Severity:** High
- **Module:** API routes
- **Description:** No application-level rate limiting on `/api/auth/register`, `/api/careers/applications`, `/api/health/supabase`, `/api/data/store`, `/api/schedule/slots`.
- **Risk:** Abuse, credential stuffing, application spam, DoS.
- **Recommendation:** Add rate limiting middleware (IP + user based).
- **Estimated effort:** M

#### SEC-008 Test employee creation endpoint
- **Severity:** High
- **Module:** HR / API
- **Description:** `/api/hr/employees/create-test` creates auth user with plaintext password in response. Gated by `isDevOnlyApiAllowed()` but dangerous if `DEMO_DATA=true` in production.
- **Risk:** Unauthorized test accounts in production database.
- **Recommendation:** Remove from production builds entirely; block at middleware level.
- **Estimated effort:** S

#### SEC-009 Owner email hardcoded default
- **Severity:** Medium
- **Module:** Authentication / Permissions
- **Description:** `lib/auth/staff-allowlist.ts` defaults to `wcba.mo@gmail.com` when `STAFF_OWNER_EMAILS` unset.
- **Risk:** Wrong person gets truncated admin privileges in misconfigured deploy.
- **Recommendation:** Fail startup in production if `STAFF_OWNER_EMAILS` unset (partially done in `validateProductionEnv`).
- **Estimated effort:** XS

#### SEC-010 RLS `is_admin()` vs app `isAdmin()` mismatch
- **Severity:** Medium
- **Module:** Supabase / Permissions
- **Description:** DB `is_admin()` checks `profiles.role = 'admin'`; app `isAdmin()` also requires owner email (migration 022 vs `staff-allowlist.ts`).
- **Risk:** Direct Supabase client access may grant elevated reads to non-owner admin role in DB.
- **Recommendation:** Align RLS helpers with app allowlist or remove admin role from non-owner profiles at DB level.
- **Estimated effort:** M

#### SEC-011 Weak role checks on fleet/dump-site routes
- **Severity:** Medium
- **Module:** API routes
- **Description:** Some routes (`/api/dump-sites`, `/api/trucks/*`) require authentication but not explicit admin/planner role.
- **Risk:** Any logged-in customer could mutate fleet data if they discover endpoints.
- **Recommendation:** Add `requireApiRole(["admin", "planner"])` consistently.
- **Estimated effort:** S

#### SEC-012 Applicant document upload token brute-force
- **Severity:** Medium
- **Module:** Careers / API
- **Description:** `/api/careers/applications/documents` uses `applicantId` + `statusToken` without rate limiting.
- **Risk:** Token guessing could expose applicant uploads.
- **Recommendation:** Rate limit; use cryptographically strong tokens; short expiry.
- **Estimated effort:** S

#### SEC-013 Storage RLS is service-role-only
- **Severity:** Medium
- **Module:** Storage
- **Description:** Migration 031 sets only `service_role_storage_all` on `storage.objects`. All access via signed URLs from server.
- **Risk:** Acceptable if all uploads gated by API auth; any signed URL leak grants temporary access.
- **Recommendation:** Short signed URL TTL; audit upload authorization paths.
- **Estimated effort:** S

#### SEC-014 Middleware does not protect API routes
- **Severity:** Medium
- **Module:** Authentication
- **Description:** `middleware.ts` guards page paths only (`/admin`, `/customer`, etc.). Each API route must self-enforce auth.
- **Risk:** New routes may ship without auth checks.
- **Recommendation:** Add API auth wrapper or Next.js middleware matcher for `/api/*` (excluding intentional public routes).
- **Estimated effort:** M

#### SEC-015 DevToolbar role impersonation
- **Severity:** Low
- **Module:** Authentication
- **Description:** `DevToolbar` allows role impersonation via localStorage. Correctly gated by `NODE_ENV !== "development"`.
- **Risk:** None in production if NODE_ENV correct.
- **Recommendation:** Verify production builds set `NODE_ENV=production`.
- **Estimated effort:** XS

---

### 3B. Data / Mock / Demo Remnants

#### DATA-001 In-memory mock data store
- **Severity:** Critical
- **Module:** Data layer
- **Description:** `lib/mock-data.ts` holds RAM store with demo customers (`cust-m1` Alex Johnson), jobs (`job-m1`), invoices, payments, financing, schedule slots.
- **Risk:** Used when `DEMO_DATA=true` or DB unavailable; can contaminate production perceiving if env misconfigured.
- **Recommendation:** Remove mock fallbacks from production code paths; keep as dev-only test fixtures.
- **Estimated effort:** L

#### DATA-002 DEMO_DATA environment flag
- **Severity:** Critical
- **Module:** Configuration
- **Description:** `lib/is-demo-data.ts` — when `DEMO_DATA=true`, enables mock fallbacks across command center, planner, depth panels, disposal facilities, customer portal.
- **Risk:** Production deploy with flag set shows fake business data.
- **Recommendation:** Block deploy if set (warning exists in `validateProductionEnv`); add runtime banner if detected.
- **Estimated effort:** XS

#### DATA-003 Static morris-config fallbacks
- **Severity:** High
- **Module:** Configuration
- **Description:** `lib/morris-config.ts` contains hardcoded employees (Marcus Webb, Tyler Brooks), trucks, dump sites, pricing, Dicebear avatars, company copy. Used by `CompanyProvider`, planner crew, command center goals.
- **Risk:** UI shows fictional staff/equipment when HR/fleet DB empty.
- **Recommendation:** Fail gracefully with empty states; never show config personas in production.
- **Estimated effort:** M

#### DATA-004 Database seed script
- **Severity:** High
- **Module:** Data layer
- **Description:** `scripts/db-seed.mjs` upserts demo jobs/customers/invoices/payments/employees into Supabase.
- **Risk:** Seed rows with `*-m*` prefixes pollute production if run accidentally.
- **Recommendation:** Require explicit `--force` flag; document cleanup via Data Inspector SQL.
- **Estimated effort:** S

#### DATA-005 DataHydrator syncs Supabase to mock store
- **Severity:** High
- **Module:** Data layer
- **Description:** `components/data/DataHydrator.tsx` calls `/api/data/store` and `applySupabaseStore()` when `DEMO_DATA=true`.
- **Risk:** Perpetuates dual-store architecture; enables client-side mock mutations.
- **Recommendation:** Remove in production builds.
- **Estimated effort:** M

#### DATA-006 Dual-write on job creation
- **Severity:** High
- **Module:** Jobs
- **Description:** `createJobFromBooking()` calls `mockCreateJob()` before Supabase upsert (`lib/db/operations.ts` L163–168).
- **Risk:** Unnecessary coupling to mock layer; ID generation inconsistency.
- **Recommendation:** Generate ID in Supabase path only; remove mock call when DB ready.
- **Estimated effort:** M

#### DATA-007 Financing mock-first create/update
- **Severity:** High
- **Module:** Financing
- **Description:** `createFinancingRequest()` calls `mockCreateFinancingRequest()` first (L736). `inHouseFinancingProvider` in `lib/financing-provider.ts` reads mock store only for some UI operations.
- **Risk:** Financing state desync between UI and Supabase if mock RAM not hydrated.
- **Recommendation:** Mirror `updateJob` DB-first pattern.
- **Estimated effort:** M

#### DATA-008 Mock payment provider active
- **Severity:** Critical
- **Module:** Payments
- **Description:** `MockPaymentProvider` in `lib/payment-provider.ts` is the active provider. Stripe/Square/PayPal classes exist but reject all calls.
- **Risk:** Customers believe they paid; no funds collected.
- **Recommendation:** Wire Stripe (or chosen processor) or hide card payment UI.
- **Estimated effort:** L

#### DATA-009 Mock operations depth snapshot
- **Severity:** Medium
- **Module:** Mission Control / Fleet / Customers
- **Description:** `lib/mock-operations-depth.ts` provides demo timeclock, maintenance, callbacks when API fails + `DEMO_DATA=true`.
- **Risk:** Fake operational depth metrics in demo mode.
- **Recommendation:** Show empty states instead of mock depth.
- **Estimated effort:** S

#### DATA-010 Live dispatch demo simulation
- **Severity:** Medium
- **Module:** Dispatch
- **Description:** `lib/ops/live-dispatch.ts` — `getMarcusLivePhase()` synthesizes truck location timeline for `truck-m1` when demo enabled.
- **Risk:** Fake "live" dispatch on command center.
- **Recommendation:** Remove or gate behind explicit demo mode UI label.
- **Estimated effort:** S

#### DATA-011 Demo disposal facilities
- **Severity:** Medium
- **Module:** Disposal
- **Description:** `lib/db/disposal-facilities.ts` — `demoFacilities()` from `morrisConfig.dumpSites` when DB empty + `DEMO_DATA=true`.
- **Risk:** Fake dump sites shown in disposal UI.
- **Recommendation:** Show empty state; link to add facility.
- **Estimated effort:** S

#### DATA-012 Command center demo fallback
- **Severity:** Medium
- **Module:** Mission Control
- **Description:** `OperationsCommandCenter.tsx` loads `@/lib/mock-data` + `mock-operations-depth` when API fails and `DEMO_DATA=true`.
- **Risk:** Entire dashboard shows fiction after API error.
- **Recommendation:** Show error state; never silently fall back to mock in production.
- **Estimated effort:** S

#### DATA-013 Planner demo fallback
- **Severity:** Medium
- **Module:** Dispatch
- **Description:** `app/planner/page.tsx` falls back to `getJobs`, `getScheduleSlots`, `getMockOperationsDepthSnapshot` from mock-data on API failure + demo.
- **Risk:** Dispatch board shows demo jobs.
- **Recommendation:** Error boundary with retry; no mock fallback.
- **Estimated effort:** S

#### DATA-014 Reference career postings fallback
- **Severity:** Low
- **Module:** Careers
- **Description:** `lib/careers/reference-positions.ts` + `resolve-postings.ts` serve static templates when DB/API empty.
- **Risk:** Stale job listings if conflated with live postings.
- **Recommendation:** Distinguish "template" vs "published"; don't show reference on public site when DB has data.
- **Estimated effort:** S

#### DATA-015 Reference dump sites seed
- **Severity:** Low
- **Module:** Disposal
- **Description:** Migration `033_real_reference_dump_sites.sql` seeds 8 real MO facilities. Legitimate reference data, not fake customers.
- **Risk:** Low — intentional seed.
- **Recommendation:** Verify owner confirms facility list is current.
- **Estimated effort:** XS

#### DATA-016 Placeholder truck after migration 030
- **Severity:** Low
- **Module:** Fleet / HR Equipment
- **Description:** `030_data_legitimacy.sql` deletes fake equipment; retains one "Flagship Truck" placeholder. Equipment manager note references it.
- **Risk:** Misleading fleet inventory if not replaced.
- **Recommendation:** Owner adds real trucks via admin fleet UI; delete placeholder.
- **Estimated effort:** XS

#### DATA-017 Training curriculum seed
- **Severity:** Low
- **Module:** HR Training
- **Description:** Migration `024_training_content.sql` + `lib/db/hr/training-seed-data.ts` seed LMS courses.
- **Risk:** Content may not match company policies.
- **Recommendation:** Owner reviews/customizes training content before launch.
- **Estimated effort:** M

#### DATA-018 HR seed data (departments, templates)
- **Severity:** Low
- **Module:** HR
- **Description:** Migration `021_hr_storage_audit.sql` seeds departments, positions, onboarding templates, document templates.
- **Risk:** Generic templates may not meet legal requirements.
- **Recommendation:** Legal review of document templates.
- **Estimated effort:** M

#### DATA-019 Career templates seed (036)
- **Severity:** Low
- **Module:** Careers
- **Description:** `036_career_templates.sql` seeds ~10 reference job postings.
- **Risk:** Unpublished templates may appear if status filter wrong.
- **Recommendation:** Confirm only `published` postings on public API.
- **Estimated effort:** XS

#### DATA-020 Real-record filter for seed IDs
- **Severity:** Medium
- **Module:** Data layer
- **Description:** `lib/data/real-record-filter.ts` filters `*-m*` seed rows when `DEMO_DATA` false. Applied after full fetch, not in SQL.
- **Risk:** Seed rows still in DB; filter is client/server side only on reads.
- **Recommendation:** Run cleanup SQL from `lib/data/seed-cleanup-sql.ts` before launch.
- **Estimated effort:** S

#### DATA-021 Orphan mock-analytics module
- **Severity:** Low
- **Module:** Analytics
- **Description:** `lib/mock-analytics.ts` contains hardcoded KPIs ($4,280 revenue, 74% conversion, 4.9 satisfaction). Not imported anywhere.
- **Risk:** Dead code confusion; may be wired accidentally.
- **Recommendation:** Delete file.
- **Estimated effort:** XS

#### DATA-022 Placeholder photos
- **Severity:** Medium
- **Module:** Uploads / Booking
- **Description:** `/placeholder-photo.jpg` referenced in `mock-data.ts` and `BookingWizard`. Job photos may use blob placeholders.
- **Risk:** Jobs appear to have photos when they don't.
- **Recommendation:** Wire real photo upload or remove placeholder references.
- **Estimated effort:** M

#### DATA-023 Dicebear avatar URLs
- **Severity:** Low
- **Module:** HR / Config
- **Description:** `morris-config.ts` and `lib/hr/employee-roster.ts` use Dicebear URLs for demo avatars.
- **Risk:** Unprofessional appearance if shown for real employees without photos.
- **Recommendation:** Use initials fallback or require photo upload.
- **Estimated effort:** S

#### DATA-024 Demo customer ID resolution
- **Severity:** Medium
- **Module:** Customer portal
- **Description:** `lib/demo-customer.ts` returns `cust-m1` when demo enabled. Used by `useCustomerPortal`.
- **Risk:** Wrong customer context in demo mode.
- **Recommendation:** Never resolve demo customer in production.
- **Estimated effort:** XS

#### DATA-025 Client mutations mock fallback
- **Severity:** Medium
- **Module:** API / Data layer
- **Description:** `lib/api/mutations.ts` falls back to mock-data when `NEXT_PUBLIC_USE_SUPABASE !== "true"`.
- **Risk:** Client-side mutations bypass Supabase in misconfigured deploy.
- **Recommendation:** Fail loudly when Supabase not enabled in production.
- **Estimated effort:** S

#### DATA-026 Route planner mock getJob fallback
- **Severity:** High
- **Module:** Dispatch
- **Description:** `lib/route-planner.ts` falls back to `mockGetJob()` when jobs not passed and demo enabled.
- **Risk:** Empty or wrong routes in production edge cases.
- **Recommendation:** Require jobs from API; remove mock fallback.
- **Estimated effort:** S

#### DATA-027 Invoice placeholder job creation
- **Severity:** Medium
- **Module:** Invoices
- **Description:** Standalone invoice creation inserts "Placeholder job for standalone invoice" text in operations layer.
- **Risk:** Orphan placeholder jobs pollute job list.
- **Recommendation:** Allow invoices without jobs via nullable `job_id` or dedicated invoice-only flow.
- **Estimated effort:** M

#### DATA-028 Equipment photo placeholder URI
- **Severity:** Low
- **Module:** HR Equipment
- **Description:** `EquipmentManager.tsx` saves `placeholder://{assetId}/photo-pending` for photos.
- **Risk:** Broken image links in equipment records.
- **Recommendation:** Implement real photo upload or hide photo button.
- **Estimated effort:** M

#### DATA-029 COMMON_JUNK_ITEMS placeholder pricing
- **Severity:** Medium
- **Module:** Pricing
- **Description:** `lib/common-junk-items.ts` contains "Placeholder pricing" comments for some items.
- **Risk:** Estimates may use stale default prices.
- **Recommendation:** Owner sets all item prices in admin pricing UI.
- **Estimated effort:** S

#### DATA-030 QA test data prefixes
- **Severity:** Medium
- **Module:** Data layer
- **Description:** `lib/data/operations-debug-report.ts` detects smoke-test IDs, QA prefixes. `QaTestDataWarning` banner in admin settings.
- **Risk:** QA records in production database.
- **Recommendation:** Run cleanup before launch; remove QA banner from production UI.
- **Estimated effort:** S

---

### 3C. Database & Schema

#### DB-001 Duplicate migration prefix 036
- **Severity:** Medium
- **Module:** Supabase
- **Description:** Two files share prefix `036`: `036_career_templates.sql` and `036_disposal_receipts_and_profit.sql`. Supabase applies lexicographic order (career before disposal).
- **Risk:** Confusion; fragile ordering if cross-dependencies added later.
- **Recommendation:** Renumber disposal file to `038_*`.
- **Estimated effort:** XS

#### DB-002 Missing FK on jobs.customer_id
- **Severity:** High
- **Module:** Database schema
- **Description:** `jobs.customer_id` is `text not null` without FK to `customers` (migration 001).
- **Risk:** Orphan jobs; referential integrity violations.
- **Recommendation:** Add FK constraint after data cleanup.
- **Estimated effort:** M

#### DB-003 Missing FK on invoices/payments customer_id
- **Severity:** High
- **Module:** Database schema
- **Description:** `invoices.customer_id`, `payments.customer_id` lack FK constraints.
- **Risk:** Orphan financial records.
- **Recommendation:** Add FKs with ON DELETE RESTRICT.
- **Estimated effort:** M

#### DB-004 Missing FK on disposal site IDs
- **Severity:** Medium
- **Module:** Disposal
- **Description:** `junk_removal_details.recommended_disposal_site_id`, `actual_disposal_site_id`, `selected_disposal_site_id` have no FK to `dump_sites`.
- **Risk:** References to deleted facilities.
- **Recommendation:** Add FK constraints.
- **Estimated effort:** S

#### DB-005 Duplicate receipt URL columns
- **Severity:** Medium
- **Module:** Disposal
- **Description:** `disposal_receipt_url` (034) and `disposal_weight_ticket_url` (036) on `junk_removal_details`.
- **Risk:** Confusion about canonical receipt field.
- **Recommendation:** Consolidate to single column; migrate data.
- **Estimated effort:** S

#### DB-006 disposal_events RLS uses app.company_id
- **Severity:** High
- **Module:** Supabase / RLS
- **Description:** `disposal_events` policy uses `current_setting('app.company_id', true)` — not set by standard Supabase JS client.
- **Risk:** RLS ineffective for authenticated client reads; only works via service role.
- **Recommendation:** Use `morris_company_id()` helper like other ops tables.
- **Estimated effort:** S

#### DB-007 ~25 unused application tables
- **Severity:** Medium
- **Module:** Database schema
- **Description:** Tables never referenced via `.from()` in app/lib: `job_notes`, `notifications`, `employee_addresses`, `employee_pay_rates`, `permission_definitions`, `workforce_role_permissions`, `profile_permission_overrides`, `employee_availability`, `employee_unavailability`, `shift_swap_requests`, `timesheet_approvals`, `payroll_adjustments`, `payroll_tax_liabilities`, `insurance_policies`, `employee_promotions`, `employee_raises`, `hr_investigations`, `employee_awards`, `employee_fleet_history`, `pto_policies`, `application_documents` (superseded by `applicant_documents`), etc.
- **Risk:** Schema drift; migration cost; false impression features exist.
- **Recommendation:** Wire features or drop tables in phased migration.
- **Estimated effort:** XL

#### DB-008 Permissions system unused in app
- **Severity:** High
- **Module:** Permissions
- **Description:** Migration 013 seeds `permission_definitions`, `workforce_role_permissions`, `has_permission()` SQL function. Never called from TypeScript; app uses `permissions-hr.ts` map instead.
- **Risk:** Two permission systems; DB seed is dead weight.
- **Recommendation:** Wire `has_permission()` in API or remove DB tables.
- **Estimated effort:** L

#### DB-009 hauling_details write-only
- **Severity:** Low
- **Module:** Jobs
- **Description:** `hauling_details` upserted on hauling job create; never queried back in app code.
- **Risk:** Data exists only in table, not surfaced in UI.
- **Recommendation:** Read hauling details in job detail views or remove table.
- **Estimated effort:** M

#### DB-010 application_documents vs applicant_documents
- **Severity:** Medium
- **Module:** HR / ATS
- **Description:** `application_documents` (011) superseded by `applicant_documents` (032). Old table unused.
- **Risk:** Schema confusion.
- **Recommendation:** Drop `application_documents` after confirming no data.
- **Estimated effort:** S

#### DB-011 Missing index on disposal_review_status
- **Severity:** Medium
- **Module:** Disposal
- **Description:** No index on `junk_removal_details(disposal_review_status)` added in migration 037.
- **Risk:** Slow disposal review queue as job volume grows.
- **Recommendation:** Add partial index WHERE status = 'pending'.
- **Estimated effort:** XS

#### DB-012 Missing index on payments.customer_id
- **Severity:** Medium
- **Module:** Database schema
- **Description:** RLS and customer portal filter on `payments.customer_id` without index.
- **Risk:** Slow customer payment queries at scale.
- **Recommendation:** Add index.
- **Estimated effort:** XS

#### DB-013 Health check probes only 16 tables
- **Severity:** Low
- **Module:** Supabase
- **Description:** `/api/health/supabase` probes 16 "core" tables; excludes HR, disposal, training, equipment tables from 010–037.
- **Risk:** False "healthy" status when HR/disposal tables missing.
- **Recommendation:** Expand probe list or split health checks by domain.
- **Estimated effort:** S

#### DB-014 recommended_disposal_site_id duplicated in migrations
- **Severity:** Low
- **Module:** Disposal
- **Description:** Column added in both 034 and 036 (harmless due to IF NOT EXISTS).
- **Risk:** Migration noise.
- **Recommendation:** Clean up in future migration comments only.
- **Estimated effort:** XS

#### DB-015 activity_log / document_audit_log INSERT via service role only
- **Severity:** Low
- **Module:** Supabase / RLS
- **Description:** SELECT policies exist; no INSERT policy for authenticated users.
- **Risk:** Acceptable given service-role write pattern; document explicitly.
- **Recommendation:** Document as intentional or add INSERT policies.
- **Estimated effort:** XS

#### DB-016 notifications table unused
- **Severity:** Medium
- **Module:** Notifications
- **Description:** `notifications` table created in migration 002; never read/written in app code.
- **Risk:** Feature appears planned but unimplemented.
- **Recommendation:** Implement notification pipeline or remove table.
- **Estimated effort:** L

#### DB-017 job_notes table unused
- **Severity:** Low
- **Module:** Jobs
- **Description:** `job_notes` table exists; app uses job payload/CRM interactions instead.
- **Risk:** Dead schema.
- **Recommendation:** Wire job notes UI or remove.
- **Estimated effort:** M

#### DB-018 pto_policies seeded but never read
- **Severity:** Medium
- **Module:** HR
- **Description:** Migration 027 seeds W2 PTO policy; app never reads `pto_policies` table.
- **Risk:** PTO accrual may not match business rules.
- **Recommendation:** Wire accrual engine or confirm manual PTO management.
- **Estimated effort:** M

#### DB-019 Storage buckets defined in two migrations
- **Severity:** Low
- **Module:** Storage
- **Description:** 5 buckets in 031; `disposal-receipts` added in 036.
- **Risk:** None functionally.
- **Recommendation:** Document in README.
- **Estimated effort:** XS

#### DB-020 profiles.id as text not uuid
- **Severity:** Low
- **Module:** Database schema
- **Description:** `profiles.id` cast from `auth.uid()::text`.
- **Risk:** Non-standard but functional.
- **Recommendation:** Accept or migrate to uuid type.
- **Estimated effort:** L

---

### 3D. Business Workflow Gaps

#### WF-001 Customer booking — login required
- **Severity:** High
- **Module:** Booking
- **Description:** `BookingWizard` redirects to `/register` before submit if not authenticated.
- **Risk:** Friction; marketing "book online" promise broken for guests.
- **Recommendation:** Owner decision: guest checkout with email or require account.
- **Estimated effort:** M

#### WF-002 No auto-invoice on job completion
- **Severity:** High
- **Module:** Invoices
- **Description:** Job completion via `/api/jobs/[id]/status` does not trigger invoice creation.
- **Risk:** Manual invoicing step forgotten; revenue delay.
- **Recommendation:** Auto-generate draft invoice on completion or prompt admin.
- **Estimated effort:** M

#### WF-003 No email at any workflow step
- **Severity:** Critical
- **Module:** Emails / Notifications
- **Description:** No emails sent on booking confirmation, estimate approval, schedule reminder, crew en route, completion, invoice, or payment receipt.
- **Risk:** Customers and staff miss critical updates.
- **Recommendation:** Integrate email provider; define notification templates per step.
- **Estimated effort:** L

#### WF-004 Card payment not real
- **Severity:** Critical
- **Module:** Payments
- **Description:** End-to-end payment flow records mock completion.
- **Risk:** Cannot collect card revenue.
- **Recommendation:** Integrate payment processor.
- **Estimated effort:** L

#### WF-005 No customer review capture
- **Severity:** Medium
- **Module:** Review Queue / CRM
- **Description:** CRM has `review_request` interaction type; no customer-facing review form or Google review workflow. `mock-analytics.ts` fakes review text (unused).
- **Risk:** Missed reputation building.
- **Recommendation:** Post-completion review request email + link.
- **Estimated effort:** M

#### WF-006 No general ledger / accounting module
- **Severity:** High
- **Module:** Reports / Accounting
- **Description:** Payroll CSV export and 1099 summaries exist; no AR/AP, reconciliation, or GL.
- **Risk:** Manual accounting outside system.
- **Recommendation:** Phase 2 QuickBooks integration or export formats.
- **Estimated effort:** XL

#### WF-007 Dispatch route not persisted
- **Severity:** Medium
- **Module:** Dispatch
- **Description:** `routes` and `route_stops` tables exist; planner UI does not persist optimized routes.
- **Risk:** Routes re-planned manually each day.
- **Recommendation:** Save route plans from planner.
- **Estimated effort:** L

#### WF-008 Schedule slot creation manual
- **Severity:** Medium
- **Module:** Schedule
- **Description:** Production requires admin to create schedule slots; auto-seed only in demo/mock path.
- **Risk:** Empty booking calendar if slots not created.
- **Recommendation:** Cron to generate slots from capacity settings.
- **Estimated effort:** M

#### WF-009 Estimate review queue not paginated
- **Severity:** Low
- **Module:** Review Queue
- **Description:** Loads all jobs from `/api/admin/jobs` then client-filters.
- **Risk:** Slow with large job volume.
- **Recommendation:** Dedicated API with `reviewStatus=needs_review` filter + pagination.
- **Estimated effort:** S

#### WF-010 Financing hybrid store desync
- **Severity:** High
- **Module:** Financing
- **Description:** Approve/deny uses API; some UI paths use `inHouseFinancingProvider` mock-only.
- **Risk:** Stale financing state in UI.
- **Recommendation:** All financing through Supabase APIs.
- **Estimated effort:** M

#### WF-011 Disposal completion gate works
- **Severity:** N/A (positive)
- **Module:** Disposal
- **Description:** Migration 037 + `canMarkJobCompleted()` enforces disposal recorded or skipped before completion.
- **Risk:** None — this workflow step is production-ready.
- **Recommendation:** Owner confirm skip policy rules.
- **Estimated effort:** XS

#### WF-012 Hire applicant to employee works
- **Severity:** N/A (positive)
- **Module:** HR
- **Description:** Applicant pipeline → hire creates employee + auth profile.
- **Risk:** None for core flow.
- **Recommendation:** Verify onboarding checklist matches company policy.
- **Estimated effort:** XS

#### WF-013 Employee training LMS complete
- **Severity:** N/A (positive)
- **Module:** HR Training
- **Description:** Full loop: assign → lessons → quiz → acknowledge → certificate.
- **Risk:** Seed content may need customization.
- **Recommendation:** Owner reviews course content.
- **Estimated effort:** M

#### WF-014 Repeat customer — no loyalty/referral
- **Severity:** Low
- **Module:** Customer portal
- **Description:** Customer dashboard "Refer" quick action is dead link (`href="#"`).
- **Risk:** Missed referral revenue.
- **Recommendation:** Implement referral program or remove button.
- **Estimated effort:** M

#### WF-015 Payroll aggregation partial
- **Severity:** Medium
- **Module:** HR Payroll
- **Description:** `/api/hr/payroll` aggregates timeclock; admin time UI is placeholder page.
- **Risk:** Cannot review/approve timesheets in admin UI.
- **Recommendation:** Build Time & Attendance admin page.
- **Estimated effort:** L

---

### 3E. Performance

#### PERF-001 Unbounded getJobs/getInvoices/getPayments
- **Severity:** High
- **Module:** Data layer
- **Description:** `lib/db/operations.ts` — full `select("*")` per company with no limit.
- **Risk:** Memory and latency grow linearly with business volume.
- **Recommendation:** Add pagination (cursor/offset) to all list functions and admin APIs.
- **Estimated effort:** L

#### PERF-002 getCompanyStore loads entire dataset
- **Severity:** High
- **Module:** Data layer
- **Description:** Parallel fetch of all customers, employees, jobs, invoices, payments, financing for hydration.
- **Risk:** Massive payload for DataHydrator.
- **Recommendation:** Remove client hydration pattern; use per-resource APIs.
- **Estimated effort:** L

#### PERF-003 Command center parallel full fetches
- **Severity:** High
- **Module:** Mission Control
- **Description:** `getOperationsCommandCenter()` loads jobs, invoices, payments, financing, customers, activity (100 rows), schedule slots, depth snapshot in parallel.
- **Risk:** Slow admin home page at scale.
- **Recommendation:** Pre-aggregate KPIs in SQL or materialized view; paginate activity.
- **Estimated effort:** L

#### PERF-004 Disposal review queue N+1
- **Severity:** High
- **Module:** Disposal
- **Description:** `listDisposalReviewQueue()` loops up to 200 jobs calling `getJobById()` each (`lib/db/disposal-review.ts`).
- **Risk:** 200+ DB round trips per page load.
- **Recommendation:** Batch job fetch with JOIN on junk_removal_details.
- **Estimated effort:** M

#### PERF-005 Full disposal_events table scan
- **Severity:** Medium
- **Module:** Disposal
- **Description:** `getDisposalDashboard()` and `getFacilityHistoricalStats()` scan entire `disposal_events` table.
- **Risk:** Slow disposal reporting at scale.
- **Recommendation:** Aggregate tables or date-range queries with indexes.
- **Estimated effort:** M

#### PERF-006 getDisposalFacilityById loads all facilities
- **Severity:** Medium
- **Module:** Disposal
- **Description:** Loads all facilities then `.find()` by ID.
- **Risk:** Unnecessary data transfer.
- **Recommendation:** Query by primary key.
- **Estimated effort:** XS

#### PERF-007 Planner crew assign sequential fetches
- **Severity:** Medium
- **Module:** Dispatch
- **Description:** `app/planner/page.tsx` `handleAssignCrew` — nested loops with sequential `fetch()` per job×employee.
- **Risk:** Multi-second assign operations.
- **Recommendation:** Batch assign API endpoint.
- **Estimated effort:** M

#### PERF-008 Signed URL N+1 for photos
- **Severity:** Medium
- **Module:** Uploads
- **Description:** `listJobPhotos()`, document-files, job-photos use `Promise.all(rows.map(createSignedStorageUrl))`.
- **Risk:** Many storage API calls per job detail.
- **Recommendation:** Batch signed URL generation or public CDN paths.
- **Estimated effort:** M

#### PERF-009 Real-record filter after full fetch
- **Severity:** Medium
- **Module:** Data layer
- **Description:** `real-record-filter.ts` applied in JS after loading all rows.
- **Risk:** Wasted DB and network on seed rows.
- **Recommendation:** Filter in SQL WHERE clauses.
- **Estimated effort:** M

#### PERF-010 No pagination on admin list pages
- **Severity:** Medium
- **Module:** Admin UI
- **Description:** `/admin/invoices`, `/admin/jobs`, `/admin/payments`, financing center fetch full datasets.
- **Risk:** Browser slowdown with hundreds of records.
- **Recommendation:** Server-side pagination + virtual scroll.
- **Estimated effort:** L

#### PERF-011 Command center metrics computed in JS
- **Severity:** Low
- **Module:** Mission Control
- **Description:** `command-center-metrics.ts` aggregates over full filtered arrays in memory.
- **Risk:** CPU spike on large datasets.
- **Recommendation:** SQL aggregates.
- **Estimated effort:** M

#### PERF-012 No application caching
- **Severity:** Low
- **Module:** Performance
- **Description:** No Redis, edge cache, or SWR revalidation strategy for pricing/settings.
- **Risk:** Repeated DB hits for static-ish config.
- **Recommendation:** Cache effective pricing with TTL.
- **Estimated effort:** M

---

### 3F. Integrations

#### INT-001 Supabase Auth — Works
- **Severity:** N/A
- **Module:** Authentication
- **Description:** Sign-in, sign-up, sign-out, session cookies via `@supabase/ssr`. Middleware validates on protected pages.
- **Risk:** Password reset missing.
- **Recommendation:** Add `resetPasswordForEmail` flow.
- **Estimated effort:** M

#### INT-002 Supabase DB — Works (service role)
- **Severity:** N/A
- **Module:** Supabase
- **Description:** Full CRUD for ops, HR, disposal when env configured.
- **Risk:** Depends on migration state on production project.
- **Recommendation:** Verify all 38 migrations applied.
- **Estimated effort:** S

#### INT-003 Supabase Storage — Partial
- **Severity:** Medium
- **Module:** Storage
- **Description:** 6 buckets; uploads work for job photos, disposal receipts, invoice PDFs, HR/applicant documents.
- **Risk:** Some UI upload buttons still disabled.
- **Recommendation:** Enable remaining upload UIs.
- **Estimated effort:** M

#### INT-004 Email — Not integrated
- **Severity:** Critical
- **Module:** Emails
- **Description:** No Resend, SendGrid, Nodemailer, Postmark, or SMTP in codebase.
- **Risk:** No transactional email capability.
- **Recommendation:** Integrate chosen provider with template library.
- **Estimated effort:** L

#### INT-005 SMS / Push — Not integrated
- **Severity:** High
- **Module:** Notifications
- **Description:** No Twilio or push provider. SMS disabled in `CurrentAssignmentCard.tsx`.
- **Risk:** Field communication gap.
- **Recommendation:** Integrate SMS or remove disabled buttons.
- **Estimated effort:** L

#### INT-006 Stripe — Stub
- **Severity:** Critical
- **Module:** Payments
- **Description:** `StripeProvider` rejects all methods. Env vars in `.env.example` only.
- **Risk:** Cannot process cards.
- **Recommendation:** Implement Stripe Payment Intents or Checkout.
- **Estimated effort:** L

#### INT-007 Square / PayPal — Stubs
- **Severity:** Low
- **Module:** Payments
- **Description:** Provider classes exist but reject "not configured".
- **Risk:** None unless owner chooses these processors.
- **Recommendation:** Implement if needed; otherwise remove dead code.
- **Estimated effort:** L

#### INT-008 Google Maps API — Not integrated
- **Severity:** Medium
- **Module:** Dispatch
- **Description:** Haversine placeholder in `lib/distance/distance-provider.ts`; TODO for Google Distance Matrix.
- **Risk:** Inaccurate travel estimates.
- **Recommendation:** Integrate Distance Matrix or Mapbox.
- **Estimated effort:** M

#### INT-009 External payroll — CSV only
- **Severity:** Medium
- **Module:** HR Payroll
- **Description:** CSV/QuickBooks-format export from `/api/hr/payroll`; no ADP/Gusto API.
- **Risk:** Manual payroll import.
- **Recommendation:** Confirm export format with owner's provider.
- **Estimated effort:** M

#### INT-010 Cron / scheduled jobs — None
- **Severity:** High
- **Module:** Cron jobs
- **Description:** No Vercel cron, Edge Functions, or background workers.
- **Risk:** No automated reminders, slot generation, or training expiry.
- **Recommendation:** Add cron for critical scheduled tasks.
- **Estimated effort:** L

#### INT-011 Accounting software — None
- **Severity:** Medium
- **Module:** Accounting
- **Description:** No QuickBooks/Xero integration.
- **Risk:** Double data entry.
- **Recommendation:** Phase 2 based on owner stack.
- **Estimated effort:** XL

#### INT-012 External calendar — None
- **Severity:** Low
- **Module:** Schedule
- **Description:** Internal schedule slots only.
- **Risk:** None if internal scheduling sufficient.
- **Recommendation:** Evaluate Calendly/Google Calendar sync need.
- **Estimated effort:** L

---

### 3G. UI/UX

#### UX-001 AdvancedJsonEditor in production admin
- **Severity:** High
- **Module:** Settings
- **Description:** 11 admin sections expose raw JSON editor (`components/admin/settings/shared.tsx`).
- **Risk:** Owner breaks config; unprofessional interface.
- **Recommendation:** Form-based UI; hide JSON behind dev-only advanced panel.
- **Estimated effort:** L

#### UX-002 Data Inspector in admin settings
- **Severity:** High
- **Module:** Settings
- **Description:** `/admin/settings/data-inspector` exposes UUIDs, counts, cleanup SQL.
- **Risk:** Developer tool in production admin.
- **Recommendation:** Remove from production nav or dev-gate.
- **Estimated effort:** S

#### UX-003 Customer portal dead Chat/Refer links
- **Severity:** Medium
- **Module:** Customer portal
- **Description:** `href="#"` on Chat and Refer (`app/customer/page.tsx` L52–53).
- **Risk:** Broken UX.
- **Recommendation:** Implement or remove.
- **Estimated effort:** M

#### UX-004 Hardcoded schedule time on customer timeline
- **Severity:** Medium
- **Module:** Customer portal
- **Description:** "Today, 10am–2pm" hardcoded when status is scheduled (L37).
- **Risk:** Customer misinformation.
- **Recommendation:** Use actual schedule slot from job data.
- **Estimated effort:** S

#### UX-005 Misleading "Crew en route" chip
- **Severity:** Medium
- **Module:** Customer portal
- **Description:** Active job card always shows en-route chip.
- **Risk:** False expectations.
- **Recommendation:** Map chip to actual status.
- **Estimated effort:** XS

#### UX-006 Disabled customer pay balance
- **Severity:** High
- **Module:** Customer portal
- **Description:** Pay balance disabled on `/customer/payments`.
- **Risk:** Customers cannot self-pay.
- **Recommendation:** Enable when payment processor wired.
- **Estimated effort:** M

#### UX-007 Disabled receipt download
- **Severity:** Medium
- **Module:** Customer portal
- **Description:** Receipts button disabled on payments page.
- **Risk:** No payment proof for customers.
- **Recommendation:** Link to invoice PDF or generate receipt.
- **Estimated effort:** M

#### UX-008 HR placeholder pages linked from dashboard
- **Severity:** High
- **Module:** HR Platform
- **Description:** `/admin/hr/time` and `/admin/hr/performance` are `HrPlaceholderPage` stubs linked from dashboard alerts.
- **Risk:** Dead-end admin clicks.
- **Recommendation:** Build pages or remove links.
- **Estimated effort:** L

#### UX-009 Mission Control "Coming soon" section
- **Severity:** Medium
- **Module:** Mission Control
- **Description:** Weather, fuel, GPS, notifications tiles (`OperationsCommandCenter.tsx`).
- **Risk:** Unfinished features prominently displayed.
- **Recommendation:** Hide until implemented.
- **Estimated effort:** XS

#### UX-010 Password reset coming soon
- **Severity:** High
- **Module:** Authentication
- **Description:** `/forgot-password` has no reset flow.
- **Risk:** Locked-out users must call.
- **Recommendation:** Supabase password reset email.
- **Estimated effort:** M

#### UX-011 alert() on careers application error
- **Severity:** Low
- **Module:** Careers
- **Description:** `ApplicationForm.tsx` uses browser alert.
- **Risk:** Unprofessional errors.
- **Recommendation:** Use toast component.
- **Estimated effort:** XS

#### UX-012 Admin employees redirect confusion
- **Severity:** Low
- **Module:** Employees
- **Description:** `/admin/employees` redirects; `AdminEmployeesPanel` unused.
- **Risk:** Nav confusion; dead code.
- **Recommendation:** Single nav entry; remove dead component.
- **Estimated effort:** S

#### UX-013 Large admin tables without pagination
- **Severity:** Medium
- **Module:** Admin UI
- **Description:** Full list renders on jobs, invoices, payments pages.
- **Risk:** Poor UX at scale.
- **Recommendation:** Server-side pagination.
- **Estimated effort:** L

#### UX-014 Internal profit on admin cards
- **Severity:** Low
- **Module:** Estimates
- **Description:** `showInternalProfit` on admin job cards.
- **Risk:** OK for admin if not leaked to portals.
- **Recommendation:** Verify role gating.
- **Estimated effort:** XS

#### UX-015 Create test employee button
- **Severity:** Medium
- **Module:** HR Platform
- **Description:** "Create Brad Test Employee" on HR dashboard (dev-gated).
- **Risk:** Confusing in staging.
- **Recommendation:** Dev tools menu only.
- **Estimated effort:** XS

#### UX-016 Invoice Send placeholder button
- **Severity:** High
- **Module:** Invoices
- **Description:** Send action sets placeholder notes only.
- **Risk:** Admin thinks invoice emailed.
- **Recommendation:** Disable until email wired.
- **Estimated effort:** S

#### UX-017 Payment card placeholder label
- **Severity:** Medium
- **Module:** Payments
- **Description:** Admin new payment mentions "card placeholder".
- **Risk:** Staff confusion.
- **Recommendation:** Hide card until processor integrated.
- **Estimated effort:** XS

#### UX-018 Public site static CompanyProvider
- **Severity:** Medium
- **Module:** Branding
- **Description:** `CompanyProvider` always serves `morrisConfig`; DB branding may not appear on public pages.
- **Risk:** Admin edits invisible on public site.
- **Recommendation:** Hydrate from settings API.
- **Estimated effort:** M

#### UX-019 Employee SMS disabled
- **Severity:** Low
- **Module:** Employee portal
- **Description:** SMS coming soon in `CurrentAssignmentCard.tsx`.
- **Risk:** Field comms gap.
- **Recommendation:** Integrate or remove.
- **Estimated effort:** M

#### UX-020 Missing global search
- **Severity:** Medium
- **Module:** Search
- **Description:** No cross-module search.
- **Risk:** Slow admin workflows.
- **Recommendation:** Command palette / global search.
- **Estimated effort:** L

---

## 4. Page Audit (77 Routes)

**Legend:** Works = core function operational with Supabase configured. Complete = feature-finished for production. Ready = safe for real customers/employees without demo remnants.

### 4.1 Public website

| Route | Works | Complete | Ready | Mock/placeholder | Hardcoded | Dev tools | Disabled/dead | Mobile | Notes |
|-------|-------|----------|-------|------------------|-----------|-----------|---------------|--------|-------|
| `/` | Yes | Partial | Partial | `morrisConfig` marketing | Stats/copy in config | No | No | Yes | Branding not from DB |
| `/services` | Yes | Partial | Partial | `useCompany()` → morrisConfig | Service list static | No | No | Yes | Admin services DB not reflected |
| `/pricing` | Yes | Partial | Partial | Config fallback | — | No | No | Yes | Uses `useEffectivePricing` ✓ |
| `/book` | Yes | Partial | Partial | Photo placeholder | — | No | Login required at submit | Yes | DB pricing ✓; guest blocked |
| `/platform` | N/A | No | No | — | — | No | Redirects to `/admin` | — | Legacy redirect |

### 4.2 Auth & account

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/login` | Yes | Yes | Yes | No | — | No | No | Yes | Supabase auth |
| `/register` | Yes | Partial | Partial | No | — | No | No | Yes | Customer profile created |
| `/forgot-password` | No | No | No | — | Phone in config | No | Entire flow | Yes | **Coming soon only** |
| `/company-login` | N/A | — | — | — | — | No | Redirect `/login` | — | Alias |
| `/account` | Yes | Yes | Yes | No | — | No | No | Yes | Profile summary |
| `/unauthorized` | Yes | Yes | Yes | Static | — | No | No | Yes | — |

### 4.3 Customer portal

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/customer` | Yes | Partial | Partial | Demo customer if DEMO_DATA | Timeline time | No | Chat/Refer `#` | Yes | En-route chip misleading |
| `/customer/jobs` | Yes | Yes | Partial | Demo fallback | — | No | No | Yes | Real API |
| `/customer/jobs/[id]` | Yes | Yes | Partial | Demo fallback | — | No | No | Yes | — |
| `/customer/payments` | Yes | Partial | No | — | — | No | Pay balance, receipts | Yes | **Pay disabled** |
| `/customer/payments/[id]` | Partial | Partial | No | — | — | No | PDF disabled | Yes | — |
| `/customer/financing` | Yes | Partial | Partial | — | Signature placeholder | No | No | Yes | Wizard works |

### 4.4 Employee portal

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/employee` | Yes | Partial | Partial | Config truck names | — | Admin preview banner | No | Yes | BottomNav |
| `/employee/clock` | Yes | Yes | Yes | No | — | No | No | Yes | Punch API |
| `/employee/schedule` | Yes | Partial | Partial | No | — | No | No | Yes | — |
| `/employee/jobs/[id]` | Yes | Partial | Partial | — | — | No | Photo upload | Yes | Field job |
| `/employee/documents` | Yes | Partial | Partial | Handbook placeholder | — | No | PDF viewer | Yes | Sign works |
| `/employee/profile` | Yes | Partial | Partial | — | — | No | Photo upload | Yes | Prefs saved, no send |
| `/employee/time-off` | Yes | Yes | Yes | No | — | No | No | Yes | PTO request |
| `/employee/equipment` | Yes | Yes | Yes | No | — | No | No | Yes | Checkout/return |
| `/employee/training` | Yes | Yes | Yes | Seed curriculum | — | No | No | Yes | LMS list |
| `/employee/training/[courseId]` | Yes | Yes | Yes | No | — | No | No | Yes | Quiz/ack/cert |
| `/employee/onboarding` | Yes | Yes | Yes | No | — | No | No | Yes | Checklist |

### 4.5 Careers (public)

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/careers` | Yes | Yes | Yes | Reference fallback | — | No | No | Yes | API-first |
| `/careers/jobs` | Yes | Yes | Yes | Reference fallback | — | No | No | Yes | Search filter |
| `/careers/jobs/[slug]` | Yes | Yes | Yes | — | — | No | No | Yes | — |
| `/careers/apply/[postingId]` | Yes | Partial | Partial | — | — | No | No | Yes | `alert()` on error |

### 4.6 Dispatch

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/planner` | Yes | Partial | Partial | Demo fallback | Config crew | No | No | Yes | Route planner mock risk |

### 4.7 Admin — Mission Control & operations

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/admin` | Yes | Partial | Partial | Demo fallback | Revenue goal $2500 | No | Coming soon tiles | Yes | Command center |
| `/admin/jobs` | Yes | Partial | Partial | DEMO_DATA filter | — | No | No | Yes | No pagination |
| `/admin/customers` | Yes | Yes | Yes | Depth demo fallback | — | No | No | Yes | CRM works |
| `/admin/employees` | N/A | — | — | — | — | No | Redirect HR | — | Legacy |
| `/admin/review` | Yes | Partial | Partial | — | — | No | No | Yes | Full jobs fetch |
| `/admin/estimates` | Yes | Partial | Partial | — | Internal profit | No | No | Yes | — |
| `/admin/estimates/new` | Yes | Partial | Partial | Photo placeholder | — | No | No | Yes | Intake form |
| `/admin/invoices` | Yes | Partial | Partial | — | — | No | No | Yes | — |
| `/admin/invoices/new` | Yes | Partial | No | Placeholder job | — | No | Send placeholder | Yes | — |
| `/admin/invoices/[id]` | Yes | Partial | Partial | — | — | No | No | Yes | Mark paid works |
| `/admin/payments` | Yes | Partial | Partial | — | — | No | No | Yes | — |
| `/admin/payments/new` | Yes | Partial | No | Card placeholder | — | No | Card method | Yes | — |
| `/admin/financing` | Yes | Partial | Partial | Risk default 50 | — | No | No | Yes | Approve/deny OK |
| `/admin/schedule` | Yes | Partial | Partial | Slot seed demo | — | No | No | Yes | — |
| `/admin/pricing` | Yes | Partial | Partial | Config fallback card | Travel/minimums | JSON editor | No | Yes | DB save ✓ |
| `/admin/services` | Yes | Partial | Partial | — | — | JSON editor | No | Yes | — |
| `/admin/fleet` | Yes | Partial | Partial | Depth demo | Config trailers | No | No | Yes | Truck CRUD ✓ |
| `/admin/dump-sites` | Yes | Yes | Yes | Demo facilities | — | Schema status | No | Yes | Strong |
| `/admin/dump-sites/new` | Yes | Yes | Yes | — | — | No | No | Yes | — |
| `/admin/dump-sites/[id]` | Yes | Yes | Yes | — | Truncated job IDs | No | No | Yes | — |
| `/admin/disposal-review` | Yes | Yes | Yes | — | Job ID truncate | No | No | Yes | — |
| `/admin/settings` | Yes | Partial | Partial | — | — | QA warnings, JSON | No | Yes | Dev warnings |
| `/admin/settings/data-inspector` | Yes | No | No | Unfiltered fetch | — | **Full dev tool** | No | Yes | **Remove for prod** |
| `/admin/terms` | Yes | Partial | Partial | — | — | JSON editor | No | Yes | Saves DB |
| `/admin/branding` | Yes | Partial | Partial | Path placeholders | — | JSON editor | No | Yes | Saves DB |

### 4.8 Admin — HR platform

| Route | Works | Complete | Ready | Mock | Hardcoded | Dev | Disabled | Mobile | Notes |
|-------|-------|----------|-------|------|-----------|-----|----------|--------|-------|
| `/admin/hr` | Yes | Partial | Partial | — | — | Test employee btn | No | Yes | Dashboard |
| `/admin/hr/applicants` | Yes | Yes | Yes | No | — | No | No | Yes | Pipeline |
| `/admin/hr/applicants/new` | Yes | Yes | Yes | No | — | No | No | Yes | — |
| `/admin/hr/applicants/[id]` | Yes | Yes | Yes | No | — | No | No | Yes | Hire flow |
| `/admin/hr/employees` | Yes | Yes | Yes | No | — | No | No | Yes | Directory |
| `/admin/hr/employees/new` | Yes | Yes | Yes | No | — | No | No | Yes | — |
| `/admin/hr/employees/[id]` | Yes | Yes | Yes | No | UUID in URL | No | No | Yes | Full detail |
| `/admin/hr/postings` | Yes | Yes | Yes | Reference seed note | — | No | No | Yes | — |
| `/admin/hr/postings/[id]` | Yes | Yes | Yes | — | — | No | No | Yes | — |
| `/admin/hr/job-postings/new` | Yes | Yes | Yes | No | — | No | No | Yes | — |
| `/admin/hr/onboarding` | Yes | Yes | Yes | No | — | No | No | Yes | Queue |
| `/admin/hr/schedule` | Yes | Yes | Yes | No | — | No | No | Yes | PTO approval |
| `/admin/hr/time` | No | No | No | — | — | No | **Placeholder page** | Yes | **Stub** |
| `/admin/hr/payroll` | Yes | Partial | Partial | — | — | No | No | Yes | Export works |
| `/admin/hr/taxes` | Yes | Partial | Partial | — | Disclaimer | No | No | Yes | 1099 read-only |
| `/admin/hr/compliance` | Yes | Partial | Partial | — | — | No | No | Yes | Doc templates ✓ |
| `/admin/hr/training` | Yes | Yes | Yes | Seed content | — | No | No | Yes | LMS admin |
| `/admin/hr/equipment` | Yes | Partial | Partial | Placeholder truck | Photo placeholder | No | No | Yes | — |
| `/admin/hr/performance` | No | No | No | — | — | No | **Placeholder page** | Yes | **Stub** |

**Page audit summary:** 77 routes verified. **Production-ready today:** ~28 routes. **Partial (usable with gaps):** ~42 routes. **Not ready (stub/blocked):** 7 routes (`/forgot-password`, `/customer/payments`, `/admin/invoices/new` send, `/admin/payments/new` card, `/admin/hr/time`, `/admin/hr/performance`, `/admin/settings/data-inspector`).

---

## 5. API Routes Summary (112 handlers)

| Category | Count | Auth pattern | Production ready |
|----------|-------|--------------|------------------|
| Public (intentional) | 7 | None | Partial — needs rate limits |
| Auth | 3 | Mixed | Yes |
| Customer/booking | 12 | Profile + resource scope | Partial — mock payments |
| Employee `/api/me/*` | 16 | `requireEmployeeMeContext` | Yes |
| Admin operations | ~25 | admin/planner role | Partial |
| HR `/api/hr/*` | ~40 | `requireApiPermission` | Mostly yes |
| Health/data | 2 | **None** | **No** — SEC-001, SEC-002 |

**Critical API issues:** SEC-001 (`/api/data/store`), SEC-002 (`/api/health/supabase`), SEC-004 (timeclock punch), SEC-005 (mock payments), SEC-006 (invoice PDF auth), SEC-007 (no rate limits), SEC-008 (create-test employee).

---

## 6. Final Roadmap

### Critical issues before launch

1. **SEC-001** — Require auth on `/api/data/store`; never return unfiltered company data
2. **SEC-002** — Restrict or remove public health endpoint detail
3. **SEC-005 / DATA-008 / INT-006** — Real payment processor or disable all card UI
4. **INT-004 / WF-003** — Email integration for invoices, quotes, booking confirmations
5. **UX-010** — Password reset flow
6. **SEC-004** — Fix timeclock punch authorization
7. **DATA-002** — Verify `DEMO_DATA` unset; run seed cleanup SQL
8. **UX-002** — Remove/gate Data Inspector, test employee creator, QA banners from production
9. **SEC-007** — Rate limiting on public endpoints

### High priority improvements

1. Auto-invoice on job completion (or documented manual policy) — WF-002
2. HR Time & Attendance admin UI — UX-008, WF-015
3. Pagination on admin list APIs — PERF-001, PERF-010
4. Customer portal: enable payments, fix dead links, real schedule times — UX-003–007
5. Financing DB-first refactor — DATA-007
6. Remove mock fallbacks when API fails (command center, planner) — DATA-012, DATA-013
7. Wire permissions or remove dead permission tables — DB-008
8. `CompanyProvider` hydration from DB — UX-018
9. Batch disposal review query — PERF-004
10. Fix route planner mock fallback — DATA-026

### Nice-to-have improvements

1. Global search — UX-020
2. Dedicated reports / P&L module
3. Google review capture workflow — WF-005
4. SMS crew notifications — INT-005
5. Route optimization / GPS — UX-009
6. Performance HR module UI — `/admin/hr/performance`
7. Referral program — WF-014
8. Replace JSON editors with forms — UX-001

### Technical debt

1. Dual-store pattern (`mock-data` + Supabase) — remove mock layer from production paths
2. 11 `AdvancedJsonEditor` panels in admin settings
3. Duplicate migration `036_*` prefix — DB-001
4. ~25 unused schema tables — DB-007
5. `morris-config` fallbacks throughout codebase
6. Orphan `mock-analytics.ts`, `AdminEmployeesPanel`, `application_documents` table
7. Service-role-only storage RLS pattern
8. RLS vs app allowlist mismatch — SEC-010

### Long-term scalability improvements

1. Cron jobs: invoice reminders, schedule slot generation, training re-certification, overdue reviews — INT-010
2. API middleware auth for all `/api/*` routes — SEC-014
3. SQL aggregates for command center KPIs — PERF-011
4. External payroll API integration — INT-009
5. Accounting software integration — INT-011
6. Google Maps Distance Matrix — INT-008
7. Multi-admin RBAC (move beyond single owner email allowlist)
8. Structured logging + error tracking (Sentry/Datadog)
9. Caching layer for effective pricing/settings — PERF-012
10. Multi-company tenant isolation review

---

## 7. Information Needed From the Owner

Before implementation begins, the following business decisions must be confirmed to eliminate assumptions.

### Payments & billing

1. Which payment processor(s) will be used? (Stripe recommended; Square/PayPal stubs exist)
2. Card-not-present (online) vs card-present (field) — both needed?
3. Accept in-house financing? If yes: terms, credit criteria, late fees, default handling?
4. Auto-generate invoice on job completion, or manual invoicing only?
5. Invoice delivery: email, SMS, customer portal only, or print/mail?
6. Missouri sales tax: applicable on junk removal? Local jurisdiction rates?
7. Deposit or down payment required at booking?
8. Accepted payment methods in field: cash, check, card, ACH, financing — which are live day one?
9. Refund policy and who can issue refunds in the system?
10. Tip handling for crew?

### Booking & pricing

11. Guest checkout allowed, or account required before submit? (Currently: login required)
12. Estimates binding once approved, or "starting at" with on-site adjustment?
13. Minimum job fee amount?
14. Travel/distance fees — flat, per mile, or zone-based? (Currently config-only, not in admin UI)
15. After-hours or weekend surcharges?
16. Service area boundaries — cities, counties, radius from yard?
17. Out-of-area policy: decline, surcharge, or case-by-case?
18. Photo required at booking, optional, or not offered until field?
19. Hauling vs junk removal — same pricing rules or separate?
20. Volume-based vs item-based vs hybrid estimating — confirm engine rules match business

### Operations & dispatch

21. Default crew size by job type?
22. Who assigns crew — dispatcher, planner, or self-assign?
23. Route optimization priority: shortest distance, earliest window, truck capacity?
24. Disposal: always require weight ticket/receipt photo?
25. Can jobs be marked complete without disposal recorded? Under what skip policy?
26. Who approves disposal cost overruns vs estimate?
27. Maximum jobs per truck per day?
28. Same-day booking allowed?
29. Cancellation policy and fees?
30. Customer notification when crew is en route — SMS, email, or none?

### Disposal

31. Confirm the 8 reference dump sites in migration 033 are current and complete
32. Preferred disposal facility selection: cost, distance, material type, or manual?
33. Disposal receipt retention period?
34. Who reviews flagged disposal items in admin review queue?

### HR & payroll

35. W2 vs 1099 employee mix?
36. Overtime rules (daily vs weekly threshold)?
37. PTO accrual policy — use seeded W2 policy or replace?
38. Pay period: weekly, biweekly, semi-monthly?
39. External payroll system (ADP, Gusto, QuickBooks Payroll) — which export format?
40. Which HR modules are launch-required: Time admin UI, Performance, full compliance?
41. Owner/admin model: single owner email only, or multiple admins/planners/HR staff with RBAC?
42. List of staff emails for `STAFF_OWNER_EMAILS` and role assignments
43. Background check / drug test required before field work?
44. CDL or DOT requirements for drivers?
45. Uniform and PPE policy?

### Legal & compliance

46. Final terms of service copy for customer booking and portal
47. Estimate disclaimer language (binding vs non-binding)
48. Liability waiver for property damage during removal
49. Onboarding document templates: I-9, W-4, handbook — legal review complete?
50. Workers comp and general liability insurance minimums
51. Data retention policy for job photos, disposal receipts, HR documents
52. Applicant data retention after rejection

### Communications

53. Email provider preference (Resend, SendGrid, Amazon SES, other)?
54. Sender domain and SPF/DKIM setup status?
55. SMS provider for crew/customer (Twilio, other)?
56. Business hours for automated messages
57. Post-job Google/Yelp review solicitation — yes/no, timing, incentive?
58. Which events trigger notifications: booking, estimate ready, scheduled, en route, complete, invoice, payment?

### Branding & public site

59. Final logo file path or URL
60. Hero banner and brand colors (confirm admin branding values)
61. Public phone number and email for customer contact
62. Services list for public `/services` page — which to publish?
63. Careers: publish reference template postings or custom only?
64. Marketing homepage stats — real numbers or remove?

### Data & security

65. Confirm production Supabase project URL and that migrations 001–037 are applied
66. Confirm `STAFF_OWNER_EMAILS` for production deploy
67. Confirm `DEMO_DATA` will not be set in production
68. Run seed cleanup SQL before go-live — who approves?
69. Who gets admin, planner, HR, and employee access at launch?
70. Customer portal: allow admin impersonation/support view in production?

### Accounting & reporting

71. Chart of accounts or GL structure if integrating later
72. Required reports at launch: daily revenue, disposal margin, payroll, 1099?
73. Fiscal year and reporting periods
74. Who reconciles payments to bank deposits?

### Launch checklist confirmation

75. Target go-live date
76. Soft launch with real jobs but limited payment methods, or full launch?
77. Training plan for admin staff, dispatchers, and field crew on Morris OS
78. Rollback plan if critical issue found in first week
79. Support contact for employees/customers during transition
80. Data migration from any existing system (spreadsheets, Jobber, etc.)?

---

## 8. Issue Count Summary

| Category | Issue IDs | Count |
|----------|-----------|-------|
| Security | SEC-001 – SEC-015 | 15 |
| Data / mock | DATA-001 – DATA-030 | 30 |
| Database | DB-001 – DB-020 | 20 |
| Workflow | WF-001 – WF-015 | 15 |
| Performance | PERF-001 – PERF-012 | 12 |
| Integrations | INT-001 – INT-012 | 12 |
| UI/UX | UX-001 – UX-020 | 20 |
| **Total registered issues** | | **124** |

Plus **77 page-level findings** in Section 4 and **112 API routes** summarized in Section 5.

---

*This audit reflects the Morris OS codebase as of 2026-06-29. No code changes were made. Await owner decisions in Section 7 before implementing fixes.*

