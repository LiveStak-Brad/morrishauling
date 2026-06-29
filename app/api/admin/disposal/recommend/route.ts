import { morrisConfig } from "@/lib/morris-config";
import { getDisposalFacilities } from "@/lib/db/disposal-facilities";
import { getFacilityHistoricalStats } from "@/lib/db/disposal-dashboard";
import { getJobById } from "@/lib/db/operations";
import { rankDisposalSites } from "@/lib/disposal/disposal-recommendation";
import { normalizeAcceptedMaterials, type MaterialCategory } from "@/lib/disposal/material-categories";
import { approximateCustomerLocation } from "@/lib/disposal/disposal-routing";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { DisposalSortMode } from "@/types/disposal-management";
import type { DisposalFilterOptions } from "@/lib/disposal/disposal-recommendation";

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      jobId?: string;
      lat?: number;
      lng?: number;
      zip?: string;
      materials?: MaterialCategory[];
      loadPercent?: number;
      itemCount?: number;
      jobRevenue?: number;
      sortBy?: DisposalSortMode;
      filters?: DisposalFilterOptions;
      strictMaterials?: boolean;
    }>(request);

    const companyId = morrisConfig.companyId;
    const [sites, facilityStats] = await Promise.all([
      getDisposalFacilities(companyId),
      getFacilityHistoricalStats(companyId),
    ]);
    const base = morrisConfig.operatingBases.find((b) => b.isPrimary) ?? morrisConfig.operatingBases[0];

    let origin = base?.location ?? { lat: 38.79, lng: -90.5 };
    let materials: MaterialCategory[] = body.materials ?? ["mixed_junk"];
    let loadPercent = body.loadPercent ?? 25;
    let itemCount = body.itemCount ?? 1;
    let jobRevenue = body.jobRevenue;
    let legacyCategory = undefined as import("@/lib/disposal/disposal-routing").DisposalCategory | undefined;
    const strictMaterials = body.strictMaterials ?? Boolean(body.jobId);

    if (body.jobId) {
      const job = await getJobById(companyId, body.jobId);
      if (!job) return apiError("Job not found", 404);
      origin = job.address?.location ?? approximateCustomerLocation(job.address?.zip, base);
      const details = job.junkRemovalDetails;
      if (details?.disposalCategory) legacyCategory = details.disposalCategory;
      if (job.estimate?.trailerPercent) loadPercent = job.estimate.trailerPercent;
      if (details?.disposalCategory) materials = normalizeAcceptedMaterials([details.disposalCategory]);
      jobRevenue = jobRevenue ?? job.estimate?.total;
    } else if (body.lat != null && body.lng != null) {
      origin = { lat: body.lat, lng: body.lng };
    } else if (body.zip) {
      origin = approximateCustomerLocation(body.zip, base);
    }

    const result = rankDisposalSites({
      sites,
      origin,
      materials,
      legacyCategory,
      config: morrisConfig,
      loadPercent,
      itemCount,
      jobRevenue,
      sortBy: body.sortBy ?? "recommended",
      filters: body.filters,
      strictMaterials,
      facilityStats,
    });

    return apiOk({ recommendation: result });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to rank disposal sites", 500);
  }
}
