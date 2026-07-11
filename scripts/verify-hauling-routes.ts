/**
 * Verify hauling routes produce meaningfully different mileage/pricing from the
 * primary operating base (607 S State Hwy 47, Warrenton).
 * Usage: npx tsx scripts/verify-hauling-routes.ts
 *
 * Requires GOOGLE_MAPS_API_KEY (Geocoding + Places Details + Directions).
 */
import assert from "node:assert/strict";
import { planHaulingRoute, toRouteMetrics } from "../lib/hauling/plan-route";
import { haulingTransportEngine } from "../lib/estimate/hauling-transport-engine";
import { morrisConfig } from "../lib/morris-config";
import { resolveVerifiedAddress } from "../lib/geo/resolve-verified";
import { getPrimaryOperatingBase } from "../lib/geo/service-area";

const SCENARIOS = [
  {
    name: "Warrenton → Warrenton",
    pickup: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { street: "500 Steinhagen Rd", city: "Warrenton", state: "MO", zip: "63383" },
  },
  {
    name: "Warrenton → High Ridge",
    pickup: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { street: "2900 High Ridge Blvd", city: "High Ridge", state: "MO", zip: "63049" },
  },
  {
    name: "High Ridge → Warrenton",
    pickup: { street: "2900 High Ridge Blvd", city: "High Ridge", state: "MO", zip: "63049" },
    delivery: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
  },
  {
    name: "Warrenton → St. Charles",
    pickup: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { street: "200 N Main St", city: "Saint Charles", state: "MO", zip: "63301" },
  },
  {
    name: "Warrenton → Columbia",
    pickup: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { street: "1001 E Broadway", city: "Columbia", state: "MO", zip: "65201" },
  },
  {
    name: "Warrenton → Springfield",
    pickup: { street: "200 E Main St", city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { street: "300 Park Central East", city: "Springfield", state: "MO", zip: "65806" },
  },
] as const;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) {
    console.error("GOOGLE_MAPS_API_KEY is required for verify-hauling-routes.");
    process.exit(1);
  }

  const base = getPrimaryOperatingBase();
  console.log(`Primary base: ${base.name} @ ${base.address}, ${base.city} (${base.location.lat}, ${base.location.lng})`);
  assert.ok(base.isPrimary, "Primary operating base must be marked isPrimary");
  assert.match(base.address ?? "", /607/i, "Primary base street should be 607 S State Hwy 47");

  const rows: Array<{
    name: string;
    loaded: number;
    deadhead: number;
    total: number;
    hours: number;
    price: number;
    fuel: number;
  }> = [];

  for (const scenario of SCENARIOS) {
    console.log(`\nRouting: ${scenario.name}…`);
    const pickup = await resolveVerifiedAddress(scenario.pickup);
    await sleep(200);
    const delivery = await resolveVerifiedAddress(scenario.delivery);
    await sleep(200);

    const plan = await planHaulingRoute({
      pickup,
      delivery,
      needsLoadingHelp: true,
      needsUnloadingHelp: false,
      reverify: false,
    });
    const metrics = toRouteMetrics(plan);
    const estimate = haulingTransportEngine.calculate(
      {
        pickup: {
          street: pickup.line1,
          city: pickup.city,
          state: pickup.state,
          zip: pickup.zip,
          location: metrics.pickupLocation,
        },
        delivery: {
          street: delivery.line1,
          city: delivery.city,
          state: delivery.state,
          zip: delivery.zip,
          location: metrics.deliveryLocation,
        },
        cargoCategory: "equipment",
        cargoDescription: "Skid steer verification load",
        estimatedWeightLbs: 4500,
        lengthFt: 10,
        widthFt: 6,
        heightFt: 7,
        needsWinch: true,
        needsLoadingHelp: true,
        needsUnloadingHelp: false,
        serviceLevel: "standard",
        route: metrics,
      },
      morrisConfig
    );

    rows.push({
      name: scenario.name,
      loaded: metrics.loadedMiles,
      deadhead: metrics.deadheadMiles,
      total: metrics.totalTravelMiles,
      hours: metrics.estimatedDriverHours,
      price: estimate.total,
      fuel: estimate.estimatedFuelCost,
    });

    console.log(
      `  loaded=${metrics.loadedMiles} deadhead=${metrics.deadheadMiles} total=${metrics.totalTravelMiles} price=$${estimate.total}`
    );
    await sleep(300);
  }

  console.table(rows);

  const totals = rows.map((r) => r.total);
  const uniqueTotals = new Set(totals.map((t) => t.toFixed(1)));
  assert.ok(
    uniqueTotals.size >= 4,
    `Expected distinct route totals across scenarios, got ${[...uniqueTotals].join(", ")}`
  );

  const prices = rows.map((r) => r.price);
  const uniquePrices = new Set(prices);
  assert.ok(
    uniquePrices.size >= 3,
    `Expected distinct prices from real base routing, got ${[...uniquePrices].join(", ")}`
  );

  console.log("\n✓ Hauling routes produce distinct mileage and pricing from primary base.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
