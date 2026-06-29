# Morris OS — Production Readiness Audit

> **Deprecated:** This document has been superseded by **[PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md)** (2026-06-29). Use the new audit for current findings, production scores, and owner decision checklist.

**Date:** 2026-06-29  
**Scope:** Full app — routes, APIs, data layer, workflows, security  
**Status:** Audit only — **no fixes applied**

---

## Executive summary

Morris OS is a **hybrid application**: a substantial Supabase schema and API layer exist, but many UI paths still depend on **`lib/mock-data`**, static **`lib/morris-config`**, or **development-only demo fallbacks**.

### Production gates (must be correct)

| Gate | Variable / file | Effect if wrong |
|------|-----------------|-----------------|
| Supabase reads/writes | `NEXT_PUBLIC_USE_SUPABASE=true` | All `isDbReady()` checks fail → empty data or mock fallbacks |
| Service role writes | `SUPABASE_SERVICE_ROLE_KEY` | RLS-blocked writes; falls back to anon client |
| Demo data | `NODE_ENV=development` or `DEMO_DATA=true` | Mock customers, jobs, planner/command-center fallbacks |
| Staff privileges | `STAFF_OWNER_EMAILS` | Non-owner accounts downgraded from admin/HR |

### Overall readiness by area

| Area | Real Supabase | Mock / static | Production ready |
|------|---------------|---------------|------------------|
| Auth & profiles | Yes | Dev impersonation | **Partial** — no password reset |
| Public site | Static config | `morris-config` | **Partial** — not DB-driven |
| Booking | Writes jobs when DB ready | Pricing from `morris-config`; login required | **Partial** |
| Customer portal | `/api/me/customer` | Demo customer in dev | **Partial** — pay PDF disabled |
| Admin operations | Most list APIs | Command center demo fallback | **Partial** |
| Planner/dispatch | `/api/admin/planner` | Route planner uses mock `getJob`; crew from config | **Partial** |
| Payments | DB `payments` table | Mock payment provider | **No** — card is placeholder |
| Invoices | DB + admin APIs | Email/PDF not implemented | **Partial** |
| Financing | DB + approve/deny APIs | Signature/risk placeholders | **Partial** |
| HR / ATS | Strong API + DB | 3 admin pages are placeholders | **Partial** |
| Training / LMS | Full API loop | Seed curriculum in migration 024 | **Mostly yes** |
| Equipment | `equipment_assets` API | Photo placeholder; one seed truck | **Partial** |
| Payroll / time | APIs + tables | Admin time UI missing | **Partial** |
| Storage / uploads | Buckets documented | Almost no real uploads | **No** |

### Critical architectural risks

1. **Dual-store pattern**: `lib/db/operations.ts` creates/updates via `mockCreateJob` / `mockUpdateJob` then upserts to Supabase. Server-side updates **fail** if the job is not in the in-memory mock store (client `DataHydrator` syncs on load only).
2. **Pricing disconnect**: Admin saves to `company_settings`; booking and public pages read **`morrisConfig`** only (`getEffectivePricingRules` exists but is not used in booking UI).
3. **Hardcoded workforce**: `morrisConfig.employees`, `trucks`, `trailers`, `dumpSites` still power planner crew panel, admin employee clock panel, and employee dashboard fleet names.
4. **Guest booking blocked**: `/book` requires registration before submit (`BookingWizard` redirects to `/register`).

---

## Architecture & data flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   UI pages  │────▶│  /api/* routes   │────▶│ lib/db/*        │
└─────────────┘     └──────────────────┘     │  isDbReady()?   │
       │                      │               └────────┬────────┘
       │                      │                        │
       ▼                      ▼                        ▼
 morris-config          requireApiProfile         Supabase tables
 (static, client)       permissions-hr           OR mock-data (RAM)
       │
 DataHydrator ──▶ applySupabaseStore ──▶ mock-data (client sync)
```

**`isDemoDataEnabled()`** (`lib/is-demo-data.ts`): `true` when `DEMO_DATA=true` **or** `NODE_ENV=development`. Used for customer portal demo ID, command-center fallback, planner fallback, operations-depth empty fallback.

---

## Route / page audit (72 routes)

**Column key:**  
- **Real SB:** uses Supabase when `NEXT_PUBLIC_USE_SUPABASE=true` and tables exist  
- **Mock:** depends on `lib/mock-data` or static config  
- **Auth:** middleware on `/customer|/employee|/planner|/admin|/account`  
- **Roles:** `roleAllowedForPath` + API checks  

### Public website

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/` | Marketing home | `morris-config` via `useCompany` | no | yes (static) | n/a | links work | no | n/a | partial | Stats/marketing copy hardcoded | P2 |
| `/services` | Service list | `morris-config.services` | no | yes | n/a | n/a | no | n/a | partial | Not admin-editable | P1 |
| `/pricing` | Public pricing | `morris-config.pricingRules` | no | yes | n/a | n/a | no | n/a | partial | Ignores `company_settings` | P0 |
| `/platform` | Platform entry | redirect | n/a | n/a | n/a | n/a | no | n/a | no | Redirects to `/admin` | P3 |

### Booking

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/book` | Book junk or hauling | Estimate: `morris-config`; submit: `/api/jobs/create` | partial | partial | partial | partial | no* | n/a | partial | *Login required at submit; schedule slots API is real; photos are blob placeholders | P0 |

### Careers (public ATS)

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/careers` | Careers landing | `/api/careers/postings` | yes | no | n/a | yes | no | n/a | yes | | P2 |
| `/careers/jobs` | Job list | `/api/careers/postings` | yes | no | search filter | yes | no | n/a | yes | | P2 |
| `/careers/jobs/[slug]` | Job detail | `/api/careers/postings/[slug]` | yes | no | n/a | apply link | no | n/a | yes | | P2 |
| `/careers/apply/[postingId]` | Application | `ApplicationForm` → `/api/careers/applications` | yes | no | yes | yes | no | n/a | partial | Uses `alert()` on error | P1 |

