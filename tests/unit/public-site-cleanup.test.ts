import { describe, expect, it } from "vitest";
import { PUBLIC_NAV_GROUPS, FOOTER_SERVICE_LINKS, HOMEPAGE_GOAL_CARDS } from "@/lib/public-nav";
import { PUBLIC_DIVISION_CARDS, morrisServicesConfig } from "@/lib/morris-services-config";
import { SERVICE_AREA, SERVICE_COVERAGE_NOTE } from "@/lib/public-copy";
import {
  ALL_PUBLIC_COUNTIES,
  COMPANY_PRIMARY_COUNTIES,
  EXTENDED_SERVICE_COUNTIES,
  SERVICE_AREA_PUBLIC_BLURB,
  serviceAreaShortLabel,
  serviceAreaSeoLabel,
} from "@/lib/service-coverage";
import { SEO_ORG } from "@/lib/seo/site";
import { organizationSchema, localBusinessSchema, serviceSchema } from "@/lib/seo/schema";
import { publicCatalogServices } from "@/lib/equipment/catalog";
import { ctaLabelForLaunchStatus, ctaLabelForServiceStatus } from "@/lib/equipment/status";
import { getEquipmentService, DIVISION_HUB_COPY, allEquipmentMarketingServices } from "@/lib/seo/equipment-divisions";
import { EQUIPMENT_LEGAL_POINTS, EQUIPMENT_ESTIMATE_NOTE } from "@/lib/equipment/legal";
import { morrisConfig } from "@/lib/morris-config";

describe("service-area source of truth", () => {
  it("uses the same county set for public copy, SEO, and company label", () => {
    expect(SERVICE_AREA).toBe(serviceAreaShortLabel());
    expect(morrisConfig.serviceArea.label).toBe(serviceAreaShortLabel());
    expect(SEO_ORG.serviceAreaLabel).toBe(serviceAreaSeoLabel());
    expect(SEO_ORG.servedCounties).toEqual(ALL_PUBLIC_COUNTIES.map((c) => c.name));
    expect(SEO_ORG.primaryCounties).toEqual(COMPANY_PRIMARY_COUNTIES.map((c) => c.name));
    expect(SEO_ORG.extendedCounties).toEqual(EXTENDED_SERVICE_COUNTIES.map((c) => c.name));
    expect(SERVICE_COVERAGE_NOTE).toBe(SERVICE_AREA_PUBLIC_BLURB);
    expect(SERVICE_AREA).toMatch(/Franklin/);
    expect(SERVICE_AREA).toMatch(/Jefferson/);
  });

  it("schema areaServed uses the full public county list", () => {
    const org = organizationSchema();
    const served = (org.areaServed as Array<{ name: string }>).map((a) => a.name);
    expect(served).toEqual(SEO_ORG.servedCounties);
    const service = serviceSchema({
      name: "Forestry Mulching",
      description: "Test",
      path: "/land-clearing/forestry-mulching",
      division: "land_clearing",
    });
    expect((service.areaServed as Array<{ name: string }>).map((a) => a.name)).toEqual(
      SEO_ORG.servedCounties
    );
    const local = localBusinessSchema("land_clearing");
    expect(JSON.stringify(local)).not.toMatch(/aggregateRating|reviewRating|4\.9/);
  });
});

describe("homepage division cards", () => {
  it("lists all five current divisions with customer copy", () => {
    expect(PUBLIC_DIVISION_CARDS.map((d) => d.divisionId)).toEqual([
      "junk_removal",
      "hauling",
      "land_clearing",
      "site_work",
      "equipment_services",
    ]);
    expect(PUBLIC_DIVISION_CARDS.every((d) => d.description.length > 20)).toBe(true);
    expect(HOMEPAGE_GOAL_CARDS).toHaveLength(5);
  });

  it("does not advertise home-service crafts as the expansion path", () => {
    expect(morrisServicesConfig.futureCompanies).toEqual([]);
    expect(JSON.stringify(morrisServicesConfig.futureCapabilities)).not.toMatch(
      /Cleaning|Lawn Care|Handyman|Power Washing/
    );
  });
});

