# Launch Roadmap — Morris Services / Morris Hauling

**Audit date:** 2026-07-10  
**Current state:** Prelaunch on Vercel · commit `1172a77`  
**Do not** enable live booking or card payments until Phase C / D exit criteria pass.

Effort key: **XS** &lt;2h · **S** 2–8h · **M** 1–3d · **L** 3–5d · **XL** 1–2w  
Priority: **P0** blocker · **P1** high · **P2** medium · **P3** nice

---

## Phase A — Ready for internal testing

Everything required before serious manual testing.

| # | Task | Priority | Effort | Risk | Dependency | Area | Order |
|---|------|----------|--------|------|------------|------|------:|
| A1 | Run seed cleanup SQL on production; verify Mission Control empty of fake revenue | P0 | S | High if wrong rows deleted | Supabase access | Data | 1 |
| A2 | Confirm Supabase Auth Site URL + redirects use `https://www.morris-services.com` (and apex if needed) | P0 | XS | Auth breaks | Supabase dashboard | Auth | 2 |
| A3 | Fix register subtitle “pay online” | P1 | XS | Customer trust | Deploy | Public copy | 3 |
| A4 | Create/verify one real owner admin + one real test employee (non-seed) | P0 | S | Lockout | STAFF_OWNER_EMAILS | Auth/HR | 4 |
| A5 | Execute [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md) public + auth sections | P0 | M | Missed bugs | A1–A4 | QA | 5 |
| A6 | Smoke employee clock + one admin-created job (delete after) | P0 | S | Data clutter | A1, A4 | Ops | 6 |
| A7 | Confirm storage buckets healthy (photos, docs, receipts, PDFs) | P1 | S | Uploads fail | Service role | Storage | 7 |
| A8 | Document known lint failures; decide if CI should fail on lint | P2 | S | Noise | — | Eng | 8 |

**Exit criteria:** Owner can log into admin; employee portal works for one user; public site honest; DB free of operational seed rows; checklist public/auth/employee sections signed.

---

## Phase B — Ready for soft launch

Limited real customers **manually** (phone intake). Booking flags stay off. Payments stay cash/check only.

| # | Task | Priority | Effort | Risk | Dependency | Area | Order |
|---|------|----------|--------|------|------------|------|------:|
| B1 | Owner decisions: service area, hours, insurance wording, cancellation, invoice terms | P0 | M | Legal/marketing | [`OWNER_DECISIONS.md`](./OWNER_DECISIONS.md) | Owner | 1 |
| B2 | Publish accurate careers hiring modes + pay range policy | P1 | S | Applicant expectations | B1 | HR | 2 |
| B3 | Soft-launch SOP: phone → admin job → estimate → schedule → crew | P0 | M | Process gaps | Phase A | Ops | 3 |
| B4 | Invoice + PDF + cash/check payment recording dry run | P0 | S | Accounting | A7 | Finance | 4 |
| B5 | Disposal complete + receipt on first real/test job | P1 | S | Profit wrong | Disposal module | Ops | 5 |
| B6 | Customer portal: only promise view jobs/invoices; hide or relabel chat/tracking | P1 | S | Trust | Deploy | Customer | 6 |
| B7 | Backup/recovery confirmation on Supabase plan | P1 | XS | Data loss | Owner billing | Infra | 7 |
| B8 | Optional: simple interest CRM note field / spreadsheet until form built | P2 | S | Lost leads | Contact page | Sales | 8 |

**Exit criteria:** 1–3 real jobs completable manually without fake data; invoices recordable; customers can log in to see their job; no card charges; booking still closed.

---

## Phase C — Ready for public booking

Enable customer booking submissions (`APP_STATUS=live` + booking flags).

| # | Task | Priority | Effort | Risk | Dependency | Area | Order |
|---|------|----------|--------|------|------------|------|------:|
| C1 | Owner sign-off on public pricing + deposit rules | P0 | M | Underpricing | B1 | Owner | 1 |
| C2 | Schedule capacity model (slots for launch weeks) | P0 | M | Overbook | Admin schedule | Ops | 2 |
| C3 | E2E booking test: register → book → job in admin → slot reserved | P0 | M | Lost bookings | C2 | Eng/QA | 3 |
| C4 | Guest vs required-login booking decision implemented | P0 | S | Conversion | [`BOOKING_AUTH_DECISION.md`](./BOOKING_AUTH_DECISION.md) | Product | 4 |
| C5 | Email provider (Resend/SendGrid) for booking confirmation | P0 | M | Silent failures | Provider account | Eng | 5 |
| C6 | Flip env: `APP_STATUS=live`, booking flags true; redeploy; monitor | P0 | XS | Accidental live | C1–C5 | Deploy | 6 |
| C7 | Rollback plan documented (set prelaunch + redeploy) | P0 | XS | — | C6 | Deploy | 7 |
| C8 | Public copy: remove “coming soon” where inaccurate; keep honesty | P1 | S | Mixed messages | C6 | Public | 8 |

**Exit criteria:** Real customer can submit booking; admin receives job; confirmation email sends; overload controls exist; instant rollback tested.

---

## Phase D — Ready for payments

Real card payments and bank payouts.

| # | Task | Priority | Effort | Risk | Dependency | Area | Order |
|---|------|----------|--------|------|------------|------|------:|
| D1 | Stripe account + bank payout for MORRIS SERVICE GROUP LLC | P0 | M | KYC delays | Legal docs | Finance | 1 |
| D2 | Implement Stripe provider + webhook + idempotency | P0 | L | Double charge | D1 | Eng | 2 |
| D3 | Env: test keys → live keys; webhook secret on Vercel | P0 | S | Misconfig | D2 | Deploy | 3 |
| D4 | Enable `isOnlineCardPaymentEnabled()` behind env flag | P0 | S | Premature enable | D2–D3 | Eng | 4 |
| D5 | Deposit + final balance flows tested in test mode then live $1 | P0 | M | Money movement | D4 | QA/Finance | 5 |
| D6 | Refund SOP + admin UI | P1 | M | Chargebacks | D5 | Ops | 6 |
| D7 | Accounting export / fee handling decision | P1 | S | Books mismatch | Bookkeeper | Finance | 7 |
| D8 | PCI review: no raw card data in logs; Stripe Elements only | P0 | S | Compliance | D2 | Security | 8 |
| D9 | Update customer/register copy to match real pay capability | P1 | XS | Trust | D5 | Public | 9 |

**Exit criteria:** Test + live successful charge and refund; webhooks reconcile invoice balance; payouts land in business bank; customer self-pay works; monitoring/alerts for failed webhooks.

---

## Recommended sequence (summary)

```
A1 seed cleanup → A2 auth URLs → A4 users → A5–A6 QA
        ↓
B1 owner decisions → B3 SOP → B4–B5 money/disposal dry run → soft customers
        ↓
C2 capacity → C3 E2E book → C5 email → C6 flip booking flags
        ↓
D1–D5 Stripe → D8 PCI → enable online pay
```

---

## Explicitly out of scope until later

- Google Maps Distance Matrix
- SMS provider
- Full payroll processor (Gusto/ADP)
- HR Performance / Time admin UIs
- Multi-division booking (window cleaning, etc.)
- BNPL (Klarna/Affirm)
