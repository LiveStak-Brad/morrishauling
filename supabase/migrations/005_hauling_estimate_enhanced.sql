-- Hauling estimate enhancements: service level, travel miles, internal profit fields
alter table public.hauling_details add column if not exists service_level text default 'standard';
alter table public.hauling_details add column if not exists total_travel_miles numeric(10,2);
alter table public.hauling_details add column if not exists trailer_owned_or_rental text;
alter table public.hauling_details add column if not exists customer_pricing_breakdown jsonb not null default '[]'::jsonb;
alter table public.hauling_details add column if not exists internal_cost_breakdown jsonb not null default '[]'::jsonb;
alter table public.hauling_details add column if not exists estimated_profit numeric(12,2);
alter table public.hauling_details add column if not exists estimated_margin numeric(6,2);

alter table public.hauling_details drop constraint if exists hauling_details_service_level_check;
alter table public.hauling_details add constraint hauling_details_service_level_check
  check (service_level in ('economy', 'standard', 'priority', 'emergency'));
