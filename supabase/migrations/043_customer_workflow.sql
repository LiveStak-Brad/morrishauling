-- Customer-centered billing workflow: dual approval, payment allocations, integrity helpers.

alter table public.estimates
  add column if not exists internal_approved_at timestamptz,
  add column if not exists internal_approved_by text,
  add column if not exists internal_approval_note text,
  add column if not exists customer_approved_at timestamptz,
  add column if not exists is_current boolean not null default true,
  add column if not exists request_key text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_profile_id text,
  add column if not exists deletion_reason text;

-- Backfill customer_approved_at from accepted_at when present
update public.estimates
set customer_approved_at = accepted_at
where accepted_at is not null and customer_approved_at is null;

-- One current estimate per request_key when set
create index if not exists estimates_customer_current_idx
  on public.estimates(company_id, customer_id, is_current)
  where deleted_at is null and active = true;

create index if not exists estimates_request_key_idx
  on public.estimates(company_id, request_key)
  where request_key is not null and deleted_at is null;

alter table public.invoices
  add column if not exists job_completed_at timestamptz,
  add column if not exists requires_completion_proof boolean not null default true;

-- Payment allocations: one payment can cover multiple invoices
create table if not exists public.payment_allocations (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  payment_id text not null references public.payments(id) on delete cascade,
  invoice_id text not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

create index if not exists payment_allocations_payment_id_idx
  on public.payment_allocations(payment_id);
create index if not exists payment_allocations_invoice_id_idx
  on public.payment_allocations(invoice_id);

alter table public.payment_allocations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'payment_allocations' and policyname = 'payment_allocations_service_role'
  ) then
    create policy payment_allocations_service_role on public.payment_allocations
      for all using (true) with check (true);
  end if;
end $$;
