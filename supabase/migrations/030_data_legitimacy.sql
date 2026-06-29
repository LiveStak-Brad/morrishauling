-- Remove fake operational seeds; production registry starts admin-controlled.

-- Equipment assets: clear fabricated inventory
delete from public.equipment_damage_reports where company_id = 'morris-hauling';
delete from public.equipment_checkout_events where company_id = 'morris-hauling';
delete from public.equipment_maintenance_logs where company_id = 'morris-hauling';
delete from public.equipment_assets where company_id = 'morris-hauling';

-- Optional placeholder — Morris may have one truck; admin edits or removes.
insert into public.equipment_assets (
  id, company_id, asset_id, name, category, condition, location, status, notes
) values (
  'ea-flagship-truck',
  'morris-hauling',
  'MH-FLAGSHIP',
  'Flagship Truck',
  'truck',
  'good',
  'Yard',
  'available',
  'Placeholder — update or retire when real fleet data is entered.'
) on conflict (id) do update set
  name = excluded.name,
  asset_id = excluded.asset_id,
  notes = excluded.notes;

-- Legacy catalog seeds (superseded by equipment_assets registry)
delete from public.equipment_assignments where company_id = 'morris-hauling'
  and catalog_item_id in ('eq-uniform', 'eq-key', 'eq-fuel', 'eq-dolly', 'eq-tablet');
delete from public.equipment_catalog where company_id = 'morris-hauling'
  and id in ('eq-uniform', 'eq-key', 'eq-fuel', 'eq-dolly', 'eq-tablet');

-- Sample job posting (admin creates real postings)
delete from public.job_postings where id = 'posting-driver' and company_id = 'morris-hauling';

-- Welcome announcement seed — admin posts real announcements
delete from public.company_announcements where id = 'ann-welcome' and company_id = 'morris-hauling';

-- Obsolete empty training course stubs (replaced by 024 curriculum)
delete from public.training_completions where course_id in ('tc-lift', 'tc-safety', 'tc-driving', 'tc-customer', 'tc-trailer');
delete from public.training_courses where id in ('tc-lift', 'tc-safety', 'tc-driving', 'tc-customer', 'tc-trailer')
  and company_id = 'morris-hauling'
  and id not in (select distinct course_id from public.training_lessons where company_id = 'morris-hauling');
