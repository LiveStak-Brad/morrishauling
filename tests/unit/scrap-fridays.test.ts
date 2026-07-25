import { describe, expect, it } from "vitest";
import {
  estimateScrapRequest,
  routeCapacityWarnings,
  summarizeRouteCapacity,
  validateWizardItems,
} from "@/lib/scrap-fridays/calc";
import type { ScrapItemType, ScrapWizardItem } from "@/lib/scrap-fridays/types";

function item(
  partial: Partial<ScrapItemType> & Pick<ScrapItemType, "id" | "name" | "category">
): ScrapItemType {
  return {
    active: true,
    icon_key: null,
    default_weight_lb: 100,
    default_volume_cuft: 10,
    default_stop_minutes: 15,
    default_route_units: 1,
    default_equipment: [],
    default_crew_count: 2,
    customer_questions: [],
    eligibility_rules: {},
    sort_order: 1,
    ...partial,
  };
}

function wizard(
  partial: Partial<ScrapWizardItem> & Pick<ScrapWizardItem, "itemTypeId">
): ScrapWizardItem {
  return {
    clientKey: "k1",
    quantity: 1,
    weightBand: "unsure",
    answers: {},
    unusuallyHeavy: false,
    ...partial,
  };
}

describe("scrap friday estimates", () => {
  it("uses default weight when customer is unsure", () => {
    const catalog = new Map([
      [
        "appliance-washer",
        item({
          id: "appliance-washer",
          name: "Washer",
          category: "appliances",
          default_weight_lb: 170,
        }),
      ],
    ]);
    const summary = estimateScrapRequest(
      [wizard({ itemTypeId: "appliance-washer", quantity: 2 })],
      catalog
    );
    expect(summary.estimatedWeightLb).toBe(340);
    expect(summary.routeUnits).toBeGreaterThan(0);
    expect(summary.suggestedCrewCount).toBeGreaterThanOrEqual(2);
  });

  it("uses weight band midpoint when provided", () => {
    const catalog = new Map([
      [
        "yard-grill",
        item({ id: "yard-grill", name: "Grill", category: "yard_outdoor", default_weight_lb: 80 }),
      ],
    ]);
    const summary = estimateScrapRequest(
      [wizard({ itemTypeId: "yard-grill", weightBand: "100_200" })],
      catalog
    );
    expect(summary.estimatedWeightLb).toBe(150);
  });

  it("flags unusually heavy and large piles", () => {
    const catalog = new Map([
      [
        "const-pile",
        item({
          id: "const-pile",
          name: "Scrap pile",
          category: "construction",
          default_weight_lb: 400,
          default_route_units: 3,
        }),
      ],
    ]);
    const summary = estimateScrapRequest(
      [
        wizard({
          itemTypeId: "const-pile",
          unusuallyHeavy: true,
          sizeClass: "larger_than_pickup",
        }),
      ],
      catalog
    );
    expect(summary.manualReviewFlags.length).toBeGreaterThan(0);
    expect(summary.suggestedCrewCount).toBeGreaterThanOrEqual(3);
    expect(summary.suggestedEquipment).toContain("additional_crew");
  });
});

describe("item-specific validation", () => {
  it("requires refrigerator empty confirmation", () => {
    const catalog = new Map([
      [
        "appliance-refrigerator",
        item({
          id: "appliance-refrigerator",
          name: "Refrigerator",
          category: "appliances",
          eligibility_rules: { requiresEmpty: true },
          customer_questions: [
            { key: "empty", label: "Empty", type: "boolean", required: true },
          ],
        }),
      ],
    ]);
    const errors = validateWizardItems(
      [wizard({ itemTypeId: "appliance-refrigerator", answers: {} })],
      catalog
    );
    expect(errors.some((e) => e.toLowerCase().includes("empty"))).toBe(true);
  });

  it("requires intact battery confirmation", () => {
    const catalog = new Map([
      [
        "auto-battery",
        item({
          id: "auto-battery",
          name: "Automotive battery",
          category: "automotive",
          eligibility_rules: { battery: true },
          customer_questions: [
            { key: "intact", label: "Intact", type: "boolean", required: true },
          ],
        }),
      ],
    ]);
    const errors = validateWizardItems(
      [wizard({ itemTypeId: "auto-battery", answers: { intact: false } })],
      catalog
    );
    expect(errors.some((e) => e.toLowerCase().includes("intact"))).toBe(true);
  });

  it("rejects bolted safes for free pickup", () => {
    const catalog = new Map([
      [
        "house-safe",
        item({
          id: "house-safe",
          name: "Safe",
          category: "household",
          eligibility_rules: { safe: true, manualReview: true },
          customer_questions: [
            { key: "empty", label: "Empty", type: "boolean", required: true },
            { key: "unlocked", label: "Unlocked", type: "boolean", required: true },
            { key: "bolted", label: "Bolted", type: "boolean", required: true },
          ],
        }),
      ],
    ]);
    const errors = validateWizardItems(
      [
        wizard({
          itemTypeId: "house-safe",
          answers: { empty: true, unlocked: true, bolted: true },
        }),
      ],
      catalog
    );
    expect(errors.some((e) => e.toLowerCase().includes("bolted"))).toBe(true);

    const summary = estimateScrapRequest(
      [
        wizard({
          itemTypeId: "house-safe",
          answers: { empty: true, unlocked: false, bolted: false },
        }),
      ],
      catalog
    );
    expect(summary.manualReviewFlags.some((f) => f.toLowerCase().includes("manual"))).toBe(
      true
    );
  });

  it("requires at least one item", () => {
    const errors = validateWizardItems([], new Map());
    expect(errors[0]).toMatch(/at least one/i);
  });
});

describe("route capacity", () => {
  it("warns when units/weight/labor exceed limits", () => {
    const usage = summarizeRouteCapacity([
      { routeUnits: 20, estimatedWeightLb: 5000, estimatedVolumeCuft: 100, estimatedStopMinutes: 200, difficultyScore: 6 },
      { routeUnits: 25, estimatedWeightLb: 8000, estimatedVolumeCuft: 200, estimatedStopMinutes: 300, difficultyScore: 2 },
    ]);
    expect(usage.routeUnits).toBe(45);
    expect(usage.difficultStops).toBe(1);
    const warnings = routeCapacityWarnings(usage, {
      maxRouteUnits: 40,
      maxWeightLb: 12000,
      maxVolumeCuft: 1200,
      maxLaborMinutes: 480,
    });
    expect(warnings.some((w) => w.includes("Route units"))).toBe(true);
    expect(warnings.some((w) => w.includes("weight"))).toBe(true);
  });
});