describe("navigation", () => {
  it("keeps scrap pickup under Services and includes the five hubs", () => {
    const services = PUBLIC_NAV_GROUPS.find((g) => g.id === "services");
    expect(services).toBeTruthy();
    const labels = services!.items.map((i) => i.label);
    expect(labels).toContain("Junk Removal");
    expect(labels).toContain("Free Scrap Pickup");
    expect(labels).toContain("Hauling");
    expect(labels).toContain("Land Clearing");
    expect(labels).toContain("Site Work");
    expect(labels).toContain("Equipment Services");
    expect(services!.mobileItems?.map((i) => i.label)).toEqual([
      "Junk Removal",
      "Free Scrap Pickup",
      "Hauling",
      "Land Clearing",
      "Site Work",
      "Equipment Services",
      "All Services",
    ]);
  });

  it("keeps the footer to flagship links", () => {
    expect(FOOTER_SERVICE_LINKS.map((l) => l.label)).toEqual([
      "Junk Removal",
      "Free Scrap Pickup",
      "Hauling",
      "Land Clearing",
      "Forestry Mulching",
      "Site Work",
      "Equipment Services",
    ]);
  });
});

describe("hidden future services", () => {
  it("does not list excavation as a public catalog service", () => {
    const all = publicCatalogServices();
    expect(all.some((s) => /excavation|trenching|drainage|culvert/i.test(s.slug))).toBe(false);
    expect(all.some((s) => s.slug === "forestry-mulching")).toBe(true);
  });
});

describe("estimate-only CTA behavior", () => {
  it("uses normal estimate CTAs for equipment divisions and Book now only for bookable junk", () => {
    const land = ctaLabelForLaunchStatus("accepting_estimate_requests", "land_clearing");
    expect(land.statusLabel).toBe("Estimates Available");
    expect(land.bookingCtaLabel).toBe("Request an Estimate");
    expect(land.bookingCtaLabel.toLowerCase()).not.toContain("book now");
    expect(land.bookingCtaLabel.toLowerCase()).not.toContain("upcoming");

    const junk = ctaLabelForLaunchStatus("accepting_bookings", "junk_removal");
    expect(junk.statusLabel).toBe("Available");
    expect(junk.bookingCtaLabel).toBe("Book now");

    expect(ctaLabelForServiceStatus("active")).toBe("Request an Estimate");
    expect(ctaLabelForServiceStatus("accepting_estimates")).toBe("Request an Estimate");
    expect(ctaLabelForServiceStatus("coming_soon")).toBe("Coming soon");
  });
});

describe("Bobcat affiliation disclaimer", () => {
  it("keeps the shared legal clarification and bobcat page language", () => {
    expect(EQUIPMENT_LEGAL_POINTS.some((p) => /not an affiliation with or endorsement by Bobcat/i.test(p))).toBe(
      true
    );
    const bobcat = getEquipmentService("equipment_services", "bobcat-services");
    expect(bobcat?.intro.some((p) => /not because Morris Service Group is affiliated/i.test(p))).toBe(
      true
    );
  });
});

describe("enabled services are estimate-ready, not prelaunch", () => {
  it("removes customer-facing prelaunch and ownership-wait language from marketed services", () => {
    expect(EQUIPMENT_ESTIMATE_NOTE).not.toMatch(/upcoming|prelaunch|equipment record/i);
    for (const page of allEquipmentMarketingServices()) {
      const blob = JSON.stringify(page);
      expect(blob).not.toMatch(/upcoming project/i);
      expect(blob).not.toMatch(/accepting upcoming/i);
      expect(blob).not.toMatch(/prelaunch/i);
      expect(blob).not.toMatch(/Do you own a forestry mulcher/i);
      expect(blob).not.toMatch(/Do you own a Bobcat/i);
      expect(blob).not.toMatch(/equipment record is active/i);
      expect(blob).not.toMatch(/once equipment/i);
    }
    const excavation = publicCatalogServices().some((s) => s.slug === "excavation");
    expect(excavation).toBe(false);
    expect(DIVISION_HUB_COPY.site_work.description).toMatch(/Excavation is not a current service/);
  });
});

describe("equipment hub positioning", () => {
  it("sells land-clearing outcomes and skid-steer jobs without ownership claims", () => {
    expect(DIVISION_HUB_COPY.land_clearing.lede).toMatch(/Reclaim overgrown acreage/);
    expect(DIVISION_HUB_COPY.equipment_services.h1).toBe("Skid Steer & Equipment Services");
    const forestry = getEquipmentService("land_clearing", "forestry-mulching");
    expect(forestry?.detailSections?.length).toBeGreaterThan(5);
    expect(JSON.stringify(forestry)).not.toMatch(/up to \d+\s*-?\s*inch|trees up to \d+/i);
    expect(JSON.stringify(forestry)).not.toMatch(/we own a (bobcat|ctl|t770)/i);
  });
});
