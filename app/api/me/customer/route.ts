import { morrisConfig } from "@/lib/morris-config";
import { getCustomerDashboard } from "@/lib/db/operations";
import { resolveDemoCustomerId } from "@/lib/demo-customer";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  const customerId = resolveDemoCustomerId(profile.customer_id);
  if (!customerId) {
    return apiError("Sign in to view your account, or book as a guest from the booking page.", 403);
  }

  try {
    const data = await getCustomerDashboard(morrisConfig.companyId, customerId);
    return apiOk(data);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load customer data", 500);
  }
}
