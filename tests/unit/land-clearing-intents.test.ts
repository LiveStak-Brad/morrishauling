import { describe, expect, it } from "vitest";
import { publicCatalogServices } from "@/lib/equipment/catalog";
import { getEquipmentService, DIVISION_HUB_COPY } from "@/lib/seo/equipment-divisions";
import {
  DEDICATED_LAND_CLEARING_SLUGS,
  HUB_ONLY_INTENT_SECTIONS,
  KEEP_VEGETATION_OPTIONS,
  LAND_CLEARING_PROJECT_GOALS,
  PROPERTY_END_USE_OPTIONS,
  PROPERTY_NEED_CARDS,
  RELATED_PROJECT_SLUGS,
  defaultGoalForServiceSlug,
  landClearingBookHref,
  parseProjectGoal,
  serviceSlugForGoal,
} from "@/lib/land-clearing/intents";
import { resolveAcreageSource, squareMetersToAcres, totalWorkAreaAcres } from "@/lib/land-clearing/acreage";
import { landClearingLeadCompletenessScore } from "@/lib/land-clearing/lead-score";
import { jobEligibleForReviewRequest } from "@/lib/reviews/eligibility";
import { isPublicOwnedAsset } from "@/lib/equipment/public-fleet";

describe("land-clearing project goals", () => {
  it("includes the expanded customer-friendly goals", () => {
    const ids = LAND_CLEARING_PROJECT_GOALS.map((g) => g.id);
    expect(ids).toEqual([
      "general_land_clearing",
      "forestry_mulching",
      "brush_clearing",
      "property_reclamation",
      "selective_clearing",
      "park_like_clearing",
      "pasture_field_reclamation",
      "hunting_property",
      "food_plot_area",
      "trail_access",
      "fence_line",
      "road_field_encroachment",
      "pond_lake_access",
      "home_site_vegetation",
      "real_estate_cleanup",
      "storm_cleanup",
      "other",
    ]);
    expect(LAND_CLEARING_PROJECT_GOALS.every((g) => g.label && !g.label.includes("_"))).toBe(true);
  });

  it("parses goals and maps them to catalog slugs", () => {
    expect(parseProjectGoal("selective_clearing")).toBe("selective_clearing");
    expect(parseProjectGoal("not-a-goal")).toBeNull();
    expect(serviceSlugForGoal("selective_clearing")).toBe("selective-clearing");
    expect(serviceSlugForGoal("hunting_property")).toBe("hunting-property-clearing");
    expect(serviceSlugForGoal("pond_lake_access")).toBe("trail-clearing");
    expect(defaultGoalForServiceSlug("pasture-field-reclamation")).toBe("pasture_field_reclamation");
    expect(landClearingBookHref({ goal: "selective_clearing" })).toContain("goal=selective_clearing");
    expect(landClearingBookHref({ goal: "selective_clearing" })).toContain("service=selective-clearing");
  });
});

describe("keep/remove and end-use", () => {
  it("offers selective-clearing keep options and later-use choices", () => {
    expect(KEEP_VEGETATION_OPTIONS.map((o) => o.id)).toEqual([
      "keep_most_mature",
      "keep_marked",
      "clear_most",
      "unsure",
    ]);
    expect(PROPERTY_END_USE_OPTIONS.some((o) => o.id === "hunting")).toBe(true);
    expect(PROPERTY_END_USE_OPTIONS.some((o) => o.label === "Unsure")).toBe(true);
  });
});

describe("customer problem selector", () => {
  it("covers the requested property-need cards and recommendations", () => {
    expect(PROPERTY_NEED_CARDS).toHaveLength(12);
    expect(PROPERTY_NEED_CARDS.map((c) => c.id)).toContain("keep-trees");
    expect(PROPERTY_NEED_CARDS.find((c) => c.id === "keep-trees")?.recommendation).toMatch(/Selective clearing/);
    expect(PROPERTY_NEED_CARDS.find((c) => c.id === "unsure")?.estimateHref).toContain("goal=general_land_clearing");
    expect(PROPERTY_NEED_CARDS.every((c) => c.href.startsWith("/land-clearing"))).toBe(true);
  });
});

