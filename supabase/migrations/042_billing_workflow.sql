-- Billing workflow: first-class estimates, versions, share tokens, invoice/payment enhancements.
-- Honest delivery states only — no fake sent/viewed/paid.

-- ---------------------------------------------------------------------------
-- Estimates: expand statuses + workflow columns
-- ---------------------------------------------------------------------------
alter table public.estimates drop constraint if exists estimates_status_check;

alter table public.estimates
  add column if not exists current_version int not null default 1,
  add column if not exists parent_estimate_id text references public.estimates(id) on delete set null,
  add column if not exists service_address jsonb not null default '{}'::jsonb,
  add column if not exists customer_notes text,
  add column if not exists internal_notes text,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists sent_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists converted_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists acceptance_method text,
  add column if not exists accepted_by text,
  add column if not exists acceptance_note text,
  add column if not exists delivery_status text not null default 'not_sent'
    check (delivery_status in ('not_sent', 'pending', 'delivered', 'failed', 'skipped')),
  add column if not exists delivery_error text,
  add column if not exists last_resent_at timestamptz,
  add column if not exists share_token_hash text,
  add column if not exists share_token_expires_at timestamptz,
  add column if not exists scheduled_service_date date,
  add column if not exists revision_reason text,
  add column if not exists active boolean not null default true;

alter table public.estimates
  add constraint estimates_status_check check (
    status in (
      'draft',
      'internal_review',
      'ready_to_send',
      'sent',
      'viewed',
      'accepted',
      'declined',
      'expired',
      'revised',
      'converted',
      'canceled'
    )
  );

create index if not exists estimates_customer_id_idx on public.estimates(customer_id);
create index if not exists estimates_status_idx on public.estimates(company_id, status);
create index if not exists estimates_share_token_hash_idx on public.estimates(share_token_hash)
  where share_token_hash is not null;

-- ---------------------------------------------------------------------------
-- Estimate versions (immutable snapshots after send)
-- ---------------------------------------------------------------------------
create table if not exists public.estimate_versions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  estimate_id text not null references public.estimates(id) on delete cascade,
  version_number int not null,
  created_by_profile_id text,
  previous_total numeric(12,2) not null default 0,
  new_total numeric(12,2) not null default 0,
  line_items jsonb not null default '[]'::jsonb,
  changed_line_items jsonb not null default '[]'::jsonb,
  revision_reason text,
  customer_notification_status text not null default 'not_sent'
    check (customer_notification_status in ('not_sent', 'pending', 'delivered', 'failed', 'skipped')),
  customer_acceptance_status text not null default 'pending'
    check (customer_acceptance_status in ('pending', 'accepted', 'declined', 'superseded')),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (estimate_id, version_number)
);

create index if not exists estimate_versions_estimate_id_idx
  on public.estimate_versions(estimate_id, version_number desc);

-- ---------------------------------------------------------------------------
-- On-site adjustments (require customer approval before work)
-- ---------------------------------------------------------------------------
create table if not exists public.estimate_adjustments (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  estimate_id text not null references public.estimates(id) on delete cascade,
  job_id text references public.jobs(id) on delete set null,
  status text not null default 'pending_approval'
    check (status in ('draft', 'pending_approval', 'approved', 'declined', 'canceled')),
  original_total numeric(12,2) not null default 0,
  adjustment_total numeric(12,2) not null default 0,
  new_total numeric(12,2) not null default 0,
  added_line_items jsonb not null default '[]'::jsonb,
  removed_line_item_ids jsonb not null default '[]'::jsonb,
  reason text not null,
  created_by_profile_id text,
  approved_at timestamptz,
  approval_method text,
  approved_by text,
  approval_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_adjustments_estimate_id_idx
  on public.estimate_adjustments(estimate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Invoices: expand statuses + workflow columns
-- ---------------------------------------------------------------------------
alter table public.invoices drop constraint if exists invoices_status_check;

alter table public.invoices
  add column if not exists estimate_id text references public.estimates(id) on delete set null,
  add column if not exists original_estimate_total numeric(12,2),
  add column if not exists approved_adjustments_total numeric(12,2) not null default 0,
  add column if not exists customer_notes text,
  add column if not exists internal_notes text,
  add column if not exists issue_date date,
  add column if not exists sent_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text,
  add column if not exists replaced_by_invoice_id text,
  add column if not exists replaces_invoice_id text,
  add column if not exists delivery_status text not null default 'not_sent'
    check (delivery_status in ('not_sent', 'pending', 'delivered', 'failed', 'skipped')),
  add column if not exists delivery_error text,
  add column if not exists share_token_hash text,
  add column if not exists share_token_expires_at timestamptz,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists line_items jsonb not null default '[]'::jsonb;

-- Backfill line_items from adjustments when empty
update public.invoices
set line_items = coalesce(adjustments, '[]'::jsonb)
where (line_items is null or line_items = '[]'::jsonb)
  and adjustments is not null;

alter table public.invoices
  add constraint invoices_status_check check (
    status in (
      'draft',
      'ready_to_send',
      'sent',
      'viewed',
      'partially_paid',
      'paid',
      'overdue',
      'void',
      'refunded',
      'disputed',
      'written_off',
      -- legacy aliases kept for existing rows
      'partial'
    )
  );

create index if not exists invoices_estimate_id_idx on public.invoices(estimate_id);
create index if not exists invoices_share_token_hash_idx on public.invoices(share_token_hash)
  where share_token_hash is not null;

-- ---------------------------------------------------------------------------
-- Payments: proof, reversal, receipt linkage
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists proof_url text,
  add column if not exists proof_storage_path text,
  add column if not exists reversed_at timestamptz,
  add column if not exists reversal_reason text,
  add column if not exists reversed_by_profile_id text,
  add column if not exists receipt_issued_at timestamptz,
  add column if not exists receipt_pdf_storage_path text,
  add column if not exists external_reference text,
  add column if not exists division_id text;

create index if not exists payments_customer_id_idx on public.payments(customer_id);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);

-- ---------------------------------------------------------------------------
-- Billing audit (immutable event log for financial workflow)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_audit_events (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_profile_id text,
  actor_role text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists billing_audit_events_entity_idx
  on public.billing_audit_events(entity_type, entity_id, created_at desc);
create index if not exists billing_audit_events_company_idx
  on public.billing_audit_events(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.estimate_versions enable row level security;
alter table public.estimate_adjustments enable row level security;
alter table public.billing_audit_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'estimate_versions' and policyname = 'estimate_versions_service_role'
  ) then
    create policy estimate_versions_service_role on public.estimate_versions
      for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'estimate_adjustments' and policyname = 'estimate_adjustments_service_role'
  ) then
    create policy estimate_adjustments_service_role on public.estimate_adjustments
      for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'billing_audit_events' and policyname = 'billing_audit_events_service_role'
  ) then
    create policy billing_audit_events_service_role on public.billing_audit_events
      for all using (true) with check (true);
  end if;
end $$;
