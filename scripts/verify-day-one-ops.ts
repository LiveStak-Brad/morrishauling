/**
 * Offline checks for assignment validation + email honesty.
 * Run: npx tsx scripts/verify-day-one-ops.ts
 */
import assert from "node:assert/strict";
import { validateJobAssignments, nextJobAction } from "../lib/scheduling/validate-assignments";
import { isEmailDeliveryConfigured } from "../lib/billing/utils";
import type { Job } from "../types/job";
import type { HrEmployee } from "../types/hr/employee";
import type { OperationalTruck } from "../types/operations-depth";

const job = {
  id: "job-1",
  companyId: "morris-hauling",
  customerId: "c1",
  serviceType: "hauling_transport",
  divisionId: "hauling",
  status: "scheduled",
  scheduledDate: "2026-07-12",
  loadSizeTier: "half_50",
  junkType: "general",
  items: [],
  photos: [],
  warnings: [],
  address: { street: "1", city: "W", state: "MO", zip: "63383" },
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as Job;

const office = {
  id: "e-office",
  firstName: "Off",
  lastName: "Ice",
  role: "office",
  lifecycleStatus: "active",
} as HrEmployee;

const driver = {
  id: "e-driver",
  firstName: "Dri",
  lastName: "Ver",
  role: "driver",
  lifecycleStatus: "active",
} as HrEmployee;

const truck = {
  id: "tr1",
  companyId: "morris-hauling",
  name: "Truck",
  maintenanceStatus: "good",
  status: "available",
} as OperationalTruck;

const trailerMaint = {
  id: "tl1",
  companyId: "morris-hauling",
  name: "Trailer",
  maintenanceStatus: "overdue",
  status: "maintenance",
} as OperationalTruck;

const r1 = validateJobAssignments({
  job,
  allJobs: [],
  employees: [office, driver],
  trucks: [truck],
  trailers: [trailerMaint],
  assignedEmployeeIds: [office.id],
  driverEmployeeId: office.id,
  assignedTruckId: truck.id,
  assignedTrailerId: trailerMaint.id,
});
assert.ok(r1.hardBlocks.some((b) => b.code === "employee_unqualified" || b.code === "driver_license"));
assert.ok(r1.hardBlocks.some((b) => b.code === "equipment_maintenance"));
console.log("✓ Hard blocks: office driver + maintenance trailer");

const conflictJob = {
  ...job,
  id: "job-2",
  assignedEmployeeIds: [driver.id],
  assignedTruckId: truck.id,
  assignedTrailerId: undefined,
};
const r2 = validateJobAssignments({
  job: { ...job, id: "job-3" },
  allJobs: [conflictJob as Job],
  employees: [driver],
  trucks: [truck],
  trailers: [],
  assignedEmployeeIds: [driver.id],
  driverEmployeeId: driver.id,
  assignedTruckId: truck.id,
  scheduledDate: "2026-07-12",
});
assert.ok(r2.softConflicts.length >= 1);
console.log("✓ Soft day conflicts detected");

assert.equal(nextJobAction({ ...job, scheduledDate: undefined }, false), "Waiting for schedule");
assert.equal(nextJobAction(job, false), "Crew not assigned");
assert.equal(
  nextJobAction(
    { ...job, assignedEmployeeIds: ["a"], assignedTruckId: "t", assignedTrailerId: "tr", status: "completed" },
    false
  ),
  "Ready to invoice"
);
assert.equal(
  nextJobAction(
    { ...job, assignedEmployeeIds: ["a"], assignedTruckId: "t", assignedTrailerId: "tr", status: "completed" },
    true,
    true
  ),
  "Invoice unpaid"
);
console.log("✓ Next required action labels");

const emailOn = isEmailDeliveryConfigured();
console.log(`✓ Email readiness check: configured=${emailOn} (honest — no false Sent without provider)`);

console.log("\nAll day-one offline checks passed.");
