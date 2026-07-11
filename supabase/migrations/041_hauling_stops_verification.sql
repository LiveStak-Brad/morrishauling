-- Hauling intermediate stops + verification status round-trip
-- Run after 039_verified_addresses.sql

alter table public.hauling_details
  add column if not exists stops jsonb not null default '[]'::jsonb;

alter table public.hauling_details
  add column if not exists pickup_verification_status text
  check (
    pickup_verification_status is null
    or pickup_verification_status in ('verified', 'manual_override', 'unverified')
  );

alter table public.hauling_details
  add column if not exists delivery_verification_status text
  check (
    delivery_verification_status is null
    or delivery_verification_status in ('verified', 'manual_override', 'unverified')
  );

-- Backfill status from boolean flags without falsely verifying legacy rows
update public.hauling_details
set pickup_verification_status = case
  when pickup_verified = true and pickup_place_id is not null then 'verified'
  else 'unverified'
end
where pickup_verification_status is null;

update public.hauling_details
set delivery_verification_status = case
  when delivery_verified = true and delivery_place_id is not null then 'verified'
  else 'unverified'
end
where delivery_verification_status is null;

-- Legacy jobs: never mark free-text addresses as verified
update public.jobs
set address_verified = false,
    address_verification_status = coalesce(address_verification_status, 'unverified')
where address_place_id is null
  and (address_verified = true or address_verification_status = 'verified');

comment on column public.hauling_details.stops is
  'JSON array of verified intermediate stops: [{address,city,state,zip,line2,placeId,formattedAddress,lat,lng,verificationStatus,...}]';
