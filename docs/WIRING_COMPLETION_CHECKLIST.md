# Morris OS — Wiring Completion Checklist

Ordered by priority. **Do not treat production as ready until all P0 items are done.**

Legend: `[ ]` open · `[~]` partial · `[x]` done (none marked done at audit time)

---

## P0 — Must fix before real use

### Data layer & environment

- [ ] Set `NEXT_PUBLIC_USE_SUPABASE=true` in production; verify `isDbReady()` passes (`/api/health/supabase`)
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is set so server writes use service role (`lib/supabase/admin.ts`)
- [ ] Set `NODE_ENV=production` and **do not** set `DEMO_DATA=true` (demo fallback is enabled in development)
- [ ] Configure `STAFF_OWNER_EMAILS` for privileged admin/HR roles
- [ ] **Fix hybrid mock write path**: `updateJob`, `reviewJobEstimate`, and related mutations call `mockUpdateJob` first — jobs that exist only in Supabase fail to update on the server unless mock store is hydrated
- [ ] Remove or gate `/api/hr/employees/create-test` in production (hardcoded test credentials)

### Booking & customers

- [ ] **Guest booking**: `/book` redirects unauthenticated users to `/register` — decide: true guest checkout with post-book account creation, or document login-first policy
- [ ] Wire **booking estimate engines** to `getEffectivePricingRules()` / `company_settings` — today `BookingWizard` and `HaulingTransportWizard` use static `morrisConfig` only; admin pricing saves are ignored at booking time
- [ ] Wire **public pricing page** (`/pricing`) to effective settings, not static `morrisConfig`
- [ ] Wire **`CompanyProvider`** to load branding/service config from DB with `morris-config` fallback

### Payments & invoices

- [ ] Replace `MockPaymentProvider` with real payment processor (Stripe/Square) for card capture
- [ ] Remove card/ACH **placeholder** UI in `PaymentPortal`, `PaymentCheckout`, `FieldPaymentCollection`
- [ ] Implement invoice PDF generation and email send (disabled buttons: “Download PDF”, “Email invoice”, “Send placeholder”)
- [ ] Verify payment → invoice balance update end-to-end in Supabase-only mode (no mock hydration)

### Operations core

- [ ] Planner: persist route plans to `routes` / `route_stops`; assign truck/trailer/crew from HR fleet + employees API (not `morrisConfig.employees`)
- [ ] Fix `route-planner.ts` — uses `getJob` from mock-data when `jobsArg` omitted
- [ ] Admin **Employees** clock panel (`AdminEmployeesPanel`) lists `morrisConfig.employees` — switch to `/api/hr/employees` or `/api/hr/dispatch-ready`
- [ ] Schedule slots: confirm production has real slots (not only `seedScheduleSlotsIfEmpty` seeds)

### Auth

- [ ] Implement password reset (`/forgot-password` is “coming soon”)
- [ ] Audit admin API routes that only use `requireApiProfile()` without role check (e.g. some dump-site/truck routes)

---

## P1 — Should fix before launch

### Admin & CRM

- [ ] Admin **branding** (`/admin/branding`) — read-only; add save to `company_settings` or storage
- [ ] Admin **services** (`/admin/services`) — read-only; make editable
- [ ] Admin **terms** (`/admin/terms`) — read-only; wire to `company_settings` / `document.templates`
- [ ] Customer portal: enable **Pay balance** button (currently disabled “Coming soon” on `/customer/payments`)
- [ ] Financing: replace “Risk indicators placeholder — credit check API” with real policy or remove
- [ ] Photo uploads: booking (`PhotoUploadSection`), employee job completion, employee profile — wire to Supabase Storage buckets

### HR (functional but incomplete UI)

- [ ] Build **Time & Attendance** admin UI (`/admin/hr/time` — placeholder page; APIs exist)
- [ ] Build **Compliance** admin UI (`/admin/hr/compliance` — placeholder; tables exist)
- [ ] Build **Performance** admin UI (`/admin/hr/performance` — placeholder; tables exist)
- [ ] Remove “Create Brad Test Employee” from HR dashboard in production builds
- [ ] Employee documents: PDF viewer + credential upload (placeholder today)

### Dispatch & fleet

- [ ] Fleet page trailers section: load from `/api/hr/fleet/units` instead of `morrisConfig.trailers`
- [ ] Equipment photo upload: replace `placeholder://` paths with real storage
- [ ] Google Distance Matrix for hauling/junk route miles (`lib/distance/distance-provider.ts` TODO)

### Notifications & activity

- [ ] Wire `notifications` table or external provider (SMS/email buttons disabled in employee assignment card)
- [ ] Ensure all critical mutations call `logActivity` (audit gaps on some HR paths)

---

## P2 — Polish / soon

- [ ] Command center “Coming soon” tiles: weather, fuel prices, Google Maps optimization, crew GPS, business notifications
- [ ] Customer portal: referral program, upload photos, text support CTAs (UI present, not wired)
- [ ] Invoice detail: print/email actions for customers
- [ ] Payment refunds (disabled “Refund placeholder”)
- [ ] Applicant `alert()` on failure → toast pattern
- [ ] Mobile polish pass on admin tables and planner tabs
- [ ] Empty/loading/error states consistency audit per portal
- [ ] Remove `DataHydrator` mock sync once server reads are fully Supabase-native (eliminate dual-store)
- [ ] `dev` toolbar / localStorage role impersonation — confirm never shipped in production bundle exposure

---

## P3 — Future

- [ ] Third-party financing providers (Klarna, Affirm, etc. — listed in config, not integrated)
- [ ] `performance_reviews`, `disciplinary_actions`, `hr_investigations`, `employee_awards`, `employee_kpi_snapshots` — schema only
- [ ] `shift_swap_requests`, `employee_availability` — schema, limited UI
- [ ] `contractor_1099_yearly` — tax reporting automation
- [ ] `routes` optimization with live traffic
- [ ] Multi-company / franchise `companies` table usage beyond single `morris-hauling` ID
- [ ] Platform marketing page (`/platform` redirects to admin)

---

## Quick verification script (manual)

After P0 fixes, run through:

1. Register customer → book junk job → see job in admin review → schedule → assign crew → employee dashboard shows job
2. Employee clock in → complete job → admin records payment → customer sees payment
3. Create invoice → partial pay → balance updates
4. Submit financing → admin approve → schedule reflects
5. Post job → public apply → admin hire → employee onboarding + training complete
6. Equipment assign → employee acknowledge → return

---

*Generated: 2026-06-29 · Audit branch: full codebase review · No fixes applied.*