describe("service-status filtering", () => {
  it("lists the three dedicated intents and hides hub-only catalog slugs", () => {
    const publicSlugs = publicCatalogServices("land_clearing").map((s) => s.slug);
    for (const slug of DEDICATED_LAND_CLEARING_SLUGS) {
      expect(publicSlugs).toContain(slug);
      expect(getEquipmentService("land_clearing", slug)?.h1).toBeTruthy();
    }
    expect(publicSlugs).not.toContain("park-like-clearing");
    expect(publicSlugs).not.toContain("food-plot-area");
    expect(publicSlugs).not.toContain("road-field-encroachment");
    expect(publicSlugs).not.toContain("pond-lake-access");
    expect(publicSlugs).not.toContain("home-site-vegetation");
    expect(publicSlugs).not.toContain("real-estate-cleanup");
    expect(publicSlugs).not.toContain("excavation");
    expect(HUB_ONLY_INTENT_SECTIONS.map((s) => s.id)).toEqual([
      "road-field-encroachment",
      "pond-lake-access",
      "home-site-vegetation",
      "real-estate-cleanup",
    ]);
  });
});

describe("map acreage data model", () => {
  it("converts area, totals multiple work areas, and prefers verified acres", () => {
    expect(squareMetersToAcres(4046.8564224)).toBe(1);
    expect(
      totalWorkAreaAcres([
        { id: "a", acres: 1.25 },
        { id: "b", acres: 0.5 },
      ])
    ).toBe(1.75);
    expect(resolveAcreageSource({ verifiedAcres: 2, mapAcres: 1.2, enteredAcres: 3 }).source).toBe(
      "onsite_verified"
    );
    expect(resolveAcreageSource({ mapAcres: 1.2, enteredAcres: 3 }).source).toBe("map_calculated");
    expect(resolveAcreageSource({ enteredAcres: 3 }).source).toBe("customer_entered");
  });
});

describe("internal lead completeness", () => {
  it("scores information without rejecting empty leads", () => {
    expect(landClearingLeadCompletenessScore({})).toBe(0);
    const score = landClearingLeadCompletenessScore({
      address: "123 Example Rd",
      city: "Warrenton",
      zip: "63383",
      acreage: "2",
      projectGoal: "selective_clearing",
      vegetation: ["dense_brush"],
      density: "heavy",
      keepVegetation: "keep_most_mature",
      propertyEndUse: "recreation",
      access: { drivewayNotes: "gravel lane" },
      mediaCount: 3,
      scheduling: "estimate_only",
      acreageSource: "map_calculated",
    });
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("trust and review preparation", () => {
  it("does not fabricate project, review, or ownership claims on new pages", () => {
    for (const slug of DEDICATED_LAND_CLEARING_SLUGS) {
      const page = getEquipmentService("land_clearing", slug);
      const blob = JSON.stringify(page);
      expect(blob).not.toMatch(/5-star|4\.9|google reviews|100 acres cleared/i);
      expect(blob).not.toMatch(/we own a (bobcat|ctl|t770)/i);
    }
    const honeysuckle = getEquipmentService("land_clearing", "honeysuckle-clearing");
    expect(JSON.stringify(honeysuckle)).not.toMatch(/eliminates honeysuckle permanently/i);
    expect(JSON.stringify(honeysuckle)).toMatch(/above-ground growth/);
    expect(DIVISION_HUB_COPY.land_clearing.lede).toMatch(/rural/i);
    expect(jobEligibleForReviewRequest("land_clearing")).toBe(true);
    expect(jobEligibleForReviewRequest("junk_removal")).toBe(true);
    expect(RELATED_PROJECT_SLUGS["forestry-mulching"]).toContain("selective-clearing");
    expect(isPublicOwnedAsset({ ownership_status: "owned", publicly_visible: true })).toBe(true);
    expect(isPublicOwnedAsset({ ownership_status: "owned", publicly_visible: false })).toBe(false);
    expect(isPublicOwnedAsset({ ownership_status: "planned", publicly_visible: true })).toBe(false);
  });
});
