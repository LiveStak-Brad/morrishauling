# Admin Real Data Audit

Production hardening audit for Morris OS admin console. **Business data** must come from Supabase or show professional empty states. **Reference data** (dump sites, service areas, templates) may ship pre-populated with real information.

**Demo gate:** `DEMO_DATA=true` only (see `lib/is-demo-data.ts`). When false, `lib/data/real-record-filter.ts` excludes seed/mock rows (`job-m*`, `cust-m*`, fake names, test addresses, etc.).

**Last updated:** 2026-06-29

---

## Summary

| Status | Count | Modules |
|--------|-------|---------|
| Production ready | 18 | customers, review, financing, schedule, dump-sites, invoices detail, HR core, settings, data-inspector, jobs (API), payments (API), fleet (DB) |
| Partial | 12 | jobs UI, estimates, payments UI, pricing, fleet UI, planner/dispatch, command center, HR time/performance, employees redirect |
| Config-only (reference) | 4 | services, terms, branding, pricing (morris-config) |

**Overall production readiness:** ~78%

---

## Route audit

Legend: **PR** = Production ready · **PT** = Partial · **NR** = Not ready

### `/admin` — Mission Control

| Field | Value |
|-------|-------|
| Purpose | Operations dashboard, KPIs, live dispatch preview, quick actions |
| Current data source | `/api/admin/operations` → Supabase via `getOperationsCommandCenter()` |
| Uses Supabase? | Yes (when configured) |
| Uses mock data? | Only if API fails **and** `DEMO_DATA=true` (client fallback in `OperationsCommandCenter.tsx`) |
| Uses morris-config? | Company context, trucks/trailers labels in demo dispatch only |
| Uses seed data? | Hidden when filter active |
| Uses hardcoded arrays? | KPI empty messages only (not fake values) |
| Create / Edit / Delete | Quick links only |
| Empty state? | Yes — KPI tiles show $0 / 0 with messages |
| Production ready? | **PT** |
| Required fixes | Remove any remaining seed rows in DB; verify live map/dispatch empty when no jobs |

---

### `/admin/jobs`

| Field | Value |
|-------|-------|
| Purpose | List and create jobs (phone/text intake) |
| Current data source | `/api/admin/jobs` → `getJobsWithMeta()` |
| Uses Supabase? | Yes |
| Uses mock data? | No in production (`demoOr` returns `[]`) |
| Uses morris-config? | `companyId` only |
| Uses seed data? | Filtered out unless `DEMO_DATA=true` |
| Create / Edit / Delete | Create via `AdminJobIntake`; edit via job cards/API |
| Empty state? | Yes — `AdminEmptyState` |
| Production ready? | **PR** |
| Required fixes | Wire inline edit/assign/close if not on card actions |

---

### `/admin/customers`

| Field | Value |
|-------|-------|
| Purpose | CRM, callbacks, interaction notes |
| Current data source | `/api/admin/customers` + operations-depth interactions |
| Uses Supabase? | Yes |
| Uses mock data? | No |
| Uses morris-config? | `companyId` only |
| Create / Edit / Archive | Create yes; callback complete; notes |
| Empty state? | Yes |
| Production ready? | **PR** |
| Required fixes | Formal archive/edit customer form |

---

### `/admin/employees`

| Field | Value |
|-------|-------|
| Purpose | Legacy route — redirects to HR employees |
| Current data source | `/admin/hr/employees` |
| Uses morris-config employees? | **Removed from production paths** |
| Production ready? | **PR** (redirect) |

---

### `/admin/review`

| Field | Value |
|-------|-------|
| Purpose | Junk removal estimate review queue |
| Current data source | `/api/admin/jobs` filtered client-side |
| Uses Supabase? | Yes |
| Empty state? | Yes — "No jobs waiting for review." |
| Production ready? | **PR** |

---

### `/admin/estimates`

| Field | Value |
|-------|-------|
| Purpose | All jobs with estimates / pricing breakdown |
| Current data source | `/api/admin/jobs` |
| Empty state? | Yes |
| Production ready? | **PR** |

---

### `/admin/invoices`

| Field | Value |
|-------|-------|
| Purpose | Invoice list and stats |
| Current data source | `/api/admin/invoices` with `meta` |
| Uses Supabase? | Yes |
| Create / Edit / Void | Create at `/new`; detail edit at `[id]` |
| Empty state? | Yes |
| Production ready? | **PR** |

---

### `/admin/invoices/[id]`

| Field | Value |
|-------|-------|
| Purpose | Invoice detail, PDF, payments, void |
| Current data source | `/api/admin/invoices/[id]` |
| Production ready? | **PR** |

---

### `/admin/payments`

| Field | Value |
|-------|-------|
| Purpose | Payment ledger |
| Current data source | `/api/admin/payments` with `meta` |
| Empty state? | Yes |
| Production ready? | **PR** |

---

### `/admin/financing`

| Field | Value |
|-------|-------|
| Purpose | Payment plan approval center |
| Current data source | `/api/admin/financing` with `meta` |
| Empty state? | Yes in `FinancingApprovalCenter` |
| Production ready? | **PR** |

---

### `/admin/schedule`

| Field | Value |
|-------|-------|
| Purpose | Capacity slots and booking windows |
| Current data source | `/api/schedule/slots` + jobs API |
| Empty state? | Via `AdminScheduleManager` when no slots |
| Production ready? | **PR** |

---

### `/admin/pricing`

