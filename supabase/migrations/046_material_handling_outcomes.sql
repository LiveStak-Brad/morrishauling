-- Customer-visible material handling outcomes recorded by staff (never auto-fabricated).
alter table public.junk_removal_details
  add column if not exists material_handling_outcomes jsonb not null default '[]'::jsonb;

comment on column public.junk_removal_details.material_handling_outcomes is
  'Staff-recorded lines: [{label, outcome}] for donation/recycling/disposal summary. Empty until recorded.';
