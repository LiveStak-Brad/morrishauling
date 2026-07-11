# Manual QA Checklist — Morris Services Prelaunch

**Audit date:** 2026-07-10  
**Environment:** https://www.morris-services.com (production) and/or local `npm run dev`  
**Rule:** Check the box only after you personally verify. Mark **Fail** with notes.

**Deployed commit to test against:** `1172a7719a804f7d8976d195a4dc5b5c71d053e4`

---

## Public

- [ ] `/` loads Morris Services parent branding (not only Hauling)
- [ ] Future divisions show Coming Soon and cannot be booked
- [ ] `/junk-removal` shows Launching Soon / prelaunch notes
- [ ] Breadcrumb or “Back to Morris Services” works from company pages
- [ ] `/hauling` redirects to `/junk-removal`
- [ ] `/services` shows planned services + prelaunch banner
- [ ] `/pricing` shows planned/prelaunch disclaimer (not live quotes)
- [ ] `/about` and `/contact` load; phone tap-to-call works on mobile
- [ ] `/book` says online booking coming soon (no live submit)
- [ ] `/book?preview=1` wizard runs; submit disabled / no job created
- [ ] No fake star ratings, review counts, or “licensed & insured” claims
- [ ] No same-day / same-week guarantee language
- [ ] No horizontal scroll at 375px and 390px on `/` and `/junk-removal`
- [ ] Hero image not cropped awkwardly on phone
- [ ] Hamburger nav works below `md`; desktop nav visible

## Careers

- [ ] `/careers` and `/careers/jobs` list roles
- [ ] Hiring mode badges readable (interest / hiring soon / future)
- [ ] Pay ranges clearly estimated / not guaranteed
- [ ] Job detail `/careers/jobs/[slug]` loads
- [ ] Apply form submits successfully for a test application
- [ ] Applicant document upload succeeds (PDF/JPG)
- [ ] Application appears in `/admin/hr/applicants` for owner
- [ ] Errors show useful message (not only blank fail)

## Customer

- [ ] `/register` creates account (note: copy still says “pay online” — treat as known issue)
- [ ] `/login` works for customer
- [ ] `/forgot-password` sends email; `/update-password` works via link
- [ ] Logged-out `/customer` redirects to login
- [ ] Dashboard loads without demo customer when `DEMO_DATA` unset
- [ ] Empty states look legitimate (no fake jobs)
- [ ] Job detail shows estimate/invoice when present
- [ ] Pay balance shows disabled / contact notice (not chargeable)
- [ ] Chat / Refer / Live tracking do not claim real functionality after click
- [ ] Invoice PDF opens only for own invoice

## Employee

- [ ] Owner/admin can staff-login
- [ ] Employee account linked to HR employee record
- [ ] `/employee` dashboard loads
- [ ] Clock in / clock out records punches
- [ ] Schedule and time-off request work
- [ ] Job page status updates save
- [ ] Photo upload works (before/after)
- [ ] Disposal recommend + complete + receipt upload on a test job
- [ ] Training course: lesson complete → quiz → certificate
- [ ] Documents sign / upload
- [ ] Equipment acknowledge / damage report
- [ ] Admin preview employee portal; exit restores admin access
- [ ] Employee number visible where expected

## Admin

- [ ] `/admin` redirects to login when logged out
- [ ] Mission Control loads without demo fallback
- [ ] After seed cleanup: KPIs are zero/empty (not fake revenue)
- [ ] Create customer + job via phone intake
- [ ] Estimate review approve/revise
- [ ] Schedule slot create/edit
- [ ] Create invoice; generate PDF; mark status
- [ ] Record cash/check payment only
- [ ] Card/ACH options blocked or labeled coming soon
- [ ] Financing approve/deny (if request exists)
- [ ] Fleet list shows real trucks only
- [ ] Settings / branding / terms / pricing save
- [ ] Data inspector **not** available in production (404)
- [ ] Create-test employee **not** available in production

## Planner

- [ ] `/planner` loads today’s jobs
- [ ] Assign crew works
- [ ] Optimize route is understood as approximate (not Maps traffic)
- [ ] Usable on tablet; note phone limitations

## Disposal

- [ ] Facility list shows 8 reference MO sites (or current real set)
- [ ] Create/edit facility fields (materials, hours, fees, avoid vendor)
- [ ] Recommend for job address returns ranked list
- [ ] Modes: cheapest / closest / fastest / profitable differ sensibly
- [ ] Complete disposal with cost + receipt
- [ ] $0 disposal requires reason
- [ ] Skip/override path works with notes
- [ ] Disposal review queue approve/flag
- [ ] Profit fields update after actual cost

## Invoices

- [ ] Manual invoice create links to customer/job
- [ ] PDF generates and signed URL opens
- [ ] Send/email placeholder rejected or clearly not emailed
- [ ] Void / mark paid behaviors correct
- [ ] Customer can open own PDF only

## Uploads

- [ ] Job photo MIME/size limits enforced
- [ ] Applicant docs PDF/JPG
- [ ] Employee docs
- [ ] Disposal receipt / weight ticket
- [ ] Invoice PDF storage
- [ ] Signed URLs expire (spot-check old link)

## Security

- [ ] `/api/data/store` without cookie → 401
- [ ] `/api/health/supabase` returns minimal JSON only
- [ ] `/api/jobs/create` without live flags → 401/403
- [ ] Customer cannot read another customer’s job by ID guessing
- [ ] Employee cannot access `/admin`
- [ ] Non-allowlisted email cannot keep admin role
- [ ] No secrets in browser Network tab response bodies beyond anon key

## Mobile (device matrix)

For each: 320 · 375 · 390 · 430 · 768 · 1024 · desktop

- [ ] Public home + hauling home
- [ ] Book + book preview
- [ ] Careers apply
- [ ] Login / register
- [ ] Customer dashboard
- [ ] Employee clock + job
- [ ] Admin jobs list
- [ ] Mission Control
- [ ] Planner
- [ ] Disposal completion + photo

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Owner | | | Pass / Fail |
| Tester | | | Pass / Fail |
