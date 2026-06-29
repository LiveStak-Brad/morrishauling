import { morrisConfig } from "@/lib/morris-config";
import {
  getAssetById,
  upsertAsset,
  retireAsset,
  adminReturnAsset,
  deleteAsset,
  markAssetCondition,
} from "@/lib/db/hr/equipment";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EquipmentAsset } from "@/types/hr/equipment";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await context.params;
    const asset = await getAssetById(morrisConfig.companyId, id);
    return apiOk({ asset });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Asset not found", 404);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await context.params;
    const body = await parseJson<Partial<EquipmentAsset> & { action?: string; reason?: string; conditionIn?: string }>(
      request
    );

    if (body.action === "return") {
      await adminReturnAsset(morrisConfig.companyId, id, body.conditionIn ?? "good");
      return apiOk({ returned: true });
    }
    if (body.action === "retire") {
      await retireAsset(morrisConfig.companyId, id, body.reason);
      return apiOk({ retired: true });
    }
    if (body.action === "mark_condition" && body.condition) {
      await markAssetCondition(morrisConfig.companyId, id, body.condition, body.status);
      return apiOk({ updated: true });
    }

    await upsertAsset(morrisConfig.companyId, {
      id,
      assetId: body.assetId ?? id,
      name: body.name ?? "Asset",
      category: body.category ?? "general",
      ...body,
    });
    const asset = await getAssetById(morrisConfig.companyId, id);
    return apiOk({ asset });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update asset", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await context.params;
    await deleteAsset(morrisConfig.companyId, id);
    return apiOk({ deleted: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete asset", 500);
  }
}
