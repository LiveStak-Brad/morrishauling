import assert from "node:assert/strict";
import { evaluateHaulingReview } from "../lib/hauling/review-rules";
import { morrisConfig } from "../lib/morris-config";
import {
  divisionAcceptsEstimateRequests,
  serviceTypeToDivision,
  divisionToServiceType,
} from "../lib/divisions";
import { canCompleteWithProof } from "../lib/jobs/workflow";
import type { Job } from "../types/job";

assert.equal(serviceTypeToDivision("junk_removal"), "junk_removal");
assert.equal(serviceTypeToDivision("hauling_transport"), "hauling");
assert.equal(divisionToServiceType("hauling"), "hauling_transport");
assert.equal(divisionAcceptsEstimateRequests("junk_removal"), false);

const base = {
  pickup: { city: "Warrenton", state: "MO", zip: "63383" },
  delivery: { city: "St Charles", state: "MO", zip: "63301" },
  cargoCategory: "equipment" as const,
  cargoDescription: "Skid steer",
  needsWinch: false,
  needsLoadingHelp: false,
  needsUnloadingHelp: false,
  serviceLevel: "standard" as const,
  lengthFt: 8,
  widthFt: 5,
  heightFt: 6,
  estimatedWeightLbs: 4000,
  totalTravelMiles: 40,
};

const unknownWeight = evaluateHaulingReview({ ...base, estimatedWeightLbs: undefined }, morrisConfig);
assert.equal(unknownWeight.reviewRequired, true);
assert.ok(unknownWeight.reasons.includes("weight_unknown"));

const interstate = evaluateHaulingReview(
  { ...base, delivery: { city: "Quincy", state: "IL", zip: "62301" } },
  morrisConfig
);
assert.ok(interstate.reasons.includes("interstate_transport"));

const job = { id: "j1", photos: [] } as unknown as Job;
assert.equal(canCompleteWithProof(job, "junk_removal").ok, false);
assert.equal(
  canCompleteWithProof(job, "hauling", {
    managerOverride: true,
    overrideReason: "Customer refused photos",
  }).ok,
  true
);

console.log("divisions smoke tests passed");
