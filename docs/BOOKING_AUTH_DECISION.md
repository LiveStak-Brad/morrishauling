# Booking authentication decision

**Decision (P1): Option A — login required before submit**

## Rationale

Morris OS ties every job to a `customer_id` for portal access, invoices, payments, and photo permissions. Requiring authentication at submit avoids orphan jobs, duplicate customer records, and RLS gaps from guest sessions.

Guest booking (Option B) would need email verification, deduplication, and post-booking account linking — more surface area than we need for initial daily use.

## Current behavior

1. Customers can browse the booking wizard and build an estimate without signing in.
2. On **Confirm booking** / **Submit for review**, unauthenticated users are redirected to `/register?redirect=/book`.
3. Form fields (except photo files) are saved to `sessionStorage` under `morris:booking-draft` and restored after login/register.
4. After authentication, the customer completes submit; photos upload to Supabase Storage (`job-photos` bucket) via `POST /api/jobs/[id]/photos`.

## UX copy

The Review step shows an intentional notice explaining why an account is needed: job tracking, updates, payments, and photos.

## Future

If guest booking is needed later, implement Option B with explicit customer creation + invite flow without removing authenticated booking.
