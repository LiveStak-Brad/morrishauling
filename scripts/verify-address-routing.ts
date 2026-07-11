/**
 * Address validation + junk/hauling routing scenarios.
 * Usage: npm run verify:address-routing
 *
 * Live Google cases require GOOGLE_MAPS_API_KEY.
 * Offline cases always run.
 */
import assert from "node:assert/strict";
import {
  hasStreetNumber,
  looksLikePoBox,
  isAddressVerified,
  normalizeServiceAreaOutcome,
  type VerifiedAddress,
} from "../types/address";
import { assessServiceArea, getPrimaryOperatingBase } from "../lib/geo/service-area";
import { resolveVerifiedAddress } from "../lib/geo/resolve-verified";
import { planJunkRoute } from "../lib/junk/plan-route";
import { planHaulingRoute, toRouteMetrics } from "../lib/hauling/plan-route";
import { RouteCalculationError } from "../lib/geo/types";
import { morrisConfig } from "../lib/morris-config";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeVerified(
  partial: Partial<VerifiedAddress> & Pick<VerifiedAddress, "lat" | "lng" | "zip">
): VerifiedAddress {
  return {
    line1: partial.line1 ?? "100 Test St",
    line2: partial.line2,
    city: partial.city ?? "Warrenton",
    state: partial.state ?? "MO",
    zip: partial.zip,
    country: partial.country ?? "US",
    formattedAddress: partial.formattedAddress ?? "100 Test St, Warrenton, MO",
    lat: partial.lat,
    lng: partial.lng,
    placeId: partial.placeId ?? "test-place",
    verificationStatus: partial.verificationStatus ?? "verified",
    provider: partial.provider ?? "google_places",
    verifiedAt: partial.verifiedAt ?? new Date().toISOString(),
  };
}

