/**
 * Generates supabase/migrations/040_disposal_network_expansion.sql from the
 * verified TypeScript disposal network catalog.
 *
 * Run: node --import tsx scripts/generate-disposal-network-migration.mjs
 * Or: npx tsx scripts/generate-disposal-network-migration.mjs
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DISPOSAL_COVERAGE_COUNTIES } from "../lib/data/disposal-network/coverage-counties.ts";
import { VERIFIED_DISPOSAL_FACILITIES } from "../lib/data/disposal-network/facilities.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "supabase", "migrations", "040_disposal_network_expansion.sql");

function sqlStr(v) {
  if (v == null) return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlArr(arr) {
  if (!arr?.length) return "'{}'";
  const inner = arr.map((x) => `"${String(x).replace(/"/g, '\\"').replace(/'/g, "''")}"`).join(",");
  return `'{${inner}}'`;
}

function sqlJson(v) {
  if (v == null) return "'{}'::jsonb";
  return `${sqlStr(JSON.stringify(v))}::jsonb`;
}

function sqlNum(v) {
  if (v == null || Number.isNaN(v)) return "null";
  return String(v);
}

function sqlBool(v) {
  if (v == null) return "null";
  return v ? "true" : "false";
}

const obsoleteIds = [
  "ref-st-charles-recycle-works",
  "ref-wentzville-srf",
  "ref-lincoln-county-transfer",
  "ref-warren-county-sanitary",
  "ref-franklin-county-sanitary",
  "ref-jefferson-county-sanitary",
  "ref-o-fallon-waste",
  "ref-lake-st-louis-transfer",
];

const header = `-- Disposal network expansion: verified MO/IL facilities + expandable county registry
-- Generated from lib/data/disposal-network — do not invent tip fees; null pricing means call ahead.
-- Replaces incorrect 033 reference rows that did not match DNR / operator sources.

-- ---------------------------------------------------------------------------
-- Schema: expandable facility fields
-- ---------------------------------------------------------------------------
-- App + network catalog use per_item; original 002 check omitted it.
alter table public.dump_sites drop constraint if exists dump_sites_fee_type_check;
alter table public.dump_sites add constraint dump_sites_fee_type_check
  check (fee_type in ('flat', 'weight', 'volume', 'mixed', 'per_item'));

alter table public.dump_sites add column if not exists facility_type text;
alter table public.dump_sites add column if not exists commercial_accepted boolean;
alter table public.dump_sites add column if not exists appointment_required boolean not null default false;
alter table public.dump_sites add column if not exists residency_restriction text
  check (residency_restriction is null or residency_restriction in (
    'none', 'county_residents', 'city_residents', 'account_holders', 'unknown'
  ));
alter table public.dump_sites add column if not exists special_requirements text;
alter table public.dump_sites add column if not exists operational_notes text;
alter table public.dump_sites add column if not exists scale_available boolean;
alter table public.dump_sites add column if not exists payment_methods text[] not null default '{}';
alter table public.dump_sites add column if not exists public_pricing_notes text;
alter table public.dump_sites add column if not exists commercial_pricing_notes text;
alter table public.dump_sites add column if not exists pricing_unknown boolean not null default true;
alter table public.dump_sites add column if not exists verification_status text
  check (verification_status is null or verification_status in (
    'verified', 'partial', 'needs_call', 'needs_geocode'
  ));
alter table public.dump_sites add column if not exists verification_sources jsonb not null default '[]'::jsonb;
alter table public.dump_sites add column if not exists verified_at timestamptz;
alter table public.dump_sites add column if not exists pricing_verified_at timestamptz;
alter table public.dump_sites add column if not exists geocode_source text;

create index if not exists dump_sites_county_idx on public.dump_sites(company_id, state, county);
create index if not exists dump_sites_facility_type_idx on public.dump_sites(company_id, facility_type);
create index if not exists dump_sites_verification_idx on public.dump_sites(company_id, verification_status);

-- ---------------------------------------------------------------------------
-- Coverage counties (grow without redesign)
-- ---------------------------------------------------------------------------
create table if not exists public.disposal_coverage_counties (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  state text not null check (state in ('MO', 'IL')),
  county text not null,
  tier text not null check (tier in ('core', 'expansion', 'adjacent')),
  status text not null check (status in ('active', 'planned', 'no_local_msw_facility')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, state, county)
);

create index if not exists disposal_coverage_counties_company_idx
  on public.disposal_coverage_counties(company_id, state, tier);

alter table public.disposal_coverage_counties enable row level security;

drop policy if exists "disposal_coverage_counties_access" on public.disposal_coverage_counties;
create policy "disposal_coverage_counties_access" on public.disposal_coverage_counties for all
  using (company_id = current_setting('app.company_id', true))
  with check (company_id = current_setting('app.company_id', true));

-- ---------------------------------------------------------------------------
-- Remove incorrect legacy reference facilities
-- ---------------------------------------------------------------------------
delete from public.dump_sites
where company_id = 'morris-hauling'
  and id in (${obsoleteIds.map(sqlStr).join(", ")});

`;

const countyInserts = DISPOSAL_COVERAGE_COUNTIES.map((c) => {
  return `insert into public.disposal_coverage_counties (id, company_id, state, county, tier, status, notes, updated_at)
values (${sqlStr(c.id)}, 'morris-hauling', ${sqlStr(c.state)}, ${sqlStr(c.county)}, ${sqlStr(c.tier)}, ${sqlStr(c.status)}, ${sqlStr(c.notes ?? null)}, now())
on conflict (id) do update set
  state = excluded.state,
  county = excluded.county,
  tier = excluded.tier,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();`;
}).join("\n\n");

const facilityInserts = VERIFIED_DISPOSAL_FACILITIES.map((f) => {
  const pricingUnknown = f.perTonFee == null && f.baseFee == null;
  return `insert into public.dump_sites (
  id, company_id, name, address, city, state, zip, county,
  latitude, longitude, phone, website,
  facility_type, access_type, commercial_accepted, appointment_required, residency_restriction,
  hours_json, holiday_closures, accepted_materials, rejected_materials,
  special_requirements, operational_notes, notes, internal_notes,
  fee_type, base_fee, per_ton_fee, minimum_fee, pricing_unknown,
  public_pricing_notes, commercial_pricing_notes,
  weight_limit_tons, trailer_restrictions, truck_restrictions, max_load_size,
  scale_available, payment_methods,
  verification_status, verification_sources, verified_at, pricing_verified_at, geocode_source,
  status, is_closed, updated_at
) values (
  ${sqlStr(f.id)}, 'morris-hauling', ${sqlStr(f.name)}, ${sqlStr(f.address)}, ${sqlStr(f.city)}, ${sqlStr(f.state)}, ${sqlStr(f.zip)}, ${sqlStr(f.county)},
  ${sqlNum(f.latitude)}, ${sqlNum(f.longitude)}, ${sqlStr(f.phone ?? null)}, ${sqlStr(f.website ?? null)},
  ${sqlStr(f.facilityType)}, ${sqlStr(f.accessType)}, ${sqlBool(f.commercialAccepted)}, ${sqlBool(f.appointmentRequired)}, ${sqlStr(f.residencyRestriction)},
  ${sqlJson(f.hoursJson)}, ${sqlArr(f.holidayClosures)}::text[], ${sqlArr(f.acceptedMaterials)}::text[], ${sqlArr(f.rejectedMaterials)}::text[],
  ${sqlStr(f.specialRequirements ?? null)}, ${sqlStr(f.operationalNotes ?? null)}, ${sqlStr(f.operationalNotes ?? null)}, ${sqlStr(f.internalNotes ?? null)},
  ${sqlStr(f.feeType ?? "weight")}, ${sqlNum(f.baseFee ?? null)}, ${sqlNum(f.perTonFee ?? null)}, ${sqlNum(f.minimumFee ?? null)}, ${sqlBool(pricingUnknown)},
  ${sqlStr(f.publicPricingNotes ?? null)}, ${sqlStr(f.commercialPricingNotes ?? null)},
  ${sqlNum(f.weightLimitTons ?? null)}, ${sqlStr(f.trailerRestrictions ?? null)}, ${sqlStr(f.truckRestrictions ?? null)}, ${sqlStr(f.maxLoadSize ?? null)},
  ${sqlBool(f.scaleAvailable)}, ${sqlArr(f.paymentMethods ?? [])}::text[],
  ${sqlStr(f.verificationStatus)}, ${sqlJson(f.verificationSources)}, ${sqlStr(f.verifiedAt)}::timestamptz, ${f.pricingVerifiedAt ? `${sqlStr(f.pricingVerifiedAt)}::timestamptz` : "null"}, ${sqlStr(f.geocodeSource ?? null)},
  ${sqlStr(f.status)}, false, now()
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  zip = excluded.zip,
  county = excluded.county,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phone = excluded.phone,
  website = excluded.website,
  facility_type = excluded.facility_type,
  access_type = excluded.access_type,
  commercial_accepted = excluded.commercial_accepted,
  appointment_required = excluded.appointment_required,
  residency_restriction = excluded.residency_restriction,
  hours_json = excluded.hours_json,
  holiday_closures = excluded.holiday_closures,
  accepted_materials = excluded.accepted_materials,
  rejected_materials = excluded.rejected_materials,
  special_requirements = excluded.special_requirements,
  operational_notes = excluded.operational_notes,
  notes = excluded.notes,
  internal_notes = excluded.internal_notes,
  fee_type = excluded.fee_type,
  base_fee = excluded.base_fee,
  per_ton_fee = excluded.per_ton_fee,
  minimum_fee = excluded.minimum_fee,
  pricing_unknown = excluded.pricing_unknown,
  public_pricing_notes = excluded.public_pricing_notes,
  commercial_pricing_notes = excluded.commercial_pricing_notes,
  weight_limit_tons = excluded.weight_limit_tons,
  trailer_restrictions = excluded.trailer_restrictions,
  truck_restrictions = excluded.truck_restrictions,
  max_load_size = excluded.max_load_size,
  scale_available = excluded.scale_available,
  payment_methods = excluded.payment_methods,
  verification_status = excluded.verification_status,
  verification_sources = excluded.verification_sources,
  verified_at = excluded.verified_at,
  pricing_verified_at = excluded.pricing_verified_at,
  geocode_source = excluded.geocode_source,
  status = excluded.status,
  updated_at = now();`;
}).join("\n\n");

const sql = `${header}
-- ---------------------------------------------------------------------------
-- Seed coverage counties
-- ---------------------------------------------------------------------------
${countyInserts}

-- ---------------------------------------------------------------------------
-- Seed verified facilities (${VERIFIED_DISPOSAL_FACILITIES.length})
-- ---------------------------------------------------------------------------
${facilityInserts}
`;

writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Facilities: ${VERIFIED_DISPOSAL_FACILITIES.length}, counties: ${DISPOSAL_COVERAGE_COUNTIES.length}`);
