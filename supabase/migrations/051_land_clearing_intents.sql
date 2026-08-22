-- Land-clearing intents, project transformation fields, public equipment visibility.
-- Intake extras (goals, work areas, lead score) live in equipment_intake_details.intake jsonb.

alter table public.equipment_assets
  add column if not exists publicly_visible boolean not null default false;

alter table public.equipment_intake_details
  add column if not exists lead_completeness_score integer,
  add column if not exists acreage_source text
    check (acreage_source is null or acreage_source in ('customer_entered', 'map_calculated', 'onsite_verified')),
  add column if not exists work_areas jsonb not null default '[]'::jsonb;

alter table public.published_projects
  add column if not exists property_use text,
  add column if not exists clearing_style text,
  add column if not exists vegetation_density text,
  add column if not exists vegetation_types text,
  add column if not exists preserved_features text,
  add column if not exists approximate_acres numeric(10,2),
  add column if not exists verified_acres numeric(10,2);

insert into public.service_catalog (id, company_id, division_id, slug, name, status, publicly_listed, sort_order)
values
  ('svc-selective', 'morris-hauling', 'land_clearing', 'selective-clearing', 'Selective Clearing / Tree Thinning', 'accepting_estimates', true, 95),
  ('svc-pasture', 'morris-hauling', 'land_clearing', 'pasture-field-reclamation', 'Pasture & Field Reclamation', 'accepting_estimates', true, 96),
  ('svc-hunting', 'morris-hauling', 'land_clearing', 'hunting-property-clearing', 'Hunting Property Clearing', 'accepting_estimates', true, 97),
  ('svc-park-like', 'morris-hauling', 'land_clearing', 'park-like-clearing', 'Park-Like Property Clearing', 'accepting_estimates', false, 101),
  ('svc-food-plot', 'morris-hauling', 'land_clearing', 'food-plot-area', 'Food Plot Area Clearing', 'accepting_estimates', false, 102),
  ('svc-encroachment', 'morris-hauling', 'land_clearing', 'road-field-encroachment', 'Road / Field Encroachment Clearing', 'accepting_estimates', false, 103),
  ('svc-pond-access', 'morris-hauling', 'land_clearing', 'pond-lake-access', 'Pond / Lake Access Clearing', 'accepting_estimates', false, 104),
  ('svc-homesite-veg', 'morris-hauling', 'land_clearing', 'home-site-vegetation', 'Home-Site Vegetation Clearing', 'accepting_estimates', false, 105),
  ('svc-re-cleanup', 'morris-hauling', 'land_clearing', 'real-estate-cleanup', 'Real-Estate Property Cleanup', 'accepting_estimates', false, 106)
on conflict (id) do nothing;

insert into public.service_capability_links (service_id, capability_id)
values
  ('svc-selective', 'cap-ctl-mulcher'),
  ('svc-pasture', 'cap-ctl-mulcher'),
  ('svc-pasture', 'cap-ctl-grapple'),
  ('svc-hunting', 'cap-ctl-mulcher'),
  ('svc-park-like', 'cap-ctl-mulcher'),
  ('svc-food-plot', 'cap-ctl-mulcher'),
  ('svc-encroachment', 'cap-ctl-mulcher'),
  ('svc-pond-access', 'cap-ctl-mulcher'),
  ('svc-homesite-veg', 'cap-ctl-mulcher'),
  ('svc-homesite-veg', 'cap-ctl-grapple'),
  ('svc-re-cleanup', 'cap-ctl-mulcher'),
  ('svc-re-cleanup', 'cap-ctl-grapple')
on conflict do nothing;
