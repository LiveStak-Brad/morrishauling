-- Disposal completion gate, skip flow, admin review, facility avoid flag

alter table public.junk_removal_details add column if not exists disposal_skip_reason text;
alter table public.junk_removal_details add column if not exists disposal_skip_notes text;
alter table public.junk_removal_details add column if not exists disposal_skipped_at timestamptz;
alter table public.junk_removal_details add column if not exists disposal_skipped_by text;
alter table public.junk_removal_details add column if not exists no_disposal_cost_reason text;
alter table public.junk_removal_details add column if not exists disposal_review_status text not null default 'pending'
  check (disposal_review_status in ('pending', 'approved', 'flagged', 'correction_requested'));

alter table public.junk_removal_details add column if not exists disposal_review_notes text;

alter table public.dump_sites add column if not exists is_avoid_vendor boolean not null default false;
