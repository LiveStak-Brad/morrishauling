-- Disposal receipt storage + actual profitability fields

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('disposal-receipts', 'disposal-receipts', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.junk_removal_details add column if not exists disposal_weight_ticket_url text;
alter table public.junk_removal_details add column if not exists actual_disposal_wait_minutes integer;
alter table public.junk_removal_details add column if not exists actual_disposal_unload_minutes integer;
alter table public.junk_removal_details add column if not exists actual_fuel_cost numeric(10,2);
alter table public.junk_removal_details add column if not exists actual_gross_profit numeric(10,2);
alter table public.junk_removal_details add column if not exists actual_profit_margin numeric(5,2);
alter table public.junk_removal_details add column if not exists recommended_disposal_site_id text;

alter table public.disposal_events add column if not exists weight_ticket_url text;

alter table public.dump_sites add column if not exists photo_storage_path text;
