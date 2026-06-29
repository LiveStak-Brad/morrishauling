import { morrisConfig } from "@/lib/morris-config";
import { listDisposalReviewQueue } from "@/lib/db/disposal-review";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const rows = await listDisposalReviewQueue(morrisConfig.companyId);
    return apiOk({ rows, counts: {
      total: rows.length,
      missingReceipt: rows.filter((r) => r.flags.includes("missing_receipt")).length,
      overEstimate: rows.filter((r) => r.flags.includes("cost_over_estimate")).length,
      overrides: rows.filter((r) => r.flags.includes("facility_override")).length,
      noCost: rows.filter((r) => r.flags.includes("no_cost_disposal")).length,
      noDisposal: rows.filter((r) => r.flags.includes("completed_without_disposal")).length,
    }});
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load review queue", 500);
  }
}
