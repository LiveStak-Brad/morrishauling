/**
 * End-to-end verification of division ops (pricing, conflicts, permissions, DB).
 */
import assert from "node:assert/strict";
import { junkRemovalEngine } from "../lib/estimate/junk-removal-engine";
import { haulingTransportEngine } from "../lib/estimate/hauling-transport-engine";
import { evaluateHaulingReview } from "../lib/hauling/review-rules";
import { findAssignmentConflicts } from "../lib/scheduling/assignment-conflicts";
import { canCompleteWithProof } from "../lib/jobs/workflow";
import { canMarkJobCompleted } from "../lib/disposal/disposal-requirements";
import { morrisConfig } from "../lib/morris-config";
import { canAccessDivision, getProfileDivisionScope } from "../lib/auth/permissions";
import type { UserProfile } from "../lib/auth/types";
import type { Job } from "../types/job";
import fs from "fs";
import pg from "pg";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
}

console.log("1) Pricing separation");
const junk = junkRemovalEngine.calculate(
  {
    mode: "cleanout",
    loadSizeTier: "half_50",
    accessDetails: {
      stairs: true,
      stairFlights: 1,
      elevator: false,
      longCarryFt: 40,
      basement: false,
      attic: false,
      tightAccess: false,
      heavyItems: true,
      specialDisposal: false,
    },
    priorityLevel: "standard",
    hasPhotos: true,
    zip: "63383",
    scheduleSlot: {
      id: "slot-flex",
      windowLabel: "Flexible",
      discountAmount: 25,
      discountReason: "Flexible scheduling",
    },
  },
  morrisConfig
);
assert.ok(junk.total > 0, "junk total");
assert.ok(
  !JSON.stringify(junk.customerLines ?? junk.lines).toLowerCase().includes("deadhead"),
  "junk customer lines should not expose deadhead"
);

const haulRoute = {
  loadedMiles: 32,
  deadheadMiles: 18,
  totalTravelMiles: 50,
  driveDurationSeconds: 4200,
  estimatedDriverHours: 1.8,
  loadUnloadMinutes: 40,
  pickupLocation: { lat: 38.8178812, lng: -91.1428926 },
  deliveryLocation: { lat: 38.788, lng: -90.497 },
  provider: "test",
  routeOk: true as const,
};

const haul = haulingTransportEngine.calculate(
  {
    pickup: { city: "Warrenton", state: "MO", zip: "63383", street: "100 Main St" },
    delivery: { city: "St Charles", state: "MO", zip: "63301", street: "200 First Capitol Dr" },
    cargoCategory: "equipment",
    cargoDescription: "Skid steer",
    estimatedWeightLbs: 4500,
    lengthFt: 10,
    widthFt: 6,
    heightFt: 7,
    needsWinch: true,
    needsLoadingHelp: true,
    needsUnloadingHelp: false,
    serviceLevel: "standard",
    route: haulRoute,
  },
  morrisConfig
);
assert.ok(haul.total > 0, "hauling total");
assert.ok(haul.customerLines?.length, "hauling customer lines");
assert.ok(haul.internalLines?.length, "hauling internal lines");
assert.notEqual(
  JSON.stringify(haul.customerLines),
  JSON.stringify(haul.internalLines),
  "customer vs internal breakdown differ"
);
console.log("  junk total", junk.total, "hauling total", haul.total);

console.log("2) Hauling safety review");
const review = evaluateHaulingReview(
  {
    pickup: { city: "Warrenton", state: "MO", zip: "63383" },
    delivery: { city: "Quincy", state: "IL", zip: "62301" },
    cargoCategory: "machinery",
    cargoDescription: "Unknown weight tractor",
    needsWinch: true,
    needsLoadingHelp: true,
    needsUnloadingHelp: true,
    serviceLevel: "standard",
    totalTravelMiles: 200,
  },
  morrisConfig
);
assert.equal(review.reviewRequired, true);
assert.ok(review.reasons.includes("interstate_transport"));
assert.ok(review.reasons.includes("weight_unknown"));

console.log("3) Assignment conflicts");
const jobs = [
  {
    id: "a",
    status: "scheduled",
    scheduledDate: "2026-07-18",
    assignedEmployeeIds: ["emp-1"],
    assignedTruckId: "truck-1",
    assignedTrailerId: "trailer-1",
  },
  {
    id: "b",
    status: "scheduled",
    scheduledDate: "2026-07-18",
    assignedEmployeeIds: [],
  },
] as unknown as Job[];
const conflicts = findAssignmentConflicts({
  jobs,
  jobId: "b",
  scheduledDate: "2026-07-18",
  assignedEmployeeIds: ["emp-1"],
  assignedTruckId: "truck-1",
  assignedTrailerId: "trailer-1",
});
assert.ok(conflicts.some((c) => c.type === "employee"));
assert.ok(conflicts.some((c) => c.type === "truck"));
assert.ok(conflicts.some((c) => c.type === "trailer"));

console.log("4) Photo / completion gates");
const incomplete = { id: "x", photos: [], serviceType: "junk_removal", status: "in_progress" } as unknown as Job;
assert.equal(canCompleteWithProof(incomplete, "junk_removal").ok, false);
assert.equal(canMarkJobCompleted(incomplete).ok, false);
assert.equal(
  canCompleteWithProof(incomplete, "junk_removal", {
    managerOverride: true,
    overrideReason: "Customer refused photos on site",
  }).ok,
  true
);

console.log("5) Permissions");
const owner = {
  id: "1",
  role: "admin",
  email: process.env.STAFF_OWNER_EMAILS?.split(",")[0] ?? "wcba.mo@gmail.com",
  division_access: "all",
} as UserProfile;
const junkMgr = {
  id: "2",
  role: "planner",
  email: "junk-mgr@example.com",
  division_access: "limited",
  managed_division_ids: ["junk_removal"],
} as UserProfile;
// Note: isAdmin requires allowlist — owner email from env
assert.equal(canAccessDivision(junkMgr, "junk_removal"), true);
assert.equal(canAccessDivision(junkMgr, "hauling"), false);
const scope = getProfileDivisionScope(junkMgr);
assert.equal(scope.scope, "limited");

console.log("6) Database seeded records");
async function verifyDb() {
  const c = new pg.Client({
    host: process.env.SUPABASE_POOLER_HOST,
    port: 6543,
    user: "postgres.wfdfyhrdqpozyavxxgob",
    password: process.env.SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const { rows: divs } = await c.query(`select id, launch_status from public.divisions order by id`);
  assert.equal(divs.length, 2);
  for (const d of divs) assert.equal(d.launch_status, "accepting_bookings");
  const { rows: nullDiv } = await c.query(`select count(*)::int as n from public.jobs where division_id is null`);
  assert.equal(nullDiv[0].n, 0);
  const { rows: tests } = await c.query(
    `select count(*)::int as n from public.jobs where id like 'job-test-%'`
  );
  assert.ok(tests[0].n >= 7);
  const { rows: mats } = await c.query(`select count(*)::int as n from public.material_categories`);
  assert.ok(mats[0].n >= 12);
  const { rows: nes } = await c.query(
    `select count(*)::int as n from public.notification_events where job_id like 'job-test-%'`
  );
  assert.ok(nes[0].n >= 7);
  await c.end();
}

verifyDb()
  .then(() => {
    console.log("ALL_VERIFICATIONS_PASSED");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
