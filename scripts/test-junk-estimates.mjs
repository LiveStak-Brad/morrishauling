/**
 * Junk removal estimate scenarios — includes local vs High Ridge (far from Warrenton).
 * Usage: npx tsx scripts/test-junk-estimates.mjs
 */
import { junkRemovalEngine } from "../lib/estimate/junk-removal-engine.ts";
import { morrisConfig } from "../lib/morris-config.ts";

const defaultAccess = {
  stairs: false,
  elevator: false,
  longCarryFt: 0,
  basement: false,
  attic: false,
  tightAccess: false,
  heavyItems: false,
  specialDisposal: false,
};

/** ~High Ridge, MO — far from Warrenton operating base */
const HIGH_RIDGE = { lat: 38.459, lng: -90.536, zip: "63049" };
/** ~Warrenton area — local */
const LOCAL = { lat: 38.82, lng: -91.05, zip: "63383" };

const scenarios = [
  {
    name: "1 couch — local",
    input: {
      mode: "single_item",
      selectedItems: [{ itemId: "couch", quantity: 1 }],
      addressLocation: LOCAL,
      zip: LOCAL.zip,
    },
  },
  {
    name: "1 refrigerator — local",
    input: {
      mode: "single_item",
      selectedItems: [{ itemId: "refrigerator", quantity: 1 }],
      addressLocation: LOCAL,
      zip: LOCAL.zip,
    },
  },
  {
    name: "Refrigerator + freezer — local",
    input: {
      mode: "single_item",
      selectedItems: [
        { itemId: "refrigerator", quantity: 1 },
        { itemId: "freezer", quantity: 1 },
      ],
      addressLocation: LOCAL,
      zip: LOCAL.zip,
    },
  },
  {
    name: "Refrigerator + freezer — High Ridge (far)",
    input: {
      mode: "single_item",
      selectedItems: [
        { itemId: "refrigerator", quantity: 1 },
        { itemId: "freezer", quantity: 1 },
      ],
      addressLocation: HIGH_RIDGE,
      zip: HIGH_RIDGE.zip,
    },
  },
  {
    name: "1 couch — High Ridge (far)",
    input: {
      mode: "single_item",
      selectedItems: [{ itemId: "couch", quantity: 1 }],
      addressLocation: HIGH_RIDGE,
      zip: HIGH_RIDGE.zip,
    },
  },
];

console.log("Junk removal estimate scenarios\n");

for (const { name, input } of scenarios) {
  const result = junkRemovalEngine.calculate(
    { accessDetails: defaultAccess, ...input },
    morrisConfig
  );
  const transport = result.customerLines.find((l) => l.id === "transportation");
  const heavy = result.customerLines.find((l) => l.id === "heavy");
  const special = result.customerLines.find((l) => l.id === "special_disposal");

  console.log(`--- ${name} ---`);
  console.log(`  Base: ${result.route.originBaseName} (${result.route.baseSelectionReason ?? "auto"})`);
  console.log(`  Route (staff): ${result.route.totalRouteMiles} mi`);
  console.log(`  Transportation: $${transport?.amount ?? "?"}`);
  console.log(`  Disposal: $${result.dumpFeeEstimate}`);
  if (heavy) console.log(`  Heavy fee: $${heavy.amount}`);
  if (special) console.log(`  Special disposal: $${special.amount}`);
  console.log(`  Customer total: $${result.total}`);
  console.log(`  Margin: ${result.internalProfit.profitMargin}%`);
  console.log(`  Review: ${result.reviewRequired ? "YES" : "no"}`);
  if (result.priceFactors.length) {
    console.log(`  Price factors:`);
    for (const f of result.priceFactors) console.log(`    ✓ ${f.label}`);
  }
  console.log("");
}
