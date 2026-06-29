-- Vendor relationship, favorites, and learning metrics for disposal facilities

alter table public.dump_sites add column if not exists is_preferred_vendor boolean not null default false;
alter table public.dump_sites add column if not exists is_favorite boolean not null default false;
alter table public.dump_sites add column if not exists vendor_rating numeric(3,2);
alter table public.dump_sites add column if not exists internal_notes text;
alter table public.dump_sites add column if not exists avg_wait_minutes integer;
alter table public.dump_sites add column if not exists avg_unload_minutes integer;

alter table public.disposal_events add column if not exists wait_minutes integer;
alter table public.disposal_events add column if not exists unload_minutes integer;
alter table public.disposal_events add column if not exists truck_operating_cost numeric(10,2);
alter table public.disposal_events add column if not exists labor_cost numeric(10,2);
