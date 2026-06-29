import { morrisConfig } from "@/lib/morris-config";
import { generateInvoicePdf } from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { id } = await params;
    const { signedUrl } = await generateInvoicePdf(morrisConfig.companyId, id, {
      actorProfileId: profile.id,
    });
    return apiOk({ url: signedUrl });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to generate PDF", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { id } = await params;
    const force = new URL(request.url).searchParams.get("force") === "true";
    const result = await generateInvoicePdf(morrisConfig.companyId, id, {
      actorProfileId: profile.id,
      force,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to generate PDF", 500);
  }
}
