-- Free Scrap Fridays — requests, items, routes, recycling, capacity

-- ---------------------------------------------------------------------------
-- Programs & Friday dates
-- ---------------------------------------------------------------------------
create table if not exists public.scrap_friday_programs (
  id text primary key default 'default',
  company_id text not null references public.companies(id) on delete cascade,
  name text not null default 'Free Scrap Fridays',
  active boolean not null default true,
  public_description text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrap_friday_dates (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  program_id text not null references public.scrap_friday_programs(id) on delete cascade,
  route_date date not null,
  status text not null default 'open'
    check (status in ('draft', 'open', 'full', 'closed', 'completed', 'cancelled')),
  active_zones jsonb not null default '{}'::jsonb,
  request_open_at timestamptz,
  request_close_at timestamptz,
  max_route_units numeric not null default 40,
  max_weight_lb numeric not null default 12000,
  max_volume_cuft numeric not null default 1200,
  max_labor_minutes integer not null default 480,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, route_date)
);

create index if not exists scrap_friday_dates_date_idx
  on public.scrap_friday_dates (company_id, route_date desc);

-- ---------------------------------------------------------------------------
-- Item catalog
-- ---------------------------------------------------------------------------
create table if not exists public.scrap_item_types (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null check (category in (
    'appliances', 'automotive', 'yard_outdoor', 'household', 'construction'
  )),
  active boolean not null default true,
  icon_key text,
  default_weight_lb numeric not null default 50,
  default_volume_cuft numeric not null default 8,
  default_stop_minutes integer not null default 15,
  default_route_units numeric not null default 1,
  default_equipment jsonb not null default '[]'::jsonb,
  default_crew_count integer not null default 2,
  customer_questions jsonb not null default '[]'::jsonb,
  eligibility_rules jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scrap_item_types_category_idx
  on public.scrap_item_types (company_id, category, sort_order);

-- ---------------------------------------------------------------------------
-- Pickup requests
-- ---------------------------------------------------------------------------
create table if not exists public.scrap_pickup_requests (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text references public.customers(id) on delete set null,
  scrap_friday_date_id uuid references public.scrap_friday_dates(id) on delete set null,
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'under_review', 'more_info_needed', 'approved',
    'waitlisted', 'scheduled', 'confirmed_by_customer', 'crew_en_route',
    'arrived', 'completed', 'declined', 'converted_to_paid', 'cancelled', 'no_show'
  )),
  first_name text,
  last_name text,
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text default 'MO',
  zip text,
  place_id text,
  latitude double precision,
  longitude double precision,
  service_area_outcome text,
  service_area_message text,
  availability jsonb not null default '{}'::jsonb,
  access jsonb not null default '{}'::jsonb,
  customer_notes text,
  internal_notes text,
  estimated_weight_lb numeric not null default 0,
  estimated_volume_cuft numeric not null default 0,
  estimated_stop_minutes integer not null default 0,
  difficulty_score integer not null default 0,
  suggested_crew_count integer not null default 2,
  suggested_equipment jsonb not null default '[]'::jsonb,
  route_units numeric not null default 0,
  junk_estimate_interest text check (
    junk_estimate_interest is null or junk_estimate_interest in ('yes', 'no', 'ask_on_arrival')
  ),
  junk_estimate_notes text,
  estimate_id text references public.estimates(id) on delete set null,
  detached_confirmed boolean not null default false,
  authority_confirmed boolean not null default false,
  photos_confirmed boolean not null default false,
  draft_payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scrap_pickup_requests_status_idx
  on public.scrap_pickup_requests (company_id, status, created_at desc);
create index if not exists scrap_pickup_requests_customer_idx
  on public.scrap_pickup_requests (customer_id);
create index if not exists scrap_pickup_requests_friday_idx
  on public.scrap_pickup_requests (scrap_friday_date_id);

create table if not exists public.scrap_pickup_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.scrap_pickup_requests(id) on delete cascade,
  item_type_id text references public.scrap_item_types(id) on delete set null,
  item_name_snapshot text not null,
  category text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 50),
  customer_estimated_weight_lb numeric,
  system_estimated_weight_lb numeric,
  weight_band text,
  dimensions jsonb not null default '{}'::jsonb,
  size_class text,
  location_on_property text,
  detached_confirmed boolean not null default false,
  empty_confirmed boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  unusually_heavy boolean not null default false,
  manual_review_required boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists scrap_pickup_items_request_idx
  on public.scrap_pickup_items (request_id);

