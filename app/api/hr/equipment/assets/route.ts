import { morrisConfig } from "@/lib/morris-config";
import {
  listAssets,
  getOpenDamageReports,
  assignAssetToEmployee,
  assignAssetToFleetUnit,
  upsertAsset,
  adminReturnAsset,
  retireAsset,
} from "@/lib/db/hr/equipment";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EquipmentAsset } from "@/types/hr/equipment";

export async function GET(request: Request) {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  const { searchParams } = new URL(request.url);
  try {
    const assets = await listAssets(morrisConfig.companyId, {
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      assignedEmployeeId: searchParams.get("employeeId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    const damage = await getOpenDamageReports(morrisConfig.companyId);
    return apiOk({ assets, damage });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load assets", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      action?: "create" | "assign-employee" | "assign-fleet" | "return" | "retire";
      assetId?: string;
      employeeId?: string;
      fleetUnitId?: string;
      fleetKind?: "truck" | "trailer";
      condition?: string;
      notes?: string;
      reason?: string;
      conditionIn?: string;
      name?: string;
      category?: string;
      serialNumber?: string;
      purchasePrice?: number;
      location?: string;
    }>(request);

    const action = body.action ?? (body.assetId && body.employeeId ? "assign-employee" : "create");

    if (action === "create") {
      if (!body.name || !body.category) return apiError("name and category required", 400);
      const assetTag = body.assetId ?? `MH-${Date.now().toString(36).toUpperCase()}`;
      const id = await upsertAsset(morrisConfig.companyId, {
        assetId: assetTag,
        name: body.name,
        category: body.category,
        serialNumber: body.serialNumber,
        purchasePrice: body.purchasePrice,
        location: body.location,
        condition: (body.condition as EquipmentAsset["condition"]) ?? "good",
        notes: body.notes,
        photoPaths: [],
        status: "available",
      });
      return apiOk({ id });
    }

    if (!body.assetId) return apiError("assetId required", 400);

    if (action === "assign-employee") {
      if (!body.employeeId) return apiError("employeeId required", 400);
      const checkoutId = await assignAssetToEmployee(
        morrisConfig.companyId,
        body.assetId,
        body.employeeId,
        body.condition,
        body.notes
      );
      return apiOk({ checkoutId });
    }

    if (action === "assign-fleet") {
      if (!body.fleetUnitId || !body.fleetKind) {
        return apiError("fleetUnitId and fleetKind required", 400);
      }
      await assignAssetToFleetUnit(
        morrisConfig.companyId,
        body.assetId,
        body.fleetUnitId,
        body.fleetKind
      );
      return apiOk({ assigned: true });
    }

    if (action === "return") {
      await adminReturnAsset(morrisConfig.companyId, body.assetId, body.conditionIn ?? "good");
      return apiOk({ returned: true });
    }

    if (action === "retire") {
      await retireAsset(morrisConfig.companyId, body.assetId, body.reason);
      return apiOk({ retired: true });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 500);
  }
}
