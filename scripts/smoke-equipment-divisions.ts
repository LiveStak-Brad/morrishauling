import assert from "node:assert/strict";
import {
  divisionToServiceType,
  isEquipmentDivision,
  parseDivisionId,
  serviceTypeToDivision,
} from "../lib/divisions";
import {
  capabilityIsEnabled,
  inferCapabilityFromServiceSlug,
  publicCatalogServices,
} from "../lib/equipment/catalog";
import { ctaLabelForLaunchStatus, ctaLabelForServiceStatus } from "../lib/equipment/status";
import { getEquipmentService } from "../lib/seo/equipment-divisions";

assert.equal(parseDivisionId("land_clearing"), "land_clearing");
assert.equal(parseDivisionId("hauling_transport"), "hauling");
assert.equal(parseDivisionId("unknown"), "junk_removal");
assert.equal(serviceTypeToDivision("land_clearing"), "land_clearing");
assert.equal(serviceTypeToDivision("site_work"), "site_work");
assert.equal(serviceTypeToDivision("equipment_services"), "equipment_services");
assert.equal(divisionToServiceType("land_clearing"), "land_clearing");
assert.equal(isEquipmentDivision("land_clearing"), true);
assert.equal(isEquipmentDivision("junk_removal"), false);

assert.equal(capabilityIsEnabled("cap-ctl-mulcher"), true);
assert.equal(capabilityIsEnabled("cap-mini-bucket"), false);

const land = publicCatalogServices("land_clearing");
assert.ok(land.some((s) => s.slug === "forestry-mulching"));
assert.ok(!land.some((s) => s.slug === "excavation"));

const site = publicCatalogServices("site_work");
assert.ok(site.some((s) => s.slug === "rough-grading"));
assert.ok(!site.some((s) => s.slug === "excavation"));

const inferred = inferCapabilityFromServiceSlug("forestry-mulching");
assert.equal(inferred.attachmentId, "forestry_mulcher");

const page = getEquipmentService("land_clearing", "forestry-mulching");
assert.ok(page);
assert.ok(!page.title.toLowerCase().includes("official bobcat"));

const prelaunch = ctaLabelForLaunchStatus("accepting_estimate_requests", "land_clearing");
assert.equal(prelaunch.bookingCtaLabel, "Request an Upcoming Project Estimate");
assert.equal(ctaLabelForServiceStatus("active"), "Request an Estimate");

const bobcat = getEquipmentService("equipment_services", "bobcat-services");
assert.ok(bobcat?.intro.some((p) => p.includes("not because Morris Service Group is affiliated")));

console.log("equipment divisions smoke tests passed");