async function main() {
  console.log("=== Operating base canonical ===");
  const base = getPrimaryOperatingBase();
  assert.match(base.address ?? "", /607/i);
  assert.equal(base.zip, "63383");
  assert.ok(base.placeId, "Primary base should have a Google placeId");
  assert.equal(morrisConfig.yardLocation.lat, base.location.lat);
  assert.equal(morrisConfig.serviceArea.center.lat, base.location.lat);
  console.log(`  ${base.formattedAddress ?? base.address} @ ${base.location.lat}, ${base.location.lng}`);

  console.log("=== Offline address heuristics ===");
  assert.equal(looksLikePoBox("PO Box 123"), true);
  assert.equal(looksLikePoBox("P.O. Box 99"), true);
  assert.equal(looksLikePoBox("607 South State Highway 47"), false);
  assert.equal(hasStreetNumber("607 South State Highway 47"), true);
  assert.equal(hasStreetNumber("Warrenton"), false);
  assert.equal(hasStreetNumber("63383"), false);

  const unverified = fakeVerified({
    lat: 38.8,
    lng: -91.14,
    zip: "63383",
    verificationStatus: "unverified",
    placeId: "",
  });
  assert.equal(isAddressVerified(unverified), false);

  console.log("=== Service area taxonomy ===");
  const inArea = assessServiceArea({
    lat: base.location.lat,
    lng: base.location.lng,
    zip: "63383",
    country: "US",
  });
  assert.equal(normalizeServiceAreaOutcome(inArea.outcome), "standard");

  const springfield = assessServiceArea({
    lat: 37.209,
    lng: -93.292,
    zip: "65806",
    country: "US",
  });
  assert.ok(
    ["extended", "manual_review", "unsupported"].includes(
      normalizeServiceAreaOutcome(springfield.outcome)
    )
  );
  assert.ok(springfield.requiresReview);

  const nonUs = assessServiceArea({
    lat: 45.5,
    lng: -73.5,
    zip: "H2X",
    country: "CA",
  });
  assert.equal(normalizeServiceAreaOutcome(nonUs.outcome), "unsupported");

  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    console.log("\n(Skipping live Google scenarios — set GOOGLE_MAPS_API_KEY to run them.)");
    console.log("✓ Offline address routing checks passed.");
    return;
  }

  console.log("\n=== Live: residential / commercial / apartment ===");
  const residential = await resolveVerifiedAddress({
    street: "200 E Main St",
    city: "Warrenton",
    state: "MO",
    zip: "63383",
  });
  assert.ok(isAddressVerified(residential));
  await sleep(250);

  const commercial = await resolveVerifiedAddress({
    street: "607 South State Highway 47",
    city: "Warrenton",
    state: "MO",
    zip: "63383",
  });
  assert.ok(isAddressVerified(commercial));
  assert.equal(commercial.zip, "63383");
  await sleep(250);

  const apt = await resolveVerifiedAddress({
    street: "200 E Main St",
    city: "Warrenton",
    state: "MO",
    zip: "63383",
    line2: "Apt 2B",
  });
  assert.equal(apt.line2, "Apt 2B");
  await sleep(250);

  console.log("=== Live: High Ridge / St. Charles ===");
  const highRidge = await resolveVerifiedAddress({
    street: "2900 High Ridge Blvd",
    city: "High Ridge",
    state: "MO",
    zip: "63049",
  });
  await sleep(250);
  const stCharles = await resolveVerifiedAddress({
    street: "200 N Main St",
    city: "Saint Charles",
    state: "MO",
    zip: "63301",
  });
  await sleep(250);

  console.log("=== Live: reject city-only / manipulated coords ===");
  let cityOnlyBlocked = false;
  try {
    await resolveVerifiedAddress({
      street: "",
      city: "Warrenton",
      state: "MO",
      zip: "63383",
    });
  } catch (e) {
    cityOnlyBlocked = e instanceof RouteCalculationError;
  }
  assert.ok(cityOnlyBlocked, "City-only must be blocked");

  let coordTamperBlocked = false;
  try {
    const { verifyPlaceId } = await import("../lib/geo/verify-place");
    await verifyPlaceId(residential.placeId, {
      lat: residential.lat + 0.05,
      lng: residential.lng + 0.05,
    });
  } catch (e) {
    coordTamperBlocked = e instanceof RouteCalculationError;
  }
  assert.ok(coordTamperBlocked, "Manipulated coordinates must be rejected");

  console.log("=== Live: junk Base→Customer (disposal system inserts dump) ===");
  const junkNear = await planJunkRoute({ customer: residential });
  await sleep(250);
  const junkFar = await planJunkRoute({
    customer: await resolveVerifiedAddress({
      street: "1001 E Broadway",
      city: "Columbia",
      state: "MO",
      zip: "65201",
    }),
  });
  assert.ok(junkNear.totalRouteMiles > 0);
  assert.ok(junkFar.totalRouteMiles > junkNear.totalRouteMiles + 20);
  console.log(
    `  near=${junkNear.totalRouteMiles} mi dump=${junkNear.dump?.name ?? "pending"}; far=${junkFar.totalRouteMiles}`
  );

  console.log("=== Live: hauling same-address reject + multi-stop ===");
  let sameBlocked = false;
  try {
    await planHaulingRoute({
      pickup: residential,
      delivery: residential,
      reverify: false,
    });
  } catch (e) {
    sameBlocked = e instanceof RouteCalculationError;
  }
  assert.ok(sameBlocked);

  const multi = await planHaulingRoute({
    pickup: residential,
    stops: [highRidge],
    delivery: stCharles,
    reverify: false,
  });
  const metrics = toRouteMetrics(multi);
  assert.ok(metrics.loadedMiles > 0);
  assert.ok((metrics.stopCount ?? 0) === 1);
  assert.ok((metrics.positioningMiles ?? 0) > 0);
  assert.ok((metrics.returnMiles ?? 0) > 0);
  console.log(
    `  multi-stop total=${metrics.totalTravelMiles} loaded=${metrics.loadedMiles} deadhead=${metrics.deadheadMiles}`
  );

  console.log("=== Live: High Ridge ↔ Warrenton distinct ===");
  const a = await planHaulingRoute({
    pickup: residential,
    delivery: highRidge,
    reverify: false,
  });
  await sleep(250);
  const b = await planHaulingRoute({
    pickup: highRidge,
    delivery: residential,
    reverify: false,
  });
  assert.notEqual(a.totalTravelMiles, b.loadedMiles); // not a strict equality check on totals
  assert.ok(Math.abs(a.loadedMiles - b.loadedMiles) < 5, "Loaded miles should be similar either direction");
  assert.ok(a.totalTravelMiles > 0 && b.totalTravelMiles > 0);

  console.log("\n✓ Address routing scenarios passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
