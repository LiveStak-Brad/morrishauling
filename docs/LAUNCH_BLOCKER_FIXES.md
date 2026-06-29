# Launch Blocker Fixes — Batch 1

**Date:** 2026-06-29  
**Source audit:** [`PRODUCTION_AUDIT.md`](./PRODUCTION_AUDIT.md)  
**Scope:** Security:payment launch blockers — secure API routes, auth recovery, dev-tool gating, honest payment/email UI. No Stripe, SMS, cron, or new modules.

---

## 1. Audit IDs addressed

| ID | Issue | Fix summary |
|----|-------|---------------|
| SEC-001 | Unauthenticated `/api/data/store` | `requireApiProfile()` + rate limit; `filterStoreByProfile()` returns empty store when profile is null or role is unknown |
| SEC-002 | Public health endpoint leaks internals | Public route returns `{ ok }` only; admin detailed diagnostics at `/api/admin/health/supabase` |
| SEC-004 | Timeclock punch without authorization | `resolveTimeclockTarget()` enforces role matrix on punch, clock-in, clock-out; activity log on behalf punches |
| SEC-006 | Invoice PDF accessible without proper auth | Extended `canAccessInvoice()` with employee assignment check; PDF route enforces it |
| SEC-007 | No rate limiting on public APIs | In-memory rate limiter on 6 high-risk routes |
| SEC-008 | Dev/test APIs reachable in production | `requireDevToolsApi()` returns 404; `isDevOnlyApiAllowed()` never true in production |
| SEC-005 | Mock card payments (partial) | `isOnlineCardPaymentEnabled()` returns false; API blocks online methods; UI shows contact notice |
| UX-002 | QA test data tools in production | Data Inspector 404 in prod; test-data-status gated |
| UX-006 | Fake card checkout (partial) | Customer payment UI replaced with honest “not enabled” notice |
| UX-010 | No password reset | Forgot-password form, auth callback, update-password page |
| UX-015 | Dev employee creation in prod | Create-test API + HrDashboard button gated |
| UX-016 | Fake invoice email send (partial) | `sendPlaceholder` rejected in API; UI shows disabled info button |
| UX-017 | Admin card payment options (partial) | Card/ACH shown as “coming soon”; cash/check/financing only |
| DATA-030 | Demo data in production undetected | `isProductionWithDemoData()` critical banner in ProductionEnvWarning |
| INT-004 | Email integration placeholder (partial) | Send actions disabled; no fake “sent” status |
| WF-003 | Estimate “send quote” implies email (partial) | Renamed to “Save revised quote”; activity log says “saved” not “sent” |

---

## 2. Files changed

### New files

| File | Purpose |
|------|---------|
| `lib/env/dev-tools.ts` | Central dev-tools and demo-data production checks |
| `lib/api/rate-limit.ts` | In-memory IP rate limiting |
| `lib/payments/online-payments-enabled.ts` | Online card/ACH feature flag (disabled) |
| `lib/health/supabase-health.ts` | Public vs detailed Supabase health probes |
| `lib/auth/timeclock-auth.ts` | Timeclock authorization matrix |
| `app/api/admin/health/supabase/route.ts` | Admin-only detailed health |
| `app/auth/callback/route.ts` | Supabase SSR code exchange (password reset) |
| `app/update-password/page.tsx` | Set new password after reset link |
| `app/admin/settings/data-inspector/DataInspectorClient.tsx` | Client UI extracted from page |
| `components/payments/OnlinePaymentsDisabledNotice.tsx` | Honest customer payment notice |
| `scripts/verify-launch-blockers.mjs` | Static verification script |
| `docs/LAUNCH_BLOCKER_FIXES.md` | This document |

### Modified files

