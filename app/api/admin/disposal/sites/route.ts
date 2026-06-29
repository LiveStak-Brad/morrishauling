import { morrisConfig } from "@/lib/morris-config";
import {
  createDisposalFacility,
  getDisposalFacilitiesWithMeta,
} from "@/lib/db/disposal-facilities";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";
import type { DisposalFacility } from "@/types/disposal-management";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const { facilities, meta } = await getDisposalFacilitiesWithMeta(morrisConfig.companyId);
    return apiOk({ facilities, meta });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load disposal facilities", 500);
  }
}

export async function POST(req: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (profile.role !== "admin") return apiError("Admin access required", 403);
  try {
    const body = (await req.json()) as { facility?: Partial<DisposalFacility> & { name: string; address: string } };
    const facility = body.facility;
    if (!facility?.name?.trim() || !facility?.address?.trim()) {
      return apiError("Name and address are required", 400);
    }
    const created = await createDisposalFacility(morrisConfig.companyId, facility);
    return apiOk({ facility: created });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create facility", 500);
  }
}
