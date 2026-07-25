# Free Scrap Fridays

Customer request → admin approval → Friday route → crew completion → recycling ticket tracking.

## Migration

Apply `supabase/migrations/049_free_scrap_fridays.sql` in the Supabase SQL editor (or your usual migrate path).

Seeds:

- Program `default` (settings include internal `batteryRevenueDefault: 3`)
- Full scrap item catalog with default weights, route units, and item questions

## Public

- Landing + wizard: `/free-scrap-fridays`
- APIs under `/api/public/scrap-fridays/*` (catalog, check-address, requests, photos)

## Admin

- `/admin/scrap-fridays` — overview, requests, Fridays, route builder, recycling tickets, analytics
- APIs under `/api/admin/scrap-fridays/*`

## Crew

- `/employee/scrap-fridays` — published route stops, travel/arrive/complete actions
- API: `/api/employee/scrap-fridays/stops`

## Env

No new env vars. Reuses existing Supabase, Places, storage (`job-photos`), and notification providers. Service role key is required for public draft persistence (same pattern as guest estimates).

## Ops tips

1. Open an upcoming Friday date in Admin → Fridays.
2. Customers submit photo requests on the public page.
3. Approve / waitlist / request info from Requests.
4. Build stop order on Route builder and Publish.
5. Crew uses the employee Scrap Fridays view on Friday.
6. Enter recycling tickets after the yard unload.

Battery revenue defaults to $3 internally and is not shown publicly.
