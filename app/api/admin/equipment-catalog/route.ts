import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import {
  getMaintenanceReservePerHour,
  listEquipmentCatalog,
  listServiceCatalog,
  setCatalogEnabled,
  updateMaintenanceReservePerHour,
  updateServiceCatalogStatus,
} from "@/lib/db/equipment";
import type { ServiceStatus } from "@/types/equipment";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && profile.role !== "planner") return apiError("Forbidden", 403);

    const [catalog, services, reserve] = await Promise.all([
      listEquipmentCatalog(),
      listServiceCatalog(),
      getMaintenanceReservePerHour(),
    ]);
    return apiOk({
      ...catalog,
      services,
      maintenanceReservePerHour: reserve,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load catalog");
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Only the owner can change equipment catalog", 403);

    const body = await parseJson<{
      kind?: "type" | "attachment" | "capability" | "service" | "settings";
      id?: string;
      enabled?: boolean;
      status?: ServiceStatus;
      publiclyListed?: boolean;
      maintenanceReservePerHour?: number;
    }>(request);

    if (body.kind === "settings" && typeof body.maintenanceReservePerHour === "number") {
      const value = await updateMaintenanceReservePerHour(
        MORRIS_COMPANY_ID,
        body.maintenanceReservePerHour
      );
      return apiOk({ maintenanceReservePerHour: value });
    }

    if (body.kind === "service" && body.id) {
      const row = await updateServiceCatalogStatus({
        id: body.id,
        status: body.status,
        publiclyListed: body.publiclyListed,
      });
      return apiOk({ service: row });
    }

    if (body.id && typeof body.enabled === "boolean") {
      const table =
        body.kind === "attachment"
          ? "equipment_attachments"
          : body.kind === "capability"
            ? "equipment_capabilities"
            : "equipment_types";
      await setCatalogEnabled(table, body.id, body.enabled);
      return apiOk({ ok: true });
    }

    return apiError("Invalid update", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update catalog");
  }
}
