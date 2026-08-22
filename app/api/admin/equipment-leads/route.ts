import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import {
  insertJobMachineHours,
  listEquipmentIntakes,
  updateEquipmentIntakeOps,
} from "@/lib/db/equipment";
import { billingId } from "@/lib/billing/utils";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import type { DivisionId } from "@/lib/divisions";
import { parseDivisionId } from "@/lib/divisions";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && profile.role !== "planner") return apiError("Forbidden", 403);

    const url = new URL(request.url);
    const raw = url.searchParams.get("division");
    const divisionId = raw && raw !== "all" ? parseDivisionId(raw) : undefined;
    const leads = await listEquipmentIntakes(MORRIS_COMPANY_ID, divisionId as DivisionId | undefined);
    return apiOk({ leads });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load leads");
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      id: string;
      actualAcres?: number;
      actualMachineHours?: number;
      actualOperatorHours?: number;
      actualFuelGallons?: number;
      actualRepairCost?: number;
      quotedPrice?: number;
      deposit?: number;
      finalRevenue?: number;
      estimatedMachineHours?: number;
      estimatedFuelGallons?: number;
      mobilizationMiles?: number;
      mobilizationCost?: number;
      estimatedMaintenanceReserve?: number;
      estimatedProfit?: number;
      actualProfit?: number;
      jobId?: string;
      machineHours?: {
        assetId?: string;
        start?: number;
        end?: number;
        equipmentTypeId?: string;
        attachmentId?: string;
      };
    }>(request);

    if (!body.id) return apiError("id required", 400);

    const patch: Record<string, unknown> = {};
    const map: Array<[keyof typeof body, string]> = [
      ["actualAcres", "actual_acres"],
      ["actualMachineHours", "actual_machine_hours"],
      ["actualOperatorHours", "actual_operator_hours"],
      ["actualFuelGallons", "actual_fuel_gallons"],
      ["actualRepairCost", "actual_repair_cost"],
      ["quotedPrice", "quoted_price"],
      ["deposit", "deposit"],
      ["finalRevenue", "final_revenue"],
      ["estimatedMachineHours", "estimated_machine_hours"],
      ["estimatedFuelGallons", "estimated_fuel_gallons"],
      ["mobilizationMiles", "mobilization_miles"],
      ["mobilizationCost", "mobilization_cost"],
      ["estimatedMaintenanceReserve", "estimated_maintenance_reserve"],
      ["estimatedProfit", "estimated_profit"],
      ["actualProfit", "actual_profit"],
      ["jobId", "job_id"],
    ];
    for (const [src, dest] of map) {
      if (body[src] !== undefined) patch[dest] = body[src];
    }

    const row = Object.keys(patch).length
      ? await updateEquipmentIntakeOps(body.id, patch)
      : null;

    if (body.machineHours && body.jobId) {
      await insertJobMachineHours({
        id: billingId("jmh"),
        companyId: MORRIS_COMPANY_ID,
        jobId: body.jobId,
        assetId: body.machineHours.assetId,
        equipmentTypeId: body.machineHours.equipmentTypeId,
        attachmentId: body.machineHours.attachmentId,
        machineStartHours: body.machineHours.start,
        machineEndHours: body.machineHours.end,
      });
    }

    return apiOk({ intake: row });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update lead");
  }
}
