# Supabase — Morris Operations Database

## Required environment variables

| Variable | Required for | Where to find |
|----------|--------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase reads/writes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + RLS-scoped server reads | Supabase → Settings → API → `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | **All file uploads**, signed URLs, invoice PDFs, storage health tests | Supabase → Settings → API → `service_role` (server-only — never expose to browser) |
| `NEXT_PUBLIC_USE_SUPABASE` | Set `true` for production data | `.env.local` |

Without `SUPABASE_SERVICE_ROLE_KEY`, Admin → Settings will show database tables as OK but storage upload/signed-URL tests as **not tested**. Buckets may still exist in your Supabase project.

## Demo data (`DEMO_DATA`)

Set `DEMO_DATA=true` **only** when you want fake operational seed data (mock employees, simulated dispatch, mock command-center fallback). Normal local development with Supabase should leave this **unset** or `false`.

Verify locally:

```bash
node scripts/verify-storage-readiness.mjs
node scripts/smoke-test-production-workflows.mjs
```

## Storage buckets

Private buckets (signed URLs only):

- `job-photos` — booking + employee before/after photos
- `employee-documents` — employee uploads + profile avatars
- `applicant-documents` — resume, license, certifications
- `hr-documents` — company forms / policy PDFs (versioned)
- `invoice-pdfs` — generated invoice PDFs

Health: `GET /api/health/supabase` — per-table status + per-bucket upload/signed-URL probe (requires service role key).

## Migration 032 (document uploads)

Tables: `employee_document_uploads`, `applicant_documents`, `document_audit_log`  
Columns: `employees.avatar_storage_path`, `document_templates.storage_path`, `document_template_versions.storage_path`

Apply: `supabase/migrations/032_document_uploads_and_avatars.sql` (or `npm run db:migrate`)


### Core (001)
- `companies`, `profiles`, `jobs`, `invoices`, `payments`, `financing_requests`

### Operations (002)
- `customers`, `employees`
- `job_photos`, `job_notes`, `estimates`
- `trucks`, `trailers`, `dump_sites`, `service_areas`
- `routes`, `route_stops`, `job_assignments`
- `activity_log`, `notifications`, `company_settings`
- `financing_payments`

## Setup

1. Run **001** then **002** in Supabase SQL Editor (or `npm run db:migrate` if DB connection works)
2. `npm run db:seed`
3. Set `NEXT_PUBLIC_USE_SUPABASE=true` in `.env.local`
4. `npm run dev`

## Data layer

`lib/db/` — async functions with mock fallback when Supabase unavailable or `USE_SUPABASE=false`:

- Dashboards: `getCustomerDashboard`, `getAdminDashboard`, `getEmployeeDashboard`, `getPlannerDashboard`
- Jobs: `getJobs`, `getJobById`, `createJobFromBooking`, `updateJobStatus`, `assignJobToEmployee`
- Invoices/Payments: `getInvoices`, `getInvoiceById`, `createPayment`
- Financing: `getFinancingRequests`, `createFinancingRequest`, `approveFinancingRequest`, `denyFinancingRequest`
- Ops: `getDumpSites`, `getServiceAreas`, `getActivityLog`, `createRoute`, `updateRouteStop`

Client hydration: `GET /api/data/store?companyId=morris-hauling` → `DataHydrator`

Health: `GET /api/health/supabase` — per-table status

## Auth

Run **003_auth_profiles_rls.sql** after 002 to enable role-based RLS.

Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for server-side registration and writes.

Routes:
- `/login`, `/register` — customer self-registration
- `/account` — profile & sign out
- Protected: `/customer`, `/employee`, `/planner`, `/admin`