| Area | Files |
|------|-------|
| Security APIs | `app/api/data/store/route.ts`, `app/api/health/supabase/route.ts`, `app/api/timeclock/punch/route.ts`, `app/api/timeclock/clock-in/route.ts`, `app/api/timeclock/clock-out/route.ts`, `app/api/customer/invoices/[id]/pdf/route.ts`, `app/api/auth/register/route.ts`, `app/api/careers/applications/route.ts`, `app/api/careers/applications/documents/route.ts`, `app/api/schedule/slots/route.ts` |
| Permissions / DB | `lib/db/operations.ts`, `lib/auth/permissions.ts` |
| Dev tools | `lib/env/production.ts`, `app/api/hr/employees/create-test/route.ts`, `app/api/admin/test-data-status/route.ts`, `app/admin/settings/data-inspector/page.tsx`, `components/admin/QaTestDataWarning.tsx`, `components/admin/ProductionEnvWarning.tsx`, `components/admin/SupabaseStatusCard.tsx`, `components/hr/HrDashboard.tsx` |
| Auth | `app/forgot-password/page.tsx`, `lib/auth/client.ts` |
| Payments | `app/api/payments/create/route.ts`, `app/api/admin/payments/route.ts`, `components/payments/PaymentCheckout.tsx`, `components/payments/PaymentPortal.tsx`, `app/customer/payments/page.tsx`, `components/admin/forms/AdminPaymentCreateForm.tsx` |
| Email guards | `app/api/admin/invoices/route.ts`, `components/admin/forms/AdminInvoiceCreateForm.tsx`, `components/admin/EstimateReviewCard.tsx`, `lib/api/mutations.ts` |
| Config | `package.json` |

---

## 3. Verification results

### Build

```text
npm run build
```

**Result:** Passed (Next.js 16.2.9, TypeScript clean).

### Static checks

```text
npm run verify:launch-blockers
```

**Result:** All 19 static checks passed.

Optional HTTP checks against a running server:

```text
BASE_URL=http://localhost:3000 npm run verify:launch-blockers
```

Expects unauthenticated `GET /api/data/store` → 401 and public `GET /api/health/supabase` → `{ ok: boolean }` only.

### Manual smoke tests (recommended)

1. **Data store:** Log out → `GET /api/data/store` → 401.
2. **Health:** Unauthenticated `/api/health/supabase` → `{ ok: true|false }` only; admin settings card shows full diagnostics when logged in as admin.
3. **Timeclock:** Customer cannot punch; employee can only self-punch; admin can punch on behalf.
4. **Invoice PDF:** Employee without job assignment → 403; customer sees own invoices only.
5. **Dev tools:** In production build, `/admin/settings/data-inspector` → 404; create-test API → 404.
6. **Password reset:** `/forgot-password` submits email; Supabase redirect URL must include `/auth/callback?next=/update-password`.
7. **Payments:** Customer checkout shows contact notice; card API returns 400.
8. **Email:** Admin invoice “Email send” disabled; API rejects `sendPlaceholder: true`.

---

## 4. Remaining launch blockers (not in Batch 1)

- **Stripe / real card processing** — online payments still disabled by design
- **Email provider integration** — Resend/SendGrid/etc. not connected
- **SMS notifications**
- **GPS / fleet tracking**
- **Accounting module integration**
- **Cron / scheduled jobs** (auto-invoice on job completion, reminders)
- **HR Time & Attendance admin UI** (partial)
- **Pagination / performance** on large list views
- **Global search**, JSON editor replacement
- **Rate limiter at scale** — current limiter is in-memory; replace with Redis/Upstash before high traffic

---

## 5. Next recommended batch

1. **Email integration** — wire Resend (or chosen provider); re-enable invoice/quote send with real delivery tracking.
2. **Stripe** — enable `isOnlineCardPaymentEnabled()` behind env flag; customer checkout + webhook handling.
3. **Auto-invoice on job completion** — workflow + cron or event-driven trigger.
4. **Redis rate limiting** — Upstash for multi-instance deployments.
5. **HR time admin UI** — approve/edit punches, export for payroll.
6. **Pagination** — jobs, invoices, customers list endpoints and UI.

---

## Operational notes

- **Supabase dashboard:** Add redirect URL `{origin}/auth/callback?next=/update-password` for password reset emails.
- **DEMO_DATA in production:** Shows critical red banner; destructive dev APIs remain blocked regardless of `DEMO_DATA`.
- **Middleware:** `/forgot-password`, `/auth/callback`, and `/update-password` must remain publicly accessible (verify in `middleware.ts` if auth redirects block them).