### Auth & account

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/login` | Sign in | Supabase Auth + `/api/auth/me` | yes | no | yes | yes | no | n/a | yes | | P2 |
| `/register` | Customer signup | `/api/auth/register` | yes | no | yes | yes | no | n/a | partial | Creates customer profile | P1 |
| `/forgot-password` | Password reset | none | no | n/a | no | n/a | no | n/a | no | “Coming soon” copy only | P0 |
| `/company-login` | Legacy | redirect `/login` | n/a | n/a | n/a | n/a | no | n/a | n/a | Alias | — |
| `/account` | Account summary | `/api/auth/me` via `AuthProvider` | yes | no | n/a | sign out | yes | all | yes | | P2 |
| `/unauthorized` | Access denied | static | n/a | n/a | n/a | n/a | no | n/a | yes | | — |

### Customer portal

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/customer` | Dashboard | `/api/me/customer` | yes | dev demo | n/a | partial | yes | customer, admin | partial | Demo customer in dev | P1 |
| `/customer/jobs` | Job list | `/api/me/customer` | yes | dev demo | n/a | yes | yes | customer | partial | | P1 |
| `/customer/jobs/[id]` | Job detail | `/api/me/customer/jobs/[id]` | yes | dev demo | n/a | yes | yes | customer | partial | | P1 |
| `/customer/payments` | Payments hub | `/api/me/customer` | yes | dev demo | partial | partial | yes | customer | partial | Pay balance **disabled** | P0 |
| `/customer/payments/[id]` | Payment detail | portal hook + local | partial | partial | n/a | partial | yes | customer | partial | PDF disabled | P1 |
| `/customer/financing` | Financing request | `/api/me/customer` + wizard | yes | no | yes | yes | yes | customer | partial | Typed signature placeholder | P1 |

