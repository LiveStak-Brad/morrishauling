-- Real reference disposal facilities for Morris Hauling service area.
-- Reference data (not customer business records). Removes fake seed dump IDs when present.

delete from public.dump_sites
where company_id = 'morris-hauling'
  and (
    id like 'dump-m%'
    or id in ('dump-warren-county', 'dump-foristell', 'dump-danville-yard', 'dump-lincoln-recycle', 'dump-st-charles')
    or name ilike '%morris storage%'
    or address ilike '%transfer way%'
  );

insert into public.dump_sites (
  id, company_id, name, address, city, state, zip,
  latitude, longitude, phone, accepted_materials, fee_type,
  base_fee, per_ton_fee, minimum_fee, hours_json, notes, status
) values
(
  'ref-st-charles-recycle-works', 'morris-hauling',
  'St. Charles County Recycle Works', '60 Earth Way', 'St. Charles', 'MO', '63301',
  38.7892, -90.5158, '(636) 949-1800',
  array['general_junk','construction_debris','yard_waste','bulky_special'],
  'mixed', 52, 42, 45,
  '{"mon":"7:30 AM – 4:30 PM","tue":"7:30 AM – 4:30 PM","wed":"7:30 AM – 4:30 PM","thu":"7:30 AM – 4:30 PM","fri":"7:30 AM – 4:30 PM","sat":"7:30 AM – 12:00 PM","sun":"Closed"}'::jsonb,
  'County facility — verify commercial hauler requirements and current rate sheet.', 'active'
),
(
  'ref-wentzville-srf', 'morris-hauling',
  'Wentzville Transfer Station (SRF)', '1395 W Meyer Rd', 'Wentzville', 'MO', '63385',
  38.8124, -90.8521, '(636) 327-3327',
  array['general_junk','construction_debris','yard_waste'],
  'mixed', 48, 38, 40,
  '{"mon":"7:00 AM – 4:00 PM","tue":"7:00 AM – 4:00 PM","wed":"7:00 AM – 4:00 PM","thu":"7:00 AM – 4:00 PM","fri":"7:00 AM – 4:00 PM","sat":"Closed","sun":"Closed"}'::jsonb,
  'Western St. Charles County reference site.', 'active'
),
(
  'ref-lincoln-county-transfer', 'morris-hauling',
  'Lincoln County Transfer Station', '75 County Road 622', 'Troy', 'MO', '63379',
  38.9795, -90.9782, '(636) 528-6117',
  array['general_junk','yard_waste','construction_debris'],
  'flat', 35, null, 30,
  '{"mon":"8:00 AM – 4:00 PM","tue":"8:00 AM – 4:00 PM","wed":"8:00 AM – 4:00 PM","thu":"8:00 AM – 4:00 PM","fri":"8:00 AM – 4:00 PM","sat":"8:00 AM – 12:00 PM","sun":"Closed"}'::jsonb,
  'Lincoln County reference transfer.', 'active'
),
(
  'ref-warren-county-sanitary', 'morris-hauling',
  'Warren County Sanitary Landfill', '26665 Highway U', 'Warrenton', 'MO', '63383',
  38.8231, -91.1402, '(636) 456-3478',
  array['general_junk','construction_debris','yard_waste','bulky_special'],
  'mixed', 45, 36, 40,
  '{"mon":"7:00 AM – 4:00 PM","tue":"7:00 AM – 4:00 PM","wed":"7:00 AM – 4:00 PM","thu":"7:00 AM – 4:00 PM","fri":"7:00 AM – 4:00 PM","sat":"7:00 AM – 12:00 PM","sun":"Closed"}'::jsonb,
  'Warren County primary landfill reference.', 'active'
),
(
  'ref-franklin-county-sanitary', 'morris-hauling',
  'Franklin County Sanitary Landfill', '4024 East Main Street', 'Union', 'MO', '63084',
  38.4401, -91.0084, '(636) 583-8470',
  array['general_junk','construction_debris','yard_waste'],
  'mixed', 50, 40, 45,
  '{"mon":"7:00 AM – 4:00 PM","tue":"7:00 AM – 4:00 PM","wed":"7:00 AM – 4:00 PM","thu":"7:00 AM – 4:00 PM","fri":"7:00 AM – 4:00 PM","sat":"7:00 AM – 12:00 PM","sun":"Closed"}'::jsonb,
  'Franklin County landfill reference.', 'active'
),
(
  'ref-jefferson-county-sanitary', 'morris-hauling',
  'Jefferson County Sanitary Landfill', '6355 Hillsboro House Springs Road', 'House Springs', 'MO', '63051',
  38.4098, -90.5531, '(636) 797-9900',
  array['general_junk','construction_debris','yard_waste','bulky_special'],
  'mixed', 55, 42, 48,
  '{"mon":"7:00 AM – 4:00 PM","tue":"7:00 AM – 4:00 PM","wed":"7:00 AM – 4:00 PM","thu":"7:00 AM – 4:00 PM","fri":"7:00 AM – 4:00 PM","sat":"7:00 AM – 12:00 PM","sun":"Closed"}'::jsonb,
  'Jefferson County landfill reference.', 'active'
),
(
  'ref-o-fallon-waste', 'morris-hauling',
  'City of O''Fallon Recycling Center', '1576 O''Fallon Commerce Drive', 'O''Fallon', 'MO', '63366',
  38.7831, -90.7178, '(636) 379-5606',
  array['yard_waste','general_junk','scrap_metal'],
  'flat', 30, null, 25,
  '{"mon":"Closed","tue":"9:00 AM – 5:00 PM","wed":"9:00 AM – 5:00 PM","thu":"9:00 AM – 5:00 PM","fri":"9:00 AM – 5:00 PM","sat":"9:00 AM – 3:00 PM","sun":"Closed"}'::jsonb,
  'City recycling center — confirm C&D acceptance before routing.', 'active'
),
(
  'ref-lake-st-louis-transfer', 'morris-hauling',
  'Lake St. Louis C&D Disposal (Regional Transfer)', '100 Lake Village Blvd', 'Lake St. Louis', 'MO', '63367',
  38.7975, -90.7856, '(636) 561-4800',
  array['construction_debris','general_junk','bulky_special'],
  'mixed', 58, 45, 50,
  '{}'::jsonb,
  'Regional C&D reference — confirm current operator and tipping agreement.', 'active'
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  zip = excluded.zip,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phone = excluded.phone,
  accepted_materials = excluded.accepted_materials,
  fee_type = excluded.fee_type,
  base_fee = excluded.base_fee,
  per_ton_fee = excluded.per_ton_fee,
  minimum_fee = excluded.minimum_fee,
  hours_json = excluded.hours_json,
  notes = excluded.notes,
  status = excluded.status,
  updated_at = now();
