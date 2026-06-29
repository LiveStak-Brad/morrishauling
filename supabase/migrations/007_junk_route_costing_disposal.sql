-- Junk route costing and disposal selection fields

alter table public.junk_removal_details add column if not exists origin_base_id text;
alter table public.junk_removal_details add column if not exists origin_base_name text;
alter table public.junk_removal_details add column if not exists selected_disposal_site_id text;
alter table public.junk_removal_details add column if not exists selected_disposal_site_name text;
alter table public.junk_removal_details add column if not exists disposal_category text;
alter table public.junk_removal_details add column if not exists estimated_dispatch_miles numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_customer_to_disposal_miles numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_return_miles numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_total_route_miles numeric(10,2);
alter table public.junk_removal_details add column if not exists estimated_drive_minutes numeric(8,2);
alter table public.junk_removal_details add column if not exists minimums_applied text[] not null default '{}';
alter table public.junk_removal_details add column if not exists disposal_selection_reason text;
alter table public.junk_removal_details add column if not exists disposal_uncertain boolean not null default false;

alter table public.dump_sites add column if not exists per_item_fee numeric(10,2);
alter table public.dump_sites add column if not exists minimum_fee numeric(10,2) default 0;

alter table public.estimates add column if not exists route_cost_breakdown jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists disposal_breakdown jsonb not null default '[]'::jsonb;
