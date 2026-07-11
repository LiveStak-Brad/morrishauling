import { allVerifiedAsDisposalFacilities } from "../lib/data/disposal-network/map-to-facility";
import { planDisposalRoute } from "../lib/disposal/multi-facility-plan";
import { rankDisposalSites } from "../lib/disposal/disposal-recommendation";
import { morrisConfig } from "../lib/morris-config";
import { coverageSummary } from "../lib/data/disposal-network/index";

const sites = allVerifiedAsDisposalFacilities();
const origin = { lat: 38.81, lng: -91.14 };
const materials = ["mixed_junk", "electronics", "yard_waste"];
const recommendation = rankDisposalSites({
  sites,
  origin,
  materials: [...materials],
  config: morrisConfig,
  strictMaterials: false,
  jobRevenue: 450,
});
const plan = planDisposalRoute({
  sites,
  origin,
  materials: [...materials],
  config: morrisConfig,
  jobRevenue: 450,
  requireCommercial: true,
});
console.log(
  JSON.stringify(
    {
      summary: coverageSummary(),
      best: recommendation.bestOverall?.site.name,
      planStrategy: plan.strategy,
      stops: plan.stops.map((s) => ({ name: s.site.name, materials: s.materials })),
      unassigned: plan.unassignedMaterials,
      pricingUncertain: plan.pricingUncertain,
    },
    null,
    2
  )
);
