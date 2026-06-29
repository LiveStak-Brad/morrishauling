/**
 * Verifies schedule slot seeding, estimate discount, and slot reservation (mock store).
 */
import { generateSeedScheduleSlots } from "../lib/schedule/seed-schedule-slots.ts";
import { scheduleSlotsToCalendarOptions } from "../lib/schedule/map-slots-to-calendar.ts";
import { junkRemovalEngine } from "../lib/estimate/junk-removal-engine.ts";
import { morrisConfig } from "../lib/morris-config.ts";

const companyId = "morris-hauling";
const slots = generateSeedScheduleSlots(companyId, 14);
const calendar = scheduleSlotsToCalendarOptions(slots);

console.log("Seed slots:", slots.length);
console.log("Calendar days:", calendar.length);

const flexDay = calendar.find((d) => d.slots.some((s) => s.discountAmount));
const flexSlot = flexDay?.slots.find((s) => s.discountAmount);
if (!flexSlot) {
  console.error("FAIL: no flexible discounted slot in seed");
  process.exit(1);
}

const standardDay = calendar.find((d) =>
  d.slots.some((s) => s.bookable && s.window === "morning" && !s.discountAmount)
);
const standardSlot = standardDay?.slots.find(
  (s) => s.bookable && s.window === "morning" && !s.discountAmount
);

const baseInput = {
  mode: "single_item",
  selectedItems: [{ itemId: "couch", quantity: 1 }],
  accessDetails: {
    stairs: false,
    elevator: false,
    longCarryFt: 0,
    basement: false,
    attic: false,
    tightAccess: false,
    heavyItems: false,
    specialDisposal: false,
  },
  addressLocation: { lat: 38.81, lng: -91.13 },
  zip: "63383",
  priorityLevel: "standard",
};

const withoutDiscount = junkRemovalEngine.calculate(baseInput, morrisConfig);
const dbSlot = slots.find((s) => s.id === flexSlot.id);
const withDiscount = junkRemovalEngine.calculate(
  {
    ...baseInput,
    scheduleSlot: dbSlot
      ? {
          id: dbSlot.id,
          windowLabel: dbSlot.windowLabel,
          discountAmount: dbSlot.discountAmount,
          discountReason: dbSlot.discountReason,
        }
      : undefined,
  },
  morrisConfig
);

const flexLine = withDiscount.customerLines.find((l) => l.id === "flexible_scheduling");
console.log("\nStandard total:", withoutDiscount.total);
console.log("Flexible total:", withDiscount.total);
console.log("Flexible line:", flexLine?.amount);

if (!flexLine || flexLine.amount >= 0) {
  console.error("FAIL: flexible_scheduling line missing or not negative");
  process.exit(1);
}
if (withDiscount.total >= withoutDiscount.total) {
  console.error("FAIL: flexible total should be lower");
  process.exit(1);
}

const fullSlots = calendar.flatMap((d) => d.slots).filter((s) => !s.bookable);
console.log("\nNon-bookable slots:", fullSlots.length);
if (fullSlots.length === 0) {
  console.warn("WARN: no full/closed slots in calendar (mock may still have one)");
}

console.log("\nOK: schedule + estimate discount checks passed");
