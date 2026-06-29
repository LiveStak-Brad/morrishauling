import { morrisConfig } from "@/lib/morris-config";
import { createOperationalDumpSite } from "@/lib/db/operations-depth";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      name: string;
      address: string;
      city?: string;
      state?: string;
      zip?: string;
      baseFee?: number;
      perTonFee?: number;
      feeType?: string;
    }>(request);
    if (!body.name?.trim() || !body.address?.trim()) {
      return apiError("Name and address required", 400);
    }
    const site = await createOperationalDumpSite(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk({ site });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create dump site", 500);
  }
}