### Employee portal

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/employee` | Dashboard | `/api/me/dashboard` | yes | partial | n/a | yes | yes | employee | partial | Truck names from `morris-config` | P1 |
| `/employee/jobs/[id]` | Field job | `/api/me/jobs/[id]` | yes | partial | partial | partial | yes | employee | partial | Photo upload disabled | P1 |
| `/employee/clock` | Time clock | `/api/me/dashboard` + punch API | yes | no | n/a | yes | yes | employee | yes | | P1 |
| `/employee/schedule` | Schedule | `/api/me/hr`, dashboard, time-off | yes | no | n/a | yes | yes | employee | partial | | P1 |
| `/employee/profile` | Profile edit | `/api/me/profile` | yes | no | yes | yes | yes | employee | partial | Photo upload coming soon | P1 |
| `/employee/documents` | Docs & policies | `/api/me/hr`, sign API | yes | no | sign form | partial | yes | employee | partial | PDF viewer disabled; handbook placeholder | P1 |
| `/employee/onboarding` | Onboarding | `/api/me/onboarding` | yes | no | yes | yes | yes | employee | yes | | P2 |
| `/employee/time-off` | PTO request | `/api/hr/time-off` | yes | no | yes | yes | yes | employee | yes | | P2 |
| `/employee/equipment` | Equipment | `/api/me/equipment` | yes | no | yes | yes | yes | employee | yes | Checkout/return/report work | P2 |
| `/employee/training` | Training list | `/api/me/training` | yes | no | n/a | yes | yes | employee | yes | | P2 |
| `/employee/training/[courseId]` | Course player | `/api/me/training/*` | yes | no | quiz/ack | yes | yes | employee | yes | Full LMS loop | P2 |

### Planner / dispatch

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/planner` | Dispatch board | `/api/admin/planner` + demo fallback | partial | yes | partial | partial | yes | planner, admin | partial | `route-planner` uses mock `getJob`; crew panel uses config employees | P0 |

### Admin operations

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/admin` | Command center | `/api/admin/operations` + mock fallback | partial | yes | n/a | yes | yes | admin, hr† | partial | †HR limited to `/admin/hr/*`; demo fallback in dev | P0 |
| `/admin/jobs` | Job list | `/api/admin/jobs` | yes | dev | n/a | yes | yes | admin, planner | partial | | P1 |
| `/admin/estimates` | Estimates list | `/api/admin/jobs` | yes | dev | n/a | yes | yes | admin, planner | partial | | P1 |
| `/admin/estimates/new` | Manual intake | `AdminJobIntake` → `/api/admin/jobs` | yes | partial | yes | yes | yes | admin, planner | partial | Photos placeholder | P1 |
| `/admin/review` | Estimate review | `/api/admin/jobs` + review API | partial | yes | yes | yes | yes | admin, planner | partial | Depends on mock update path | P0 |
| `/admin/schedule` | Slot manager | `/api/schedule/slots`, `/api/admin/jobs` | yes | seed | yes | yes | yes | admin | partial | Auto-seeds empty slots | P1 |
| `/admin/customers` | CRM | `/api/admin/customers`, interactions | yes | dev | yes | yes | yes | admin, planner | yes | | P2 |
| `/admin/invoices` | Invoice list | `/api/admin/invoices` | yes | dev | n/a | yes | yes | admin | partial | | P1 |
| `/admin/invoices/new` | Create invoice | `AdminInvoiceCreateForm` | yes | partial | yes | yes | yes | admin | partial | “Send placeholder” | P0 |
| `/admin/invoices/[id]` | Invoice detail | `/api/admin/invoices/[id]` | yes | partial | yes | yes | yes | admin | partial | Mark paid works | P1 |
| `/admin/payments` | Payments list | `/api/admin/payments` | yes | dev | n/a | yes | yes | admin | partial | | P1 |
| `/admin/payments/new` | Record payment | `AdminPaymentCreateForm` | yes | partial | yes | yes | yes | admin | partial | Card/ACH placeholder labels | P0 |
| `/admin/financing` | Financing center | `/api/admin/financing` + mutations | yes | partial | yes | yes | yes | admin | partial | Risk score placeholder | P1 |
| `/admin/pricing` | Pricing editor | `/api/admin/company-settings` | yes | fallback | yes | yes | yes | admin | partial | Saves DB; booking doesn’t read it | P0 |
| `/admin/settings` | Company settings | `/api/admin/company-settings` | yes | fallback | yes | yes | yes | admin | partial | JSON editors for capacity, pay, docs | P1 |
| `/admin/services` | Services | `morris-config` read-only | no | yes | no | n/a | yes | admin | no | Display only | P1 |
| `/admin/branding` | Branding | `morris-config` read-only | no | yes | no | n/a | yes | admin | no | Display only | P1 |
| `/admin/terms` | Terms | `morris-config` read-only | no | yes | no | n/a | yes | admin | no | Display only | P1 |
| `/admin/dump-sites` | Dump sites | `AdminDumpSitesPanel` → APIs | yes | dev | yes | yes | yes | admin | yes | | P2 |
| `/admin/fleet` | Fleet | `AdminFleetPanel` + config trailers | partial | yes | yes | yes | yes | admin | partial | Trailers from config | P1 |
| `/admin/employees` | Legacy | redirect `/admin/hr/employees` | n/a | n/a | n/a | n/a | yes | admin | n/a | | — |

### Admin HR

| Route | Purpose | Data source | Real SB? | Mock? | Forms | Buttons | Auth | Roles | Ready? | Notes | Priority |
|-------|---------|-------------|----------|-------|-------|---------|------|-------|--------|-------|----------|
| `/admin/hr` | HR dashboard | `/api/hr/dashboard` | yes | no | n/a | yes | yes | hr, admin† | partial | Test employee button | P1 |
| `/admin/hr/applicants` | Pipeline | `/api/hr/applicants` | yes | no | n/a | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/applicants/new` | Add applicant | `AdminHrCreateForms` | yes | no | yes | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/applicants/[id]` | Applicant detail | `/api/hr/applicants/[id]`, hire | yes | no | yes | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/employees` | Directory | `EmployeeDirectory` → API | yes | no | n/a | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/employees/new` | New employee | `AdminHrCreateForms` | yes | no | yes | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/employees/[id]` | Employee detail | `/api/hr/employees/[id]` | yes | no | n/a | activate | yes | hr perms | yes | | P2 |
| `/admin/hr/postings` | Job postings | `/api/hr/job-postings` | yes | no | n/a | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/job-postings/new` | New posting | `AdminHrCreateForms` | yes | no | yes | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/onboarding` | Onboarding queue | `/api/hr/employees`, onboarding | yes | no | n/a | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/schedule` | PTO approvals | `/api/hr/time-off` | yes | no | yes | yes | yes | hr perms | yes | | P2 |
| `/admin/hr/time` | Time & attendance | `HrPlaceholderPage` | no | n/a | no | no | yes | hr perms | no | Placeholder UI | P1 |
| `/admin/hr/payroll` | Payroll | `/api/hr/payroll` | yes | no | n/a | yes | yes | hr perms | partial | Aggregate/export work | P1 |
| `/admin/hr/taxes` | Tax summary | `/api/hr/taxes` | yes | no | n/a | n/a | yes | hr perms | partial | Read-focused | P2 |
| `/admin/hr/compliance` | Compliance | `HrPlaceholderPage` | no | n/a | no | no | yes | hr perms | no | Placeholder UI | P1 |
| `/admin/hr/performance` | Performance | `HrPlaceholderPage` | no | n/a | no | no | yes | hr perms | no | Placeholder UI | P1 |
| `/admin/hr/equipment` | Equipment admin | `EquipmentManager` → HR API | yes | partial | yes | yes | yes | hr perms | partial | Photo placeholder button | P1 |
| `/admin/hr/training` | Training admin | `TrainingManager` → HR API | yes | no | yes | yes | yes | hr perms | yes | | P2 |

---

## Mock / placeholder search (by severity)

### Critical — breaks or misleads production

| Finding | Location | Impact |
|---------|----------|--------|
| `mockUpdateJob` before Supabase upsert | `lib/db/operations.ts` `updateJob`, `reviewJobEstimate` | Server mutations no-op if job not in mock RAM |
| Booking uses `morrisConfig` not DB pricing | `BookingWizard.tsx`, `HaulingTransportWizard.tsx` | Admin pricing changes don’t affect estimates |
| `MockPaymentProvider` / card placeholders | `lib/payment-provider.ts`, `PaymentPortal.tsx` | No real card processing |
| `isDemoDataEnabled()` true in development | `lib/is-demo-data.ts` | Local “production-like” tests show fake data |
| `DEMO_CUSTOMER_ID` / `resolveDemoCustomerId` | `lib/demo-customer.ts`, `useCustomerPortal.ts` | Wrong customer data in dev |
| `/api/hr/employees/create-test` | Hardcoded email/password | Security risk if exposed in prod |
| Guest booking requires login | `BookingWizard.tsx` L193–194 | Marketing promises “book online” but forces register |

### High — feature incomplete

| Finding | Location |
|---------|----------|
| `getJobs`/`getScheduleSlots` mock fallback | `app/planner/page.tsx` |
| Command center mock fallback | `OperationsCommandCenter.tsx` `loadCommandCenter` |
| `route-planner.ts` → `getJob` from mock-data | `lib/route-planner.ts` |
| `morrisConfig.employees` in admin clock panel | `AdminDepthPanels.tsx` |
| `DataHydrator` syncs Supabase → mock store | `components/data/DataHydrator.tsx` |
| Invoice “Send placeholder” | `AdminInvoiceCreateForm.tsx`, `admin/invoices` API |
| Financing risk placeholder | `FinancingApprovalCenter.tsx` |
| Password reset coming soon | `app/forgot-password/page.tsx` |
| HR placeholder pages | `admin/hr/time`, `performance`, `compliance` |
| `applySupabaseStore` in mutations | `lib/api/mutations.ts` |

### Medium — UX / polish placeholders

| Finding | Location |
|---------|----------|
| Photo upload coming soon | employee job, profile, booking |
| PDF coming soon | invoices, payments, employee documents |
| SMS coming soon | `CurrentAssignmentCard.tsx` |
| Equipment photo placeholder | `EquipmentManager.tsx` |
| `placeholder-photo.jpg` | `BookingWizard.tsx`, `mock-data.ts` |
| `alert()` on application fail | `ApplicationForm.tsx` |
| Command center “Coming soon” section | weather, fuel, GPS, notifications |
| `localStorage` dev role | `AuthProvider.tsx` (gated by DevToolbar) |
| Haversine distance placeholder | `lib/distance/distance-provider.ts` |
| `COMMON_JUNK_ITEMS` “Placeholder pricing” | `lib/common-junk-items.ts` |

### Low — intentional defaults / seeds

| Finding | Location |
|---------|----------|
| `generateSeedScheduleSlots` | `lib/schedule/seed-schedule-slots.ts` |
| `MORRIS_TRAINING_COURSES` seed | `lib/db/hr/training-seed-data.ts`, migration 024 |
| Flagship Truck placeholder | migration `030_data_legitimacy.sql` |
| `scripts/db-seed.mjs` | Dev seed script |
| Dicebear avatar URLs | `morris-config`, ops metrics |

---

## API route audit (88 routes)

**Auth patterns:** `requireApiProfile` | `requireApiRole` | `requireApiPermission` | `getCurrentProfile` | public

| Route | Method | Purpose | Auth | Role | Read SB | Write SB | Service role | Activity log | Used by UI | Ready | Notes |
|-------|--------|---------|------|------|---------|----------|--------------|--------------|------------|-------|-------|
| `/api/auth/me` | GET | Current profile | optional | — | profiles | no | maybe | no | yes | yes | |
| `/api/auth/register` | POST | Register customer | public | — | yes | yes | yes | no | yes | yes | |
| `/api/auth/logout` | POST | Logout | public | — | no | no | no | no | yes | yes | |
| `/api/health/supabase` | GET | DB health | public | — | probe | no | no | no | admin card | partial | Exposes URL |
| `/api/data/store` | GET | Hydrate mock store | optional | — | yes | no | no | no | DataHydrator | partial | Dual-store |
| `/api/jobs/create` | POST | Create booking | required | customer/admin | yes | yes | yes | yes | booking | partial | Auth required |
| `/api/jobs/[id]/status` | PATCH | Job status | required | scoped | yes | yes | yes | yes | employee/admin | partial | Mock update deps |
| `/api/jobs/[id]/estimate-review` | PATCH | Review estimate | required | admin | yes | yes | yes | yes | review | partial | Mock update deps |
| `/api/schedule/slots` | GET | List slots | **public** | — | yes | no | no | no | booking, admin | yes | companyId required |
| `/api/schedule/slots/[id]` | PATCH | Update slot | admin | admin | yes | yes | yes | yes | admin schedule | yes | |
| `/api/schedule/slots/create` | POST | Create slot | admin | admin | yes | yes | yes | yes | admin schedule | yes | |
| `/api/payments/create` | POST | Record payment | required | scoped | yes | yes | yes | yes | portals | partial | Mock provider for card |
| `/api/invoices/[id]` | PATCH | Update invoice | required | scoped | yes | yes | yes | yes | admin | partial | |
| `/api/financing/request` | POST | Request financing | customer | customer | yes | yes | yes | yes | customer | partial | |
| `/api/financing/[id]/approve` | PATCH | Approve | admin | admin | yes | yes | yes | yes | admin | partial | |
| `/api/financing/[id]/deny` | PATCH | Deny | admin | admin | yes | yes | yes | yes | admin | partial | |
| `/api/dump-sites` | POST | Create dump site | required | any auth† | yes | yes | yes | yes | admin | partial | †Weak role check |
| `/api/dump-sites/[id]` | PATCH | Update dump site | required | any auth† | yes | yes | yes | yes | admin | partial | |
| `/api/trucks/[id]` | PATCH | Update truck | required | any auth† | yes | yes | yes | yes | admin fleet | partial | |
| `/api/trucks/[id]/maintenance` | POST | Maintenance log | required | any auth† | yes | yes | yes | yes | admin fleet | partial | |
| `/api/customers/[id]/interaction` | POST | CRM note | required | admin/planner | yes | yes | yes | yes | admin CRM | yes | |
| `/api/customers/[id]/callback` | PATCH | Callback flag | required | admin/planner | yes | yes | yes | yes | admin CRM | yes | |
| `/api/timeclock/clock-in` | POST | Clock in | required | employee/admin | yes | yes | yes | yes | admin/employee | yes | |
| `/api/timeclock/clock-out` | POST | Clock out | required | employee/admin | yes | yes | yes | yes | admin/employee | yes | |
| `/api/timeclock/punch` | POST | Punch | required | employee | yes | yes | yes | yes | employee | yes | |
| `/api/admin/company-settings` | GET,PATCH | Settings | admin | admin | yes | yes | yes | no | pricing/settings | partial | Not consumed by booking |
| `/api/admin/operations` | GET | Command center | admin/planner | admin/planner | yes | no | no | yes | admin home | partial | Demo fallback client-side |
| `/api/admin/operations-depth` | GET | Depth snapshot | required | admin | yes | no | no | no | depth panels | partial | Demo fallback |
| `/api/admin/jobs` | GET,POST | Jobs | admin/planner | admin/planner | yes | yes | yes | yes | admin | partial | |
| `/api/admin/customers` | GET,POST | Customers | admin/planner | admin/planner | yes | yes | yes | yes | admin | yes | |
| `/api/admin/invoices` | GET,POST | Invoices | required | admin† | yes | yes | yes | yes | admin | partial | |
| `/api/admin/invoices/[id]` | GET,PATCH,POST | Invoice detail | required | admin | yes | yes | yes | yes | admin | partial | |
| `/api/admin/payments` | GET,POST | Payments | required | admin | yes | yes | yes | yes | admin | partial | |
| `/api/admin/financing` | GET | Financing list | required | admin | yes | no | no | no | admin | yes | |
| `/api/admin/dump-sites` | GET | Dump sites list | required | admin | yes | no | no | no | admin | yes | |
| `/api/admin/planner` | GET | Planner bundle | planner/admin | planner/admin | yes | no | no | no | planner | partial | |
| `/api/me/dashboard` | GET | Employee dashboard | employee | employee | yes | no | no | no | employee | partial | Config fleet names |
| `/api/me/profile` | GET,PATCH | Profile | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/onboarding` | GET,PATCH | Onboarding | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/hr` | GET | HR self | employee | employee | yes | no | no | no | employee docs | yes | |
| `/api/me/jobs/[id]` | GET | Employee job | employee | scoped | yes | no | no | no | employee | yes | |
| `/api/me/customer` | GET | Customer portal | customer | customer | yes | no | no | no | customer | yes | |
| `/api/me/customer/jobs/[id]` | GET | Customer job | customer | scoped | yes | no | no | no | customer | yes | |
| `/api/me/equipment` | GET | Equipment | employee | employee | yes | no | no | no | employee | yes | |
| `/api/me/equipment/checkout` | POST | Checkout | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/equipment/return` | POST | Return | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/equipment/report` | POST | Damage report | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/training` | GET | Training list | employee | employee | yes | no | no | no | employee | yes | |
| `/api/me/training/[courseId]` | GET | Course detail | employee | employee | yes | no | no | no | employee | yes | |
| `/api/me/training/.../complete` | POST | Lesson complete | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/training/.../quiz` | POST | Quiz | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/training/.../acknowledge` | POST | Acknowledge | employee | employee | yes | yes | yes | no | employee | yes | |
| `/api/me/training/.../certificate` | GET | Certificate | employee | employee | yes | no | no | no | employee | partial | |
| `/api/hr/dashboard` | GET | HR stats | hr perms | hr | yes | no | no | no | hr home | yes | |
| `/api/hr/nav-stats` | GET | Nav badges | hr perms | hr | yes | no | no | no | layout | yes | |
| `/api/hr/dispatch-ready` | GET | Dispatch roster | auth | dispatch | yes | no | no | no | planner? | yes | Underused |
| `/api/hr/applicants` | GET,POST | Applicants | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/applicants/[id]` | GET,PATCH | Applicant | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/applicants/[id]/hire` | POST | Hire | hr perms | hire | yes | yes | yes | no | hr | yes | |
| `/api/hr/employees` | GET,POST | Employees | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/employees/[id]` | GET,PATCH | Employee | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/employees/[id]/activate` | POST | Activate | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/employees/[id]/terminate` | POST | Terminate | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/employees/[id]/onboarding` | GET,PATCH | Onboarding | hr/self | hr | yes | yes | yes | no | hr/employee | yes | |
| `/api/hr/employees/[id]/training` | GET | Training | hr perms | hr | yes | no | no | no | hr | yes | |
| `/api/hr/employees/[id]/dispatch-stats` | GET | Stats | hr perms | hr | yes | no | no | no | hr | yes | |
| `/api/hr/employees/create-test` | POST | Test user | hr perms | hr | yes | yes | yes | no | hr dashboard | **no** | Remove for prod |
| `/api/hr/job-postings` | GET,POST | Postings | hr perms | hr | yes | yes | yes | no | hr/careers | yes | |
| `/api/hr/job-postings/[id]` | PATCH | Update posting | hr perms | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/shifts` | GET,POST | Shifts | schedule.manage | hr | yes | yes | yes | no | hr schedule | yes | |
| `/api/hr/time-off` | GET,POST | PTO | self/hr | mixed | yes | yes | yes | no | employee/hr | yes | |
| `/api/hr/payroll` | GET,POST | Payroll | hr perms | hr | yes | yes | yes | no | payroll | partial | |
| `/api/hr/taxes` | GET | Taxes | hr perms | hr | yes | no | no | no | taxes page | partial | |
| `/api/hr/assign-job` | POST | Assign crew | schedule.manage | hr | yes | yes | yes | yes | planner? | partial | Mock update deps |
| `/api/hr/documents/[id]/sign` | POST | Sign doc | employee | self | yes | yes | yes | no | employee | yes | |
| `/api/hr/equipment/assets` | GET,POST | Assets | equipment | hr | yes | yes | yes | no | hr equipment | partial | |
| `/api/hr/equipment/assets/[id]` | GET,PATCH,DELETE | Asset | equipment | hr | yes | yes | yes | no | hr | partial | |
| `/api/hr/fleet/units` | GET | Fleet units | equipment | hr | yes | no | no | no | selectors | yes | |
| `/api/hr/fleet/trucks` | POST | Add truck | auth† | any | yes | yes | yes | no | admin fleet | partial | Weak role |
| `/api/hr/fleet/trailers` | POST | Add trailer | auth† | any | yes | yes | yes | no | admin fleet | partial | |
| `/api/hr/training/courses` | GET,POST | Courses | training.manage | hr | yes | yes | yes | no | hr training | yes | |
| `/api/hr/training/assign` | POST | Assign | training.manage | hr | yes | yes | yes | no | hr | yes | |
| `/api/hr/training/matrix` | GET | Matrix | training.manage | hr | yes | no | no | no | hr | yes | |
| `/api/hr/training/overdue` | GET | Overdue | training.manage | hr | yes | no | no | no | hr | yes | |
| `/api/hr/training/retraining` | POST | Retrain | training.manage | hr | yes | yes | yes | no | hr | yes | |
| `/api/careers/postings` | GET | Public postings | public | — | yes | no | no | no | careers | yes | |
| `/api/careers/postings/[slug]` | GET | Posting detail | public | — | yes | no | no | no | careers | yes | |
| `/api/careers/applications` | POST | Apply | public | — | yes | yes | yes | no | careers | yes | |

---

## Database audit

### Table usage matrix

| Table | UI reads | API writes | Seeded only | Not used yet | RLS | Notes |
|-------|----------|------------|-------------|--------------|-----|-------|
| `companies` | indirect | rare | yes | partial | yes | Single company id |
| `profiles` | auth | register, HR | — | — | yes | |
| `customers` | admin, portal | booking, admin | — | — | yes | |
| `jobs` | all portals | booking, admin | — | — | yes | |
| `invoices` | admin, customer | admin, payments | — | — | yes | |
| `payments` | admin, customer | payments API | — | — | yes | |
| `financing_requests` | admin, customer | financing APIs | — | — | yes | |
| `financing_payments` | financing | approve flow | — | — | yes | |
| `estimates` | via jobs | booking | — | — | yes | |
| `junk_removal_details` | jobs | booking | — | — | yes | |
| `hauling_details` | jobs | booking | — | — | yes | |
| `schedule_slots` | booking, admin | schedule APIs | auto-seed | — | yes | |
| `job_assignments` | partial | assign-job | — | underused | yes | |
| `job_photos` | — | — | — | **not wired** | yes | Upload gap |
| `job_notes` | — | — | — | **not wired** | yes | |
| `employees` | HR, employee | HR | — | — | yes | |
| `trucks`, `trailers` | fleet APIs | fleet APIs | — | partial UI | yes | Config duplicates |
| `dump_sites` | admin, planner | dump APIs | — | — | yes | |
| `routes`, `route_stops` | — | save route fn | — | **planner UI doesn't persist** | yes | |
| `activity_log` | command center | logActivity | — | — | yes | Service role insert |
| `notifications` | — | — | — | **unused** | yes | |
| `company_settings` | admin pricing/settings | PATCH | — | **not read by booking** | yes | |
| `customer_interactions` | CRM panel | CRM API | — | — | yes | |
| `employee_timeclock` | depth panels | timeclock | — | — | yes | |
| `timeclock_punches` | employee dashboard | punch API | — | — | yes | |
| `pay_periods`, `payroll_entries` | payroll | payroll API | — | — | yes | Sensitive |
| `employee_tax_profiles`, `payroll_tax_liabilities` | taxes page | partial | — | partial | yes | Sensitive |
| `job_postings`, `applicants`, `applications` + ATS children | careers, HR | ATS APIs | cleaned 030 | — | yes | |
| `onboarding_*`, `document_*`, `employee_documents` | onboarding | HR/employee | templates | — | yes | |
| `training_*` (LMS) | training portals | training APIs | migration 024 | — | yes | |
| `equipment_assets` + events | equipment | equipment APIs | flagship truck | — | yes | |
| `equipment_catalog` | legacy | — | deleted 030 | deprecated | yes | |
| `performance_*`, `disciplinary_*`, `hr_investigations` | — | — | — | **schema only** | yes | |
| `company_announcements` | employee portal | — | cleaned 030 | partial | yes | |
| `pto_*`, `time_off_requests` | employee, HR | time-off API | — | — | yes | |
| `permission_definitions` | — | seed 013 | seed | overrides partial | yes | |

### Storage buckets (migration 021 — manual create)

Documented buckets for HR docs, job photos, equipment photos — **UI largely does not upload**. Equipment uses `placeholder://` paths.

### Sensitive data exposure risks

- Payroll/tax tables: API gated by `hr.payroll.*` / `hr.tax.read` permissions — OK if RLS + API both enforced
- `employee_direct_deposits`: last4 only in profile API — verify RLS
- Test employee endpoint exposes plaintext password in response

---

## Forms & mutations audit

| Form | Location | Fields | Validates | Saves SB | Toast | Errors | UI refresh | Activity | Ready |
|------|----------|--------|-----------|----------|-------|--------|------------|----------|-------|
| Book junk job | `BookingWizard` | mode, items, access, schedule, payment prefs | partial | yes* | partial | partial | redirect | yes | partial |
| Book hauling | `HaulingTransportWizard` | pickup/delivery, cargo, pricing | partial | yes* | partial | partial | redirect | yes | partial |
| Admin manual job | `AdminJobIntake` | customer, address, service | yes | yes | yes | yes | yes | yes | partial |
| Create customer | `AdminCustomersPanel` | name, contact, address | yes | yes | yes | yes | yes | yes | yes |
| Estimate review | `EstimateReviewCard` | action, notes | yes | partial | yes | yes | yes | yes | partial |
| Create invoice | `AdminInvoiceCreateForm` | lines, job/customer | yes | yes | yes | yes | yes | partial | partial |
| Record payment | `AdminPaymentCreateForm` | job, amount, method | yes | yes | yes | yes | yes | yes | partial |
| Company pricing | `/admin/pricing` | tiers, modifiers, JSON | yes | yes | yes | yes | no reload config | no | partial |
| Company settings | `/admin/settings` | JSON blocks | partial | yes | yes | yes | no | no | partial |
| Schedule slot | `AdminScheduleManager` | date, window, capacity | yes | yes | yes | yes | yes | yes | yes |
| Dump site | `AdminDumpSitesPanel` | site fields | yes | yes | yes | yes | yes | partial | yes |
| Fleet truck/trailer | `AdminFleetPanel` | unit fields | yes | yes | yes | yes | yes | partial | partial |
| Financing request | `FinancingRequestWizard` | terms, signature | yes | yes | partial | partial | yes | yes | partial |
| Financing approve/deny | `FinancingApprovalCenter` | terms, notes | yes | yes | no | partial | yes | yes | partial |
| Customer payment | `PaymentPortal` | amount, card placeholder | partial | yes | partial | partial | yes | yes | no |
| Field payment | `FieldPaymentCollection` | amount, method | yes | yes | yes | yes | yes | yes | partial |
| Register | `/register` | name, email, phone, password | yes | yes | partial | yes | redirect | no | yes |
| Login | `LoginForm` | email, password | yes | auth | n/a | yes | redirect | no | yes |
| PTO request | `/employee/time-off` | dates, reason | yes | yes | partial | partial | yes | no | yes |
| Profile update | `/employee/profile` | contact, license, uniform | partial | yes | yes | yes | yes | no | partial |
| Document sign | `/employee/documents` | signature name | yes | yes | partial | partial | yes | no | yes |
| Onboarding item | `/employee/onboarding` | checklist items | yes | yes | partial | partial | yes | no | yes |
| Training quiz/ack | `CoursePlayer` | answers, signature | yes | yes | partial | partial | yes | no | yes |
| Equipment checkout/return | `/employee/equipment` | asset, signature, damage | yes | yes | yes | yes | yes | no | yes |
| HR applicant | `ApplicationForm` | full ATS form | yes | yes | no | alert | redirect | no | partial |
| HR hire | `HireApplicantDialog` | employment type | yes | yes | partial | partial | yes | no | yes |
| HR new employee | `AdminHrCreateForms` | employee fields | yes | yes | yes | yes | redirect | no | yes |
| HR new posting | `AdminHrCreateForms` | posting fields | yes | yes | yes | yes | redirect | no | yes |
| HR equipment asset | `EquipmentManager` | asset fields, assign | yes | yes | yes | yes | yes | no | partial |
| Clock in/out | `EmployeeTimeCard` / admin panel | employee | yes | yes | partial | partial | yes | yes | yes |
| Job status (field) | `/employee/jobs/[id]` | status, notes | partial | partial | partial | partial | yes | yes | partial |

---

## Workflow audit (end-to-end)

| # | Workflow | Status | Gaps | Recommended fix |
|---|----------|--------|------|-----------------|
| 1 | Guest books junk removal | **partial** | Login required; pricing static; photos fake | Guest checkout + DB pricing + storage |
| 2 | Guest books hauling | **partial** | Same as junk | Same |
| 3 | Admin creates phone job | **partial** | Works via `/api/admin/jobs` | Verify Supabase-only updates |
| 4 | Admin reviews estimate | **partial** | `mockUpdateJob` dependency | Refactor `updateJob` to read/write Supabase first |
| 5 | Admin schedules job | **partial** | Slot reserve + status update | E2E test in prod mode |
| 6 | Planner assigns crew/truck | **partial** | UI uses config employees; route not persisted | Wire `PlannerCrewPanel` to HR APIs + `routes` table |
| 7 | Employee sees assigned job | **mostly works** | Dashboard from real jobs | Link `employee_id` on all crew |
| 8 | Employee clocks in | **works** | — | — |
| 9 | Employee completes job | **partial** | Photos disabled; status update fragile | Fix update path + photos |
| 10 | Payment collected | **partial** | Card mock; cash/check OK in DB | Real processor |
| 11 | Invoice balance updates | **partial** | Logic in `createPayment` | Verify without mock |
| 12 | Customer sees payment/receipt | **mostly works** | PDF disabled | PDF generation |
| 13 | Financing submit + approve | **mostly works** | Placeholder risk/signature | Business rules only |
| 14 | Applicant applies | **works** | Public API | — |
| 15 | Admin hires applicant | **works** | Creates employee + auth | — |
| 16 | Employee onboarding | **works** | — | — |
| 17 | Employee completes training | **works** | LMS complete | — |
| 18 | Equipment assign + ack | **works** | Photos placeholder | Storage |
| 19 | Payroll aggregates time | **partial** | Needs clock data + admin UI | Build time admin UI |
| 20 | Admin dashboard reflects events | **partial** | Demo fallback; activity may be empty | Remove fallback in prod; verify logging |

---

## Hardcoded business settings audit

| Setting | Current source | Admin editable? | Consumed at runtime? |
|---------|----------------|-----------------|----------------------|
| Load tiers, modifiers, min/dump fee | `morris-config` + `company_settings` | yes (pricing page) | **no** (booking uses config) |
| Item catalog / common junk prices | `COMMON_JUNK_ITEMS`, config | partial (JSON) | **no** |
| Hauling rates | `morris-config.haulingPricing` | partial (JSON) | **no** |
| Dump fees / disposal categories | config + dump_sites table | partial | partial (engine uses config) |
| Service areas | `morris-config.serviceArea` | settings JSON | **no** |
| Schedule capacity | seed + settings JSON | yes | partial (slot create) |
| Employment types | hire forms | settings key exists | partial |
| Pay defaults | `morris-config` | settings JSON | payroll uses DB time |
| Document templates | config disclaimers | settings JSON | employee docs partial |
| Training assignments | HR UI + DB | yes | yes |
| Equipment categories | settings JSON | yes | yes |
| Notification copy | hardcoded UI strings | no | n/a |
| Estimate disclaimers | `morris-config` | read-only terms page | yes (static) |
| Financing terms | config + approval UI | partial | yes |
| Company terms | `COMPANY_TERMS` in config | read-only | static |
| Trucks/trailers/employees | `morris-config` arrays | fleet/HR APIs exist | **still used in UI** |
| Operations goals / KPI targets | `morris-config` | no | command center |

---

## Security audit

### Route protection

- Middleware: Supabase session + `profiles.status=active` + `roleAllowedForPath` — **good**
- HR/office_admin restricted to `/admin/hr/*` unless owner email — **good**
- Non-owner admin roles downgraded via `normalizeStaffRole` — **good**
- **Gap:** No server-side `requireAuth` in page components (middleware only) — acceptable if matcher complete

### API protection

- HR routes: granular `requireApiPermission` — **strong**
- Admin ops: most check `admin` or `planner` role
- **Risks:**
  - `/api/dump-sites`, `/api/trucks/*`, `/api/hr/fleet/trucks|trailers` — authenticated but **any logged-in user** may pass weak checks
  - `/api/schedule/slots` GET is **public** (intentional for booking calendar)
  - `/api/health/supabase` public — leaks connection info
  - `/api/hr/employees/create-test` — creates credentials

### RLS

- Enabled across migrations 001–030 with policies in 003+ — **assumed OK**; requires live policy audit in Supabase dashboard

### Data isolation

- Customer: `canAccessJob` / `canAccessInvoice` in payment and job APIs — **good**
- Employee: job access by `assignedEmployeeIds` — **good** if assignments persisted correctly

### Service role

- `createAdminClient()` used for writes in operations, activity, company settings — **required** for server mutations

### Storage

- Buckets not enforced in app code; uploads largely unimplemented — **low exposure, incomplete feature**

---

## UI/UX completion audit

| Issue | Examples |
|-------|----------|
| Dead links | `/platform` → admin; `/admin/employees` → HR redirect (OK) |
| Disabled buttons without workaround | Customer pay balance, PDF download, email invoice, SMS crew |
| Forms that don’t affect runtime config | Pricing saves but booking ignores |
| Unfinished pages | HR time, compliance, performance placeholders |
| Inconsistent navigation | Admin employees vs HR employees |
| Missing mobile polish | Large admin tables |
| Missing empty states | Command center when API fails outside dev |
| Missing loading states | Most data pages have basic loading |
| Missing error states | Some pages silent fail to empty |
| Design consistency | Generally strong Morris design system |

---

## Recommended next 10 tasks (after plan approval)

1. **Refactor `lib/db/operations.ts` `updateJob`** — Supabase read-merge-write first; remove mock-only dependency for server paths.
2. **Wire booking + `/pricing` to `getEffectivePricingRules()`** — load effective settings server-side or via API for client wizards.
3. **Set production env contract** — document and verify `NEXT_PUBLIC_USE_SUPABASE`, service role, `STAFF_OWNER_EMAILS`, `NODE_ENV=production`.
4. **Implement guest booking path** — collect contact at end, create customer + auth, or explicit login-first UX on marketing.
5. **Integrate real payment provider** — replace `MockPaymentProvider`; enable customer Pay balance flow.
6. **Planner production wiring** — `PlannerCrewPanel` from `/api/hr/dispatch-ready`; persist routes; fix `route-planner` to use passed jobs only.
7. **Replace `morrisConfig.employees` in admin/planner** with HR employee APIs for clock and assignment UIs.
8. **Invoice PDF + email** — implement backend generation; connect disabled buttons.
9. **Photo upload pipeline** — Supabase Storage for booking, job completion, equipment; wire `job_photos` table.
10. **Remove/gate dev-only surfaces** — `create-test` employee API, demo fallbacks when `NODE_ENV=production`, HR test button.

---

## Related document

See **[WIRING_COMPLETION_CHECKLIST.md](./WIRING_COMPLETION_CHECKLIST.md)** for the prioritized P0–P3 checklist.

---

*This audit reflects the codebase as of 2026-06-29. No code changes were made. Await approval before implementing fixes.*
