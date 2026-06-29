import { morrisConfig } from "@/lib/morris-config";
import { getDisposalFacilityById, updateDisposalFacility } from "@/lib/db/disposal-facilities";
import { getFacilityHistoricalStats } from "@/lib/db/disposal-dashboard";
import { createClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { createSignedStorageUrl } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import type { DisposalFacility } from "@/types/disposal-management";

async function signPath(path?: string | null) {
  if (!path || path.startsWith("http")) return path ?? undefined;
  try {
    return await createSignedStorageUrl(STORAGE_BUCKETS.disposalReceipts, path);
  } catch {
    return undefined;
  }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const { id } = await context.params;
    const companyId = morrisConfig.companyId;
    const facility = await getDisposalFacilityById(companyId, id);
    if (!facility) return apiError("Facility not found", 404);

    const stats = (await getFacilityHistoricalStats(companyId))[id] ?? null;
    let recentJobs: Array<{
      jobId: string;
      actualCost: number;
      completedAt: string;
      waitMinutes?: number;
      unloadMinutes?: number;
      receiptSignedUrl?: string;
    }> = [];

    if (await isDbReady()) {
      const { data } = await (await createClient())
        .from("disposal_events")
        .select("job_id, actual_cost, completed_at, wait_minutes, unload_minutes, receipt_url")
        .eq("company_id", companyId)
        .eq("dump_site_id", id)
        .order("completed_at", { ascending: false })
        .limit(10);
      recentJobs = await Promise.all(
        (data ?? []).map(async (r) => ({
          jobId: String(r.job_id),
          actualCost: Number(r.actual_cost ?? 0),
          completedAt: String(r.completed_at),
          waitMinutes: r.wait_minutes != null ? Number(r.wait_minutes) : undefined,
          unloadMinutes: r.unload_minutes != null ? Number(r.unload_minutes) : undefined,
          receiptSignedUrl: await signPath(r.receipt_url as string),
        }))
      );
    }

    return apiOk({ facility, stats, recentJobs });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load facility", 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const { id } = await context.params;
    const body = await parseJson<{ updates: Partial<DisposalFacility> }>(request);
    const facility = await updateDisposalFacility(morrisConfig.companyId, id, body.updates ?? {});
    return apiOk({ facility });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update facility", 500);
  }
}
