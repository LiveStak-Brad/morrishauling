import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeAssets, getLegacyEquipmentAssignments } from "@/lib/db/hr/equipment";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const [assets, legacy] = await Promise.all([
      getEmployeeAssets(morrisConfig.companyId, ctx.employeeId),
      getLegacyEquipmentAssignments(morrisConfig.companyId, ctx.employeeId),
    ]);
    return apiOk({ assets, legacy });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load equipment", 500);
  }
}
