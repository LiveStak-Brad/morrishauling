import { DISPOSAL_COVERAGE_COUNTIES } from "./coverage-counties";
import { VERIFIED_DISPOSAL_FACILITIES } from "./facilities";
import type { VerifiedDisposalFacility } from "./types";

export * from "./types";
export { DISPOSAL_COVERAGE_COUNTIES } from "./coverage-counties";
export { VERIFIED_DISPOSAL_FACILITIES } from "./facilities";

export function getVerifiedFacilities(opts?: {
  state?: "MO" | "IL";
  county?: string;
  commercialOnly?: boolean;
  activeOnly?: boolean;
}): VerifiedDisposalFacility[] {
  return VERIFIED_DISPOSAL_FACILITIES.filter((f) => {
    if (opts?.activeOnly !== false && f.status !== "active") return false;
    if (opts?.state && f.state !== opts.state) return false;
    if (opts?.county && f.county.toLowerCase() !== opts.county.toLowerCase()) return false;
    if (opts?.commercialOnly && !f.commercialAccepted) return false;
    return true;
  });
}

export function getFacilityById(id: string): VerifiedDisposalFacility | undefined {
  return VERIFIED_DISPOSAL_FACILITIES.find((f) => f.id === id);
}

export function coverageSummary() {
  return {
    countyCount: DISPOSAL_COVERAGE_COUNTIES.length,
    facilityCount: VERIFIED_DISPOSAL_FACILITIES.length,
    withPublishedPricing: VERIFIED_DISPOSAL_FACILITIES.filter((f) => f.perTonFee != null || f.baseFee != null).length,
    needsCall: VERIFIED_DISPOSAL_FACILITIES.filter((f) => f.verificationStatus === "needs_call").length,
    byState: {
      MO: VERIFIED_DISPOSAL_FACILITIES.filter((f) => f.state === "MO").length,
      IL: VERIFIED_DISPOSAL_FACILITIES.filter((f) => f.state === "IL").length,
    },
  };
}
