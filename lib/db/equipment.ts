import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { DEFAULT_MAINTENANCE_RESERVE_PER_HOUR } from "@/lib/equipment/catalog";
import type { ServiceStatus } from "@/types/equipment";
import type { DivisionId } from "@/lib/divisions";

export async function getMaintenanceReservePerHour(companyId = MORRIS_COMPANY_ID): Promise<number> {
  const sb = createAdminClient();
  if (!sb) return DEFAULT_MAINTENANCE_RESERVE_PER_HOUR;
  const { data } = await sb
    .from("equipment_ops_settings")
    .select("maintenance_reserve_per_hour")
    .eq("company_id", companyId)
    .maybeSingle();
  const n = Number(data?.maintenance_reserve_per_hour);
  return Number.isFinite(n) ? n : DEFAULT_MAINTENANCE_RESERVE_PER_HOUR;
}

export async function updateMaintenanceReservePerHour(
  companyId: string,
  value: number
): Promise<number> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("equipment_ops_settings")
    .upsert({
      company_id: companyId,
      maintenance_reserve_per_hour: value,
      updated_at: new Date().toISOString(),
    })
    .select("maintenance_reserve_per_hour")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Number(data?.maintenance_reserve_per_hour ?? value);
}

export async function listServiceCatalog(companyId = MORRIS_COMPANY_ID) {
  const sb = createAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("service_catalog")
    .select("id, division_id, slug, name, status, publicly_listed, sort_order")
    .eq("company_id", companyId)
    .order("division_id")
    .order("sort_order");
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    divisionId: r.division_id as DivisionId,
    slug: r.slug as string,
    name: r.name as string,
    status: r.status as ServiceStatus,
    publiclyListed: Boolean(r.publicly_listed),
    sortOrder: Number(r.sort_order),
  }));
}

export async function updateServiceCatalogStatus(input: {
  id: string;
  status?: ServiceStatus;
  publiclyListed?: boolean;
  enabled?: boolean;
}) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status) patch.status = input.status;
  if (typeof input.publiclyListed === "boolean") patch.publicly_listed = input.publiclyListed;
  const { data, error } = await sb
    .from("service_catalog")
    .update(patch)
    .eq("id", input.id)
    .select("id, division_id, slug, name, status, publicly_listed, sort_order")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function setCatalogEnabled(table: "equipment_types" | "equipment_attachments" | "equipment_capabilities", id: string, enabled: boolean) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb
    .from(table)
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listEquipmentCatalog(companyId = MORRIS_COMPANY_ID) {
  const sb = createAdminClient();
  if (!sb) return { types: [], attachments: [], capabilities: [] };
  const [types, attachments, capabilities] = await Promise.all([
    sb.from("equipment_types").select("*").eq("company_id", companyId).order("sort_order"),
    sb.from("equipment_attachments").select("*").eq("company_id", companyId).order("sort_order"),
    sb.from("equipment_capabilities").select("*").eq("company_id", companyId),
  ]);
  return {
    types: types.data ?? [],
    attachments: attachments.data ?? [],
    capabilities: capabilities.data ?? [],
  };
}

export async function insertEquipmentIntake(input: {
  id: string;
  companyId: string;
  estimateId: string;
  divisionId: DivisionId;
  serviceSlug?: string | null;
  kind: "land_clearing" | "site_work" | "equipment_services";
  intake: Record<string, unknown>;
  equipmentTypeId?: string | null;
  attachmentTypeId?: string | null;
  estimatedAcres?: number | null;
  vegetationDensity?: string | null;
  treeDiameterRange?: string | null;
  terrainType?: string | null;
}) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");
  const now = new Date().toISOString();
  const { error } = await sb.from("equipment_intake_details").insert({
    id: input.id,
    company_id: input.companyId,
    estimate_id: input.estimateId,
    division_id: input.divisionId,
    service_slug: input.serviceSlug ?? null,
    kind: input.kind,
    intake: input.intake,
    equipment_type_id: input.equipmentTypeId ?? null,
    attachment_type_id: input.attachmentTypeId ?? null,
    estimated_acres: input.estimatedAcres ?? null,
    vegetation_density: input.vegetationDensity ?? null,
    tree_diameter_range: input.treeDiameterRange ?? null,
    terrain_type: input.terrainType ?? null,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
}

export async function updateEquipmentIntakeOps(
  id: string,
  patch: Record<string, unknown>
) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("equipment_intake_details")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listEquipmentIntakes(companyId = MORRIS_COMPANY_ID, divisionId?: DivisionId) {
  const sb = createAdminClient();
  if (!sb) return [];
  let q = sb
    .from("equipment_intake_details")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (divisionId) q = q.eq("division_id", divisionId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data;
}

export async function getEquipmentIntakeByEstimate(estimateId: string) {
  const sb = createAdminClient();
  if (!sb) return null;
  const { data } = await sb
    .from("equipment_intake_details")
    .select("*")
    .eq("estimate_id", estimateId)
    .maybeSingle();
  return data;
}

export function estimatedMaintenanceReserve(machineHours: number, reservePerHour: number): number {
  return Math.round(machineHours * reservePerHour * 100) / 100;
}

export async function insertJobMachineHours(input: {
  id: string;
  companyId: string;
  jobId: string;
  assetId?: string | null;
  equipmentTypeId?: string | null;
  attachmentId?: string | null;
  machineStartHours?: number | null;
  machineEndHours?: number | null;
  notes?: string | null;
}) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const used =
    input.machineStartHours != null && input.machineEndHours != null
      ? Math.max(0, input.machineEndHours - input.machineStartHours)
      : null;
  const { error } = await sb.from("job_machine_hours").insert({
    id: input.id,
    company_id: input.companyId,
    job_id: input.jobId,
    asset_id: input.assetId ?? null,
    equipment_type_id: input.equipmentTypeId ?? null,
    attachment_id: input.attachmentId ?? null,
    machine_start_hours: input.machineStartHours ?? null,
    machine_end_hours: input.machineEndHours ?? null,
    machine_hours_used: used,
    notes: input.notes ?? null,
  });
  if (error) throw error;
  return { machineHoursUsed: used };
}