create table if not exists public.scrap_pickup_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.scrap_pickup_requests(id) on delete cascade,
  item_id uuid references public.scrap_pickup_items(id) on delete set null,
  storage_path text not null,
  media_type text not null default 'photo' check (media_type in ('photo', 'video')),
  media_purpose text not null default 'overview'
    check (media_purpose in ('overview', 'closeup', 'access_path', 'ticket', 'before', 'after', 'other')),
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists scrap_pickup_media_request_idx
  on public.scrap_pickup_media (request_id);

-- ---------------------------------------------------------------------------
-- Routes & stops
-- ---------------------------------------------------------------------------
create table if not exists public.scrap_routes (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  scrap_friday_date_id uuid not null references public.scrap_friday_dates(id) on delete cascade,
  truck_id text references public.trucks(id) on delete set null,
  trailer_id text references public.trailers(id) on delete set null,
  assigned_driver_id text references public.employees(id) on delete set null,
  crew_employee_ids text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
  planned_mileage numeric,
  actual_mileage numeric,
  planned_weight_lb numeric,
  actual_weight_lb numeric,
  planned_route_units numeric,
  planned_labor_minutes integer,
  route_data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scrap_friday_date_id)
);

create table if not exists public.scrap_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.scrap_routes(id) on delete cascade,
  request_id uuid references public.scrap_pickup_requests(id) on delete set null,
  stop_type text not null default 'pickup'
    check (stop_type in ('pickup', 'recycling_unload', 'break', 'start', 'end')),
  stop_order integer not null default 0,
  planned_arrival_start timestamptz,
  planned_arrival_end timestamptz,
  actual_arrival timestamptz,
  actual_departure timestamptz,
  status text not null default 'pending' check (status in (
    'pending', 'confirmed', 'needs_reschedule', 'en_route', 'arrived',
    'in_progress', 'completed', 'unable', 'skipped', 'no_show', 'cancelled'
  )),
  actual_weight_lb numeric,
  actual_items jsonb not null default '[]'::jsonb,
  result text,
  paid_estimate_id text references public.estimates(id) on delete set null,
  paid_job_id text references public.jobs(id) on delete set null,
  customer_confirmation text check (
    customer_confirmation is null or customer_confirmation in (
      'pending', 'confirmed', 'needs_reschedule', 'cancelled', 'no_response'
    )
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scrap_route_stops_route_order_idx
  on public.scrap_route_stops (route_id, stop_order);

create table if not exists public.scrap_recycling_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  route_id uuid not null references public.scrap_routes(id) on delete cascade,
  recycling_center text,
  ticket_image_path text,
  material_type text,
  gross_weight_lb numeric,
  tare_weight_lb numeric,
  net_weight_lb numeric,
  scrap_revenue numeric not null default 0,
  battery_count integer not null default 0,
  battery_revenue numeric not null default 0,
  fuel_cost numeric not null default 0,
  labor_cost numeric not null default 0,
  other_costs numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed program + item types
-- ---------------------------------------------------------------------------
insert into public.scrap_friday_programs (id, company_id, name, active, public_description, settings)
values (
  'default',
  public.morris_company_id(),
  'Free Scrap Fridays',
  true,
  'We remove qualifying scrap metal from your property at no charge on Fridays — subject to photos, approval, and route capacity.',
  jsonb_build_object(
    'batteryRevenueDefault', 3,
    'requirePhoto', true,
    'defaultCrew', 2,
    'weightBands', jsonb_build_array(
      'under_50', '50_100', '100_200', '200_400', '400_700', 'over_700', 'unsure'
    )
  )
)
on conflict (id) do nothing;

-- Helper seed function via inserts
insert into public.scrap_item_types (
  id, company_id, name, category, default_weight_lb, default_volume_cuft,
  default_stop_minutes, default_route_units, default_equipment, default_crew_count,
  customer_questions, eligibility_rules, sort_order, icon_key
) values
  ('appliance-refrigerator', public.morris_company_id(), 'Refrigerator', 'appliances', 200, 45, 25, 2, '["appliance_dolly","ratchet_straps"]', 2,
    '[{"key":"empty","label":"Appliance is empty (no food/trash/chemicals)","type":"boolean","required":true},{"key":"size_class","label":"Size","type":"select","options":["mini","apartment","standard","large_commercial"],"required":true}]',
    '{"requiresEmpty":true,"requiresDetached":true}', 10, 'refrigerator'),
  ('appliance-freezer', public.morris_company_id(), 'Freezer', 'appliances', 180, 40, 25, 2, '["appliance_dolly","ratchet_straps"]', 2,
    '[{"key":"empty","label":"Appliance is empty","type":"boolean","required":true},{"key":"size_class","label":"Size","type":"select","options":["chest","upright_standard","large"],"required":true}]',
    '{"requiresEmpty":true,"requiresDetached":true}', 20, 'freezer'),
  ('appliance-stove', public.morris_company_id(), 'Stove / range', 'appliances', 150, 25, 20, 2, '["appliance_dolly"]', 2, '[]', '{"requiresDetached":true}', 30, 'stove'),
  ('appliance-washer', public.morris_company_id(), 'Washer', 'appliances', 170, 25, 20, 2, '["appliance_dolly"]', 2, '[]', '{"requiresDetached":true}', 40, 'washer'),
  ('appliance-dryer', public.morris_company_id(), 'Dryer', 'appliances', 130, 25, 20, 2, '["appliance_dolly"]', 2, '[]', '{"requiresDetached":true}', 50, 'dryer'),
  ('appliance-dishwasher', public.morris_company_id(), 'Dishwasher', 'appliances', 90, 20, 20, 2, '["appliance_dolly"]', 2, '[]', '{"requiresDetached":true}', 60, 'dishwasher'),
  ('appliance-microwave', public.morris_company_id(), 'Microwave', 'appliances', 40, 6, 10, 1, '[]', 2, '[]', '{"requiresDetached":true}', 70, 'microwave'),
  ('appliance-water-heater', public.morris_company_id(), 'Water heater', 'appliances', 120, 20, 25, 2, '["hand_truck","ratchet_straps"]', 2, '[]', '{"requiresDetached":true,"manualReview":true}', 80, 'water_heater'),
  ('appliance-window-ac', public.morris_company_id(), 'Window air conditioner', 'appliances', 70, 10, 15, 1, '[]', 2, '[]', '{"requiresDetached":true}', 90, 'window_ac'),
  ('appliance-other', public.morris_company_id(), 'Other metal appliance', 'appliances', 80, 15, 15, 1, '[]', 2, '[]', '{"requiresDetached":true}', 100, 'appliance'),

  ('auto-battery', public.morris_company_id(), 'Automotive battery', 'automotive', 40, 1, 8, 1, '[]', 2,
    '[{"key":"intact","label":"Battery is intact (not cracked, leaking, swollen, burned, or damaged)","type":"boolean","required":true}]',
    '{"battery":true}', 110, 'battery'),
  ('auto-lawn-battery', public.morris_company_id(), 'Lawn-equipment battery', 'automotive', 25, 1, 8, 1, '[]', 2,
    '[{"key":"intact","label":"Battery is intact","type":"boolean","required":true}]',
    '{"battery":true}', 120, 'battery'),
  ('auto-marine-battery', public.morris_company_id(), 'Marine battery', 'automotive', 50, 1, 8, 1, '[]', 2,
    '[{"key":"intact","label":"Battery is intact","type":"boolean","required":true}]',
    '{"battery":true}', 130, 'battery'),
  ('auto-rotors', public.morris_company_id(), 'Brake rotors', 'automotive', 30, 2, 10, 1, '[]', 2, '[]', '{}', 140, 'rotors'),
  ('auto-rims', public.morris_company_id(), 'Wheels / rims', 'automotive', 40, 4, 10, 1, '[]', 2, '[]', '{}', 150, 'rims'),
  ('auto-exhaust', public.morris_company_id(), 'Exhaust parts', 'automotive', 35, 4, 12, 1, '[]', 2, '[]', '{}', 160, 'exhaust'),
  ('auto-engine', public.morris_company_id(), 'Engine parts', 'automotive', 120, 8, 20, 2, '["hand_truck"]', 2, '[]', '{"manualReview":true}', 170, 'engine'),
  ('auto-transmission', public.morris_company_id(), 'Transmission', 'automotive', 150, 8, 25, 2, '["hand_truck","lifting_straps"]', 2, '[]', '{"manualReview":true}', 180, 'transmission'),
  ('auto-other', public.morris_company_id(), 'Other automotive metal parts', 'automotive', 50, 4, 12, 1, '[]', 2, '[]', '{}', 190, 'auto'),

  ('yard-push-mower', public.morris_company_id(), 'Push mower', 'yard_outdoor', 60, 10, 12, 1, '[]', 2, '[]', '{}', 200, 'mower'),
  ('yard-riding-mower', public.morris_company_id(), 'Riding mower', 'yard_outdoor', 400, 60, 35, 3, '["ramps","trailer","winch"]', 3, '[]', '{"manualReview":true}', 210, 'riding_mower'),
  ('yard-grill', public.morris_company_id(), 'Grill', 'yard_outdoor', 80, 15, 15, 1, '[]', 2, '[]', '{}', 220, 'grill'),
  ('yard-patio', public.morris_company_id(), 'Metal patio furniture', 'yard_outdoor', 50, 20, 15, 1, '[]', 2, '[]', '{}', 230, 'patio'),
  ('yard-fencing', public.morris_company_id(), 'Metal fencing', 'yard_outdoor', 100, 25, 20, 2, '["gloves"]', 2, '[]', '{"requiresDetached":true}', 240, 'fence'),
  ('yard-gates', public.morris_company_id(), 'Metal gates', 'yard_outdoor', 80, 15, 18, 2, '[]', 2, '[]', '{"requiresDetached":true}', 250, 'gate'),
  ('yard-lawn-equip', public.morris_company_id(), 'Metal lawn equipment', 'yard_outdoor', 45, 8, 12, 1, '[]', 2, '[]', '{}', 260, 'lawn'),
  ('yard-other', public.morris_company_id(), 'Other outdoor metal', 'yard_outdoor', 50, 10, 12, 1, '[]', 2, '[]', '{}', 270, 'outdoor'),

  ('house-bed-frame', public.morris_company_id(), 'Metal bed frame', 'household', 70, 20, 15, 1, '[]', 2, '[]', '{}', 280, 'bed'),
  ('house-filing', public.morris_company_id(), 'Filing cabinet', 'household', 90, 15, 15, 1, '["hand_truck"]', 2, '[]', '{}', 290, 'cabinet'),
  ('house-shelving', public.morris_company_id(), 'Metal shelving', 'household', 60, 20, 15, 1, '[]', 2, '[]', '{}', 300, 'shelving'),
  ('house-exercise', public.morris_company_id(), 'Exercise equipment', 'household', 150, 30, 25, 2, '["hand_truck"]', 2, '[]', '{"manualReview":true}', 310, 'exercise'),
  ('house-safe', public.morris_company_id(), 'Safe', 'household', 300, 10, 40, 3, '["appliance_dolly","lifting_straps","additional_crew"]', 3,
    '[{"key":"empty","label":"Safe is empty","type":"boolean","required":true},{"key":"unlocked","label":"Safe is unlocked","type":"boolean","required":true},{"key":"bolted","label":"Safe is bolted or attached","type":"boolean","required":true},{"key":"size_class","label":"Size","type":"select","options":["small","medium","large"],"required":true},{"key":"floor","label":"Floor / level","type":"text","required":true},{"key":"stairs","label":"Stairs involved","type":"boolean","required":true}]',
    '{"safe":true,"manualReview":true,"requiresDetached":true}', 320, 'safe'),
  ('house-furniture', public.morris_company_id(), 'Metal furniture', 'household', 60, 15, 15, 1, '[]', 2, '[]', '{}', 330, 'furniture'),
  ('house-other', public.morris_company_id(), 'Other household metal', 'household', 40, 8, 12, 1, '[]', 2, '[]', '{}', 340, 'household'),

  ('const-steel', public.morris_company_id(), 'Steel', 'construction', 100, 15, 15, 2, '[]', 2, '[{"key":"size_class","label":"Pile size","type":"select","options":["small","pickup","larger_than_pickup"],"required":false}]', '{}', 350, 'steel'),
  ('const-aluminum', public.morris_company_id(), 'Aluminum', 'construction', 40, 12, 12, 1, '[]', 2, '[]', '{}', 360, 'aluminum'),
  ('const-copper', public.morris_company_id(), 'Copper', 'construction', 20, 4, 10, 1, '[]', 2, '[]', '{}', 370, 'copper'),
  ('const-pipe', public.morris_company_id(), 'Pipe', 'construction', 60, 10, 12, 1, '[]', 2, '[]', '{}', 380, 'pipe'),
  ('const-rebar', public.morris_company_id(), 'Rebar', 'construction', 80, 10, 12, 1, '[]', 2, '[]', '{}', 390, 'rebar'),
  ('const-sheet', public.morris_company_id(), 'Sheet metal', 'construction', 70, 15, 15, 1, '[]', 2, '[]', '{}', 400, 'sheet'),
  ('const-pile', public.morris_company_id(), 'Scrap pile', 'construction', 400, 60, 35, 3, '["trailer"]', 2,
    '[{"key":"size_class","label":"Pile size","type":"select","options":["small","pickup","larger_than_pickup"],"required":true}]',
    '{"manualReview":true}', 410, 'pile'),
  ('const-other', public.morris_company_id(), 'Other construction metal', 'construction', 80, 12, 15, 1, '[]', 2, '[]', '{}', 420, 'construction')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.scrap_friday_programs enable row level security;
alter table public.scrap_friday_dates enable row level security;
alter table public.scrap_item_types enable row level security;
alter table public.scrap_pickup_requests enable row level security;
alter table public.scrap_pickup_items enable row level security;
alter table public.scrap_pickup_media enable row level security;
alter table public.scrap_routes enable row level security;
alter table public.scrap_route_stops enable row level security;
alter table public.scrap_recycling_tickets enable row level security;

create policy "scrap_programs_public_read" on public.scrap_friday_programs
  for select using (active = true and company_id = public.morris_company_id());
create policy "scrap_programs_admin" on public.scrap_friday_programs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "scrap_dates_public_read" on public.scrap_friday_dates
  for select using (company_id = public.morris_company_id() and status in ('open', 'full'));
create policy "scrap_dates_staff" on public.scrap_friday_dates
  for all using (public.is_staff() and company_id = public.morris_company_id())
  with check (public.is_staff() and company_id = public.morris_company_id());

create policy "scrap_items_public_read" on public.scrap_item_types
  for select using (active = true and company_id = public.morris_company_id());
create policy "scrap_items_admin" on public.scrap_item_types
  for all using (public.is_admin()) with check (public.is_admin());

create policy "scrap_requests_customer_select" on public.scrap_pickup_requests
  for select using (
    company_id = public.morris_company_id()
    and (
      public.is_staff()
      or (customer_id is not null and customer_id = public.my_customer_id())
    )
  );
create policy "scrap_requests_customer_insert" on public.scrap_pickup_requests
  for insert with check (company_id = public.morris_company_id());
create policy "scrap_requests_customer_update" on public.scrap_pickup_requests
  for update using (
    company_id = public.morris_company_id()
    and (
      public.is_staff()
      or (
        customer_id = public.my_customer_id()
        and status in ('draft', 'more_info_needed', 'submitted')
      )
    )
  );
create policy "scrap_requests_admin_all" on public.scrap_pickup_requests
  for all using (public.is_admin() or public.is_planner_or_admin())
  with check (public.is_admin() or public.is_planner_or_admin());

create policy "scrap_pickup_items_access" on public.scrap_pickup_items
  for all using (
    exists (
      select 1 from public.scrap_pickup_requests r
      where r.id = request_id
        and r.company_id = public.morris_company_id()
        and (public.is_staff() or r.customer_id = public.my_customer_id())
    )
  )
  with check (
    exists (
      select 1 from public.scrap_pickup_requests r
      where r.id = request_id and r.company_id = public.morris_company_id()
    )
  );

create policy "scrap_pickup_media_access" on public.scrap_pickup_media
  for all using (
    exists (
      select 1 from public.scrap_pickup_requests r
      where r.id = request_id
        and r.company_id = public.morris_company_id()
        and (public.is_staff() or r.customer_id = public.my_customer_id())
    )
  )
  with check (
    exists (
      select 1 from public.scrap_pickup_requests r
      where r.id = request_id and r.company_id = public.morris_company_id()
    )
  );

create policy "scrap_routes_staff" on public.scrap_routes
  for all using (public.is_staff() and company_id = public.morris_company_id())
  with check (public.is_staff() and company_id = public.morris_company_id());

create policy "scrap_route_stops_staff" on public.scrap_route_stops
  for all using (
    exists (
      select 1 from public.scrap_routes r
      where r.id = route_id and r.company_id = public.morris_company_id() and public.is_staff()
    )
  )
  with check (
    exists (
      select 1 from public.scrap_routes r
      where r.id = route_id and r.company_id = public.morris_company_id() and public.is_staff()
    )
  );

create policy "scrap_tickets_staff" on public.scrap_recycling_tickets
  for all using (public.is_staff() and company_id = public.morris_company_id())
  with check (public.is_staff() and company_id = public.morris_company_id());
