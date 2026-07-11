# Current System Overview — Morris Services / Morris Hauling

**Audit date:** 2026-07-10  
**Legal entity:** MORRIS SERVICE GROUP LLC  
**Public brand:** Morris Services  
**Domain:** https://www.morris-services.com (apex redirects here)  
**Operating division:** Morris Hauling & Junk Removal  
**Launch state:** **Prelaunch**  
**Git branch audited:** `main`  
**Commit audited / deployed:** `1172a7719a804f7d8976d195a4dc5b5c71d053e4`  
**Vercel project:** `morrishauling` (`cannastreams-projects`)  
**GitHub:** https://github.com/LiveStak-Brad/morrishauling  
**Deployment ID:** `dpl_2FdEDbvSxu3b5tmwnLxNh6sNy8hw` (production, Ready)

> Full detail: [`FULL_PRODUCTION_AUDIT.md`](./FULL_PRODUCTION_AUDIT.md) · Roadmap: [`LAUNCH_ROADMAP.md`](./LAUNCH_ROADMAP.md) · Env: [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md)

---

## What this platform is

A Next.js 16 + Supabase operations platform for Morris Services, with:

1. **Public marketing site** (Morris Services parent + Morris Hauling division)
2. **Admin / owner console** (jobs, CRM, estimates, invoices, disposal, settings)
3. **HR platform** (ATS, employees, onboarding, training, payroll tracking)
4. **Employee portal** (clock, jobs, docs, equipment, training)
5. **Customer portal** (jobs, estimates, invoices — payments disabled)
6. **Planner / dispatch** board

Live customer booking and card payments are **intentionally disabled**.

---

## Honest readiness scores (2026-07-10)

| Area | Score | Plain-language reason |
|------|------:|------------------------|
| **Overall production readiness** | **58%** | Strong ops/HR/disposal foundation and a live prelaunch site, but seed data pollutes production metrics, payments/email are not real, booking is gated, and end-to-end workflows are largely untested. |
| **Public site** | **82%** | Deployed, SSL valid, prelaunch messaging honest, careers live, booking preview gated. Remaining: register “pay online” copy, mobile re-verify, owner content decisions. |
| **Internal operations** | **68%** | Admin modules are Supabase-backed and usable for manual intake, but production still contains seed jobs/customers/invoices/payments; some Mission Control tiles are placeholders. |
| **Employee / HR** | **70%** | ATS → hire → onboarding → training → equipment is largely wired. Time & Attendance and Performance admin pages are placeholders. Seed employees remain. |
| **Customer portal** | **42%** | Login/register/password reset exist; job/invoice viewing works when real data exists. Chat, live tracking, receipts, and card pay are fake or disabled. |
| **Payments** | **22%** | Manual cash/check recording only. Stripe/Square are stubs. Online card flag hard-coded `false`. |
| **Mobile** | **72%** | RC1 responsive polish shipped (hero contain, hamburger, overflow-x). Not fully re-audited at every breakpoint in this pass; admin tables remain desktop-first. |
| **Deployment / security** | **75%** | Correct prelaunch env on Vercel; launch-blocker static checks pass; public health minimized; data/store requires auth. Residual risk: service-role write model, lint debt, no automated E2E suite. |

---

## Safe to do today?

| Question | Answer | Blocker if no |
|----------|--------|---------------|
| Public browse the site? | **Yes** | — |
| Collect career applications? | **Yes** | Label talent-pool vs active hiring carefully; pay ranges are estimated. |
| Collect prelaunch interest? | **Yes (phone / contact)** | No dedicated interest CRM form beyond contact/phone and careers “accepting interest.” |
| Manually enter real jobs? | **Not yet safely** | **Seed/demo rows still in production Supabase** (jobs/customers/invoices/payments/employees with `*-m*` IDs). Clean first or metrics lie. |
| Employees use the portal? | **Partial** | Needs a real linked HR employee (not seed). Clock/jobs/training work in code; needs live smoke test. |
| Enable live booking? | **No** | Requires `APP_STATUS=live` + booking flags, auth/booking E2E, schedule capacity, pricing owner sign-off, seed cleanup. |
| Enable payments? | **No** | No Stripe (or other) processor wired; `isOnlineCardPaymentEnabled()` always false. |

---

## What is finished

- Morris Services parent portal + Morris Hauling marketing pages (prelaunch copy)
- Domain + SSL on Vercel; GitHub → Vercel production deploys from `main`
- Supabase auth: login, register, forgot/update password
- Careers board + application submit (+ document upload API)
- Admin job intake, estimate review, schedule slots, invoices (manual), cash/check payments
- Disposal facilities, recommendations (haversine), receipt upload, completion gate, review queue
- HR: applicants, hire, employees, onboarding, training LMS, equipment, PTO approval, payroll export (tracking)
- Employee: clock, job field view, training, documents, equipment, time-off
- Prelaunch gates: booking create 403, card pay blocked, dev tools 404 in production

## What is partially finished

- Customer portal (view-only value; misleading tracking/chat/pay copy)
- Planner route optimization (heuristic, not Google Maps)
- Financing (in-house approve/deny; no third-party BNPL)
- Invoice PDF (generation exists; email send is placeholder/rejected)
- Public branding/services still largely static `morris-config` / company context (admin settings save to DB but public site may not fully reflect them)
- HR Time & Attendance / Performance admin UIs (placeholders)
- Mobile admin/planner tables

## What is mock / placeholder / demo-gated

- Online card/ACH (`MockPaymentProvider`, Stripe/Square stubs)
- Customer chat, refer-a-friend, live GPS tracking
- Mission Control weather/fuel/GPS tiles
- Email delivery (invoice/quote send)
- SMS notifications
- Google Maps Distance Matrix (UI deep links only)
- `DEMO_DATA=true` mock RAM store (must stay unset in production)
- **Production DB still contains seed `*-m*` rows** (not gated — real pollution)

## What must not be enabled yet

- `APP_STATUS=live`
- `ALLOW_PUBLIC_BOOKING` / `NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING`
- Stripe/Square live keys + online pay flag
- Marketing claims that imply live service guarantees (currently cleaned from public components; keep it that way)
- Running `npm run db:seed` against production

---

## Strongest modules

1. **Disposal** — facilities, scoring, receipts, gate, review
2. **HR ATS + Training LMS** — postings, apply, hire, courses/quizzes
3. **Public prelaunch site** — honest gating and branding
4. **Admin job intake + estimate review**

## Weakest modules

1. **Online payments**
2. **Email / notifications**
3. **Customer portal promises** (tracking/chat/pay)
4. **HR Time & Performance admin pages**
5. **Data legitimacy in production** (seed rows)

---

## Immediate next actions (owner)

1. Run seed cleanup SQL against production (see audit Part 10) — review before execute.
2. Manual QA of public + careers + admin login (checklist).
3. Decide insurance / pricing / careers pay language ([`OWNER_DECISIONS.md`](./OWNER_DECISIONS.md)).
4. Fix register page “pay online” copy before promoting registration.
5. Do **not** flip booking or payment flags.
