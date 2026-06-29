import { morrisConfig } from "@/lib/morris-config";
import { getDisposalFacilities } from "@/lib/db/disposal-facilities";
import { getFacilityHistoricalStats } from "@/lib/db/disposal-dashboard";
import { getJobById } from "@/lib/db/operations";
import { rankDisposalSites } from "@/lib/disposal/disposal-recommendation";
import { normalizeAcceptedMaterials } from "@/lib/disposal/material-categories";
import { approximateCustomerLocation } from "@/lib/disposal/disposal-routing";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

/** Job-scoped disposal recommendation — available to assigned crew and dispatch. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  try {
    const { id: jobId } = await context.params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);
    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const [sites, facilityStats] = await Promise.all([
      getDisposalFacilities(companyId),
      getFacilityHistoricalStats(companyId),
    ]);
    const base = morrisConfig.operatingBases.find((b) => b.isPrimary) ?? morrisConfig.operatingBases[0];
    const origin = job.address?.location ?? approximateCustomerLocation(job.address?.zip, base);
    const details = job.junkRemovalDetails;
    const materials = details?.disposalCategory
      ? normalizeAcceptedMaterials([details.disposalCategory])
      : ["mixed_junk" as const];

    const result = rankDisposalSites({
      sites,
      origin,
      materials,
      legacyCategory: details?.disposalCategory,
      config: morrisConfig,
      loadPercent: job.estimate?.trailerPercent ?? 25,
      itemCount: 1,
      jobRevenue: job.estimate?.total,
      sortBy: "recommended",
      strictMaterials: true,
      facilityStats,
    });

    return apiOk({ recommendation: result });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to recommend disposal", 500);
  }
}
