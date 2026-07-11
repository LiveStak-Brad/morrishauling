# Owner Decisions Needed — Morris Services

**Audit date:** 2026-07-10  
**How to use:** Decide each group once. Defaults are safe for **prelaunch**. Changing a default unblocks or changes soft/live launch.

---

## 1. Public pricing & quotes

| | |
|--|--|
| **Decision** | Are `/pricing` numbers public planning figures only, or binding rate card? |
| **Recommended default** | Planning figures only until soft launch; keep prelaunch disclaimer. |
| **Why** | Avoids disputes before insurance, disposal costs, and labor model are proven. |
| **If undecided** | Soft launch quotes stay phone-only; public page must keep disclaimer. |

## 2. Careers pay ranges

| | |
|--|--|
| **Decision** | Publish estimated ranges vs “DOE” vs hide pay? |
| **Recommended default** | Estimated ranges + “not a job offer” + hiring-mode badges. |
| **Why** | Attracts talent-pool applicants without over-promising. |
| **If undecided** | Applicants may assume active hiring at listed rates. |

## 3. Insurance & licensing wording

| | |
|--|--|
| **Decision** | When may site say “licensed & insured”? |
| **Recommended default** | **Do not claim** until policies are active and certificates on file. |
| **Why** | False advertising / liability. |
| **If undecided** | Keep current omission (good). |

## 4. Service area

| | |
|--|--|
| **Decision** | Exact counties/zips at launch (Warren, Lincoln, St. Charles — confirm). |
| **Recommended default** | Keep current three-county copy until expansion. |
| **Why** | Booking radius and travel fees depend on it. |
| **If undecided** | Schedule/travel pricing stays guesswork. |

## 5. Booking behavior

| | |
|--|--|
| **Decision** | Require account before booking vs guest booking? Deposits at request? |
| **Recommended default** | Keep **closed** until Phase C; then require account + admin review before confirm. |
| **Why** | Reduces spam and bad jobs early. |
| **If undecided** | Cannot flip `ALLOW_PUBLIC_BOOKING`. |

## 6. Deposits, cancellation, refunds

| | |
|--|--|
| **Decision** | Deposit %; cancel window; refund rules. |
| **Recommended default** | Soft launch: no card deposits; cancel by phone; goodwill case-by-case. Live: 20–25% deposit, 24–48h cancel for full deposit refund. |
| **Why** | Protects crew time without harsh early policy. |
| **If undecided** | Stripe deposit flow and terms pages blocked. |

## 7. Payment methods

| | |
|--|--|
| **Decision** | Cash / check / card / ACH / financing? |
| **Recommended default** | Soft launch: cash + check only (already supported). Later: Stripe card; ACH optional. |
| **Why** | Matches current code readiness. |
| **If undecided** | Do not enable online pay flag. |

## 8. Customer financing

| | |
|--|--|
| **Decision** | Offer in-house payment plans? Third-party BNPL? |
| **Recommended default** | In-house only for trusted soft-launch customers; no Klarna/Affirm until volume. |
| **Why** | Types exist; processors do not. |
| **If undecided** | Hide financing CTAs from public marketing. |

## 9. Employee classifications & payroll

| | |
|--|--|
| **Decision** | W-2 vs 1099 mix; payroll provider (Gusto/ADP/manual). |
| **Recommended default** | Track in-app; run payroll externally until provider chosen. |
| **Why** | App is tracking/export, not a full payroll engine. |
| **If undecided** | Tax/payroll modules stay “tracking only.” |

## 10. Email & SMS providers

| | |
|--|--|
| **Decision** | Transactional email (Resend/SendGrid); SMS (Twilio) yes/no. |
| **Recommended default** | Email before public booking; SMS after booking is stable. |
| **Why** | Confirmations and password reset deliverability. |
| **If undecided** | Password reset depends on Supabase email; booking confirmations stay manual. |

## 11. Google Maps API

| | |
|--|--|
| **Decision** | Pay for Distance Matrix / Directions for disposal + planner? |
| **Recommended default** | Defer; haversine is enough for soft launch. |
| **Why** | Cost + key management; disposal already usable. |
| **If undecided** | Route times stay estimates. |

## 12. Launch date & business hours

| | |
|--|--|
| **Decision** | Soft launch date; public hours; after-hours / emergency policy. |
| **Recommended default** | Soft launch when Phase B exit met; publish hours on contact; no emergency SLA initially. |
| **Why** | Prevents same-day expectation. |
| **If undecided** | Marketing and staffing misaligned. |

## 13. Disposal markup & tax

| | |
|--|--|
| **Decision** | Markup on dump fees; sales tax on services? |
| **Recommended default** | Set markup in admin pricing; confirm tax with accountant before invoices go out. |
| **Why** | Profitability and legal compliance. |
| **If undecided** | Invoice totals may be wrong. |

## 14. Invoice terms & legal

| | |
|--|--|
| **Decision** | Net due terms; Terms of Service; Privacy Policy; photo/media consent. |
| **Recommended default** | Due on completion for soft launch; publish basic Terms + Privacy before public booking; photo consent in booking/job T&Cs. |
| **Why** | Required for live customers and ads. |
| **If undecided** | Public booking and marketing blocked ethically/legally. |

## 15. Domain preference

| | |
|--|--|
| **Decision** | Keep **www as primary** (current) or switch apex-primary? |
| **Recommended default** | Keep www primary; align Supabase redirects to www. |
| **Why** | Matches live Vercel config today. |
| **If undecided** | Auth callback mismatches possible. |

---

## Decision log (fill in)

| # | Topic | Decision | Date | Owner |
|---|-------|----------|------|-------|
| 1 | Pricing | | | |
| 2 | Careers pay | | | |
| 3 | Insurance wording | | | |
| 4 | Service area | | | |
| 5 | Booking | | | |
| 6 | Deposits/cancel | | | |
| 7 | Payment methods | | | |
| 8 | Financing | | | |
| 9 | Payroll | | | |
| 10 | Email/SMS | | | |
| 11 | Google Maps | | | |
| 12 | Launch/hours | | | |
| 13 | Disposal/tax | | | |
| 14 | Legal/terms | | | |
| 15 | www vs apex | | | |
