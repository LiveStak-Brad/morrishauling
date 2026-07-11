/**
 * Print single-item estimate totals for market calibration.
 * Usage: npx tsx scripts/calibrate-junk-single-items.ts
 */
import { junkRemovalEngine } from "../lib/estimate/junk-removal-engine";
import { morrisConfig } from "../lib/morris-config";

const ids = [
  "couch",
  "loveseat",
  "recliner",
  "mattress",
  "box_spring",
  "refrigerator",
  "washer",
  "dryer",
  "dining_table",
  "desk",
  "treadmill",
  "hot_tub",
] as const;

const accessDetails = {
  stairs: false,
  elevator: false,
  longCarryFt: 0,
  basement: false,
  attic: false,
  tightAccess: false,
  heavyItems: false,
  specialDisposal: false,
};

for (const id of ids) {
  const r = junkRemovalEngine.calculate(
    {
      mode: "single_item",
      selectedItems: [{ itemId: id, quantity: 1 }],
      accessDetails,
      addressLocation: { lat: 38.8179, lng: -91.1429 },
      zip: "63383",
      hasPhotos: true,
      routeMetrics: {
        dispatchMiles: 8,
        customerToDisposalMiles: 6,
        returnMiles: 10,
        totalRouteMiles: 24,
        originBaseId: "base-warrenton",
        originBaseName: "Morris Services Operating Base",
        selectedDisposalSiteId: "dump-warren-county",
        selectedDisposalSiteName: "Warren County Disposal",
        estimatedDriveMinutes: 40,
      },
    },
    morrisConfig
  );
  const lines = (r.customerLines ?? [])
    .map((l) => `${l.label}=$${l.amount}`)
    .join(" | ");
  console.log(
    `${id.padEnd(14)} total=$${String(r.total).padStart(4)}  margin=${r.internalProfit.profitMargin}%  ${lines}`
  );
}
