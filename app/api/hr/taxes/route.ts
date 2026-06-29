import { morrisConfig } from "@/lib/morris-config";
import { getContractor1099Summaries } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiPermission("hr.tax.read");
  if (profile instanceof Response) return profile;
  try {
    const { searchParams } = new URL(request.url);
    const taxYear = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const summaries = await getContractor1099Summaries(morrisConfig.companyId, taxYear);
    return apiOk({ summaries, taxYear });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load tax data", 500);
  }
}
