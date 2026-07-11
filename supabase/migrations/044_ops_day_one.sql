-- Day-one ops: customer merge + operational photo stages
-- Run after 043_customer_workflow.sql

alter table public.customers
  add column if not exists merged_into_customer_id text references public.customers(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists merge_metadata jsonb;

create index if not exists customers_merged_into_idx
  on public.customers(company_id, merged_into_customer_id)
  where merged_into_customer_id is not null;

create index if not exists customers_archived_idx
  on public.customers(company_id, archived_at)
  where archived_at is not null;

-- Allow operational proof stages on job_photos.photo_type (photo_stage already exists).
alter table public.job_photos drop constraint if exists job_photos_photo_type_check;
alter table public.job_photos
  add constraint job_photos_photo_type_check check (
    photo_type in (
      'customer_upload',
      'before',
      'after',
      'damage',
      'dump_receipt',
      'arrival',
      'loaded_trailer',
      'disposal_proof',
      'pickup_condition',
      'securement',
      'loaded',
      'delivery',
      'exception',
      'other'
    )
  );
