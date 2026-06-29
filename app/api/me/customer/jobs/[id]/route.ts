import { morrisConfig } from "@/lib/morris-config";
import { getCustomerJobDetail } from "@/lib/db/operations";
import { resolveDemoCustomerId } from "@/lib/demo-customer";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  const customerId = resolveDemoCustomerId(profile.customer_id);
  if (!customerId) return apiError("Sign in required", 403);

  try {
    const { id } = await params;
    const detail = await getCustomerJobDetail(morrisConfig.companyId, customerId, id);
    if (!detail) return apiError("Job not found", 404);
    return apiOk(detail);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load job", 500);
  }
}