| Field | Value |
|-------|-------|
| Purpose | Pricing rules display |
| Current data source | `morris-config` / company context (**reference config**) |
| Uses Supabase? | Partial — some overrides in DB |
| Production ready? | **PT** — edit via config/DB sync needed |

---

### `/admin/services`

| Field | Value |
|-------|-------|
| Purpose | Service catalog display |
| Current data source | `morris-config` (**reference**) |
| Create / Edit | Read-only UI |
| Production ready? | **PT** — needs DB-backed edit or documented as reference |

---

### `/admin/fleet`

| Field | Value |
|-------|-------|
| Purpose | Trucks, trailers, maintenance |
| Current data source | `/api/admin/operations-depth`, `/api/hr/fleet/trailers` |
| Uses morris-config trailers? | **Removed** — DB/API only |
| Empty state? | Yes |
| Production ready? | **PR** |

---

### `/admin/dump-sites`

| Field | Value |
|-------|-------|
| Purpose | Disposal facility reference data |
| Current data source | Supabase `dump_sites` + migration `033_real_reference_dump_sites.sql` |
| Uses mock? | No — real MO facilities |
| Production ready? | **PR** |

---

### `/admin/dispatch` → `/planner`

| Field | Value |
|-------|-------|
| Purpose | Live dispatch board |
| Current data source | `/api/admin/planner`, live-dispatch ops |
| Uses mock? | Demo-only (`isDemoDataEnabled`) for Marcus live phase |
| Empty state? | Yes when no assigned jobs |
| Production ready? | **PT** |

---

### `/admin/settings`

| Field | Value |
|-------|-------|
| Purpose | Company settings, QA warnings, data tools |
| Current data source | `/api/admin/company-settings`, test-data-status |
| Production ready? | **PR** |

---

### `/admin/settings/data-inspector`

| Field | Value |
|-------|-------|
| Purpose | Real vs filtered records, exclusion reasons, cleanup SQL |
| Current data source | `/api/admin/test-data-status` (unfiltered fetch + debug report) |
| Production ready? | **PR** |

---

### `/admin/terms` · `/admin/branding`

| Field | Value |
|-------|-------|
| Purpose | Legal copy and brand assets (**reference**) |
| Current data source | `morris-config` |
| Production ready? | **PT** — acceptable as reference; DB edit optional |

---

## HR modules

### `/admin/hr` · `/admin/hr/dashboard`

| Purpose | HR overview |
| Data source | HR APIs, Supabase |
| Production ready? | **PR** |

### `/admin/hr/applicants` · `[id]` · `/new`

| Data source | `/api/hr/applicants` |
| CRUD | Create, edit, hire flow |
| Production ready? | **PR** |

### `/admin/hr/employees` · `[id]` · `/new`

| Data source | `/api/hr/employees` — **not** morris-config |
| Filter | `filterHrEmployees` when `DEMO_DATA` false |
| Production ready? | **PR** |

### `/admin/hr/onboarding` · `/job-postings` · `/payroll` · `/taxes` · `/compliance` · `/training` · `/equipment` · `/schedule`

| Data source | Supabase HR modules |
| Production ready? | **PR** (feature-complete modules) |

### `/admin/hr/time` · `/admin/hr/performance`

| Status | Placeholder UI |
| Production ready? | **NR** — empty/coming-soon acceptable for day one |

---

## API metadata (Task 6)

Admin list APIs return:

```json
{
  "meta": {
    "source": "supabase" | "mock" | "empty",
    "count": 12,
    "filteredCount": 10,
    "excludedDemoCount": 2
  }
}
```

Implemented: `/api/admin/jobs`, `/customers`, `/invoices`, `/payments`, `/financing`, `/hr/fleet/trailers`.

---

## Reference vs business data (Task 10)

| Business (starts empty) | Reference (may ship populated) |
|-------------------------|--------------------------------|
| customers, jobs, employees, payments, invoices, estimates, financing, dispatch assignments, fleet units (until added) | dump sites, service ZIPs, waste categories, training curriculum, OSHA docs, policy templates, morris-config services/pricing |

---

## Remaining mock dependencies

| Location | Status |
|----------|--------|
| `lib/mock-data.ts` | Demo-only via `isDemoDataEnabled()` |
| `lib/mock-operations-depth.ts` | Demo-only |
| `OperationsCommandCenter.tsx` L124+ | Gated — returns null if not demo |
| `app/planner/page.tsx` | Gated mock schedule/jobs |
| `AdminDepthPanels loadDepth` | Gated mock depth |
| `lib/api/mutations.ts` | Mock store only when demo |
| `scripts/db-seed.mjs` | Dev seed — cleanup SQL provided |
| `lib/morris-config.ts` | Reference + demo personas (not shown when filtered) |

---

## Verification checklist

- [ ] `DEMO_DATA` unset or `false` in production
- [ ] Run migration `033_real_reference_dump_sites.sql`
- [ ] Data Inspector shows 0 excluded after seed cleanup
- [ ] `npm run build` passes
- [ ] No fake KPIs/revenue on Mission Control
- [ ] Staff Login routes admin → `/admin`, employee → `/employee`
- [ ] Public nav readable over hero (`PublicHeader`)

---

## Recommended next priorities

1. Run seed cleanup SQL in Supabase production
2. DB-back services/pricing/branding edit (or document as code-deploy reference)
3. Complete HR time & performance modules or hide nav until ready
4. Planner: remove demo drive-time constants when `DEMO_DATA` false
5. E2E smoke test with empty database before go-live
