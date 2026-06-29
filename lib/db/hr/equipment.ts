import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  rowToEquipmentAsset,
  rowToEquipmentCheckoutEvent,
  rowToEquipmentDamageReport,
  rowToEquipmentAssignment,
} from "@/lib/db/hr-mappers";
import type {
  EmployeeAssetSummary,
  EquipmentAsset,
  EquipmentDamageReport,
} from "@/types/hr/equipment";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

const CHECKOUT_AGREEMENT =
  "I accept responsibility for this asset, will use it per Morris Hauling policy, report damage promptly, and return it in similar condition.";

export async function listAssets(companyId: string, filters?: {
  category?: string;
  status?: string;
  assignedEmployeeId?: string;
  search?: string;
}): Promise<EquipmentAsset[]> {
  const sb = await sbWrite();
  let q = sb.from("equipment_assets").select("*").eq("company_id", companyId).order("asset_id");
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.assignedEmployeeId) q = q.eq("assigned_employee_id", filters.assignedEmployeeId);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []).map(rowToEquipmentAsset);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (a) => a.name.toLowerCase().includes(s) || a.assetId.toLowerCase().includes(s)
    );
  }
  return rows;
}

export async function getEmployeeAssets(companyId: string, employeeId: string): Promise<EmployeeAssetSummary[]> {
  const sb = await sbWrite();
  const { data: assets } = await sb
    .from("equipment_assets")
    .select("*")
    .eq("company_id", companyId)
    .eq("assigned_employee_id", employeeId)
    .neq("status", "retired");
  const { data: checkouts } = await sb
    .from("equipment_checkout_events")
    .select("*, equipment_assets(*)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .is("returned_at", null)
    .order("checkout_at", { ascending: false });

  const checkoutByAsset = new Map(
    (checkouts ?? []).map((c) => [String(c.asset_id), rowToEquipmentCheckoutEvent(c)])
  );

  return (assets ?? []).map((row) => {
    const asset = rowToEquipmentAsset(row);
    const checkout = checkoutByAsset.get(asset.id);
    return {
      asset,
      checkout,
      needsAcknowledgment: Boolean(checkout && !checkout.employeeAcknowledgedAt),
    };
  });
}

export async function assignAssetToEmployee(
  companyId: string,
  assetId: string,
  employeeId: string,
  condition = "good",
  notes?: string
) {
  const sb = await sbWrite();
  const checkoutId = id("eco");
  await sb.from("equipment_assets").update({
    assigned_employee_id: employeeId,
    status: "assigned",
    condition,
    updated_at: new Date().toISOString(),
  }).eq("company_id", companyId).eq("id", assetId);

  await sb.from("equipment_checkout_events").insert({
    id: checkoutId,
    company_id: companyId,
    asset_id: assetId,
    employee_id: employeeId,
    condition_out: condition,
    notes,
  });

  return checkoutId;
}

export async function checkoutAcknowledge(
  companyId: string,
  employeeId: string,
  checkoutEventId: string,
  signatureName: string,
  conditionConfirmed: string
) {
  const sb = await sbWrite();
  const { data: event } = await sb
    .from("equipment_checkout_events")
    .select("*")
    .eq("id", checkoutEventId)
    .eq("employee_id", employeeId)
    .single();
  if (!event) throw new Error("Checkout not found");

  await sb.from("equipment_checkout_events").update({
    employee_acknowledged_at: new Date().toISOString(),
    signature_name: signatureName.trim(),
    condition_out: conditionConfirmed,
    notes: event.notes ? `${event.notes}\n${CHECKOUT_AGREEMENT}` : CHECKOUT_AGREEMENT,
  }).eq("id", checkoutEventId);
}

export async function requestReturn(companyId: string, employeeId: string, checkoutEventId: string) {
  const sb = await sbWrite();
  await sb.from("equipment_checkout_events").update({
    return_requested_at: new Date().toISOString(),
  }).eq("id", checkoutEventId).eq("employee_id", employeeId);
}

export async function reportDamage(
  companyId: string,
  employeeId: string,
  input: {
    assetId: string;
    checkoutEventId?: string;
    severity: EquipmentDamageReport["severity"];
    description: string;
    photoPaths?: string[];
  }
) {
  const sb = await sbWrite();
  const reportId = id("edr");
  await sb.from("equipment_damage_reports").insert({
    id: reportId,
    company_id: companyId,
    asset_id: input.assetId,
    reported_by_employee_id: employeeId,
    checkout_event_id: input.checkoutEventId,
    severity: input.severity,
    description: input.description,
    photo_paths: input.photoPaths ?? [],
    status: "open",
  });

  await sb.from("equipment_assets").update({
    condition: input.severity === "total_loss" ? "out_of_service" : "fair",
    notes: input.description,
    updated_at: new Date().toISOString(),
  }).eq("id", input.assetId);

  return reportId;
}

export async function getOpenDamageReports(companyId: string): Promise<EquipmentDamageReport[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("equipment_damage_reports")
    .select("*, equipment_assets(*)")
    .eq("company_id", companyId)
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEquipmentDamageReport);
}

export async function upsertAsset(companyId: string, asset: Partial<EquipmentAsset> & { name: string; assetId: string; category: string }) {
  const sb = await sbWrite();
  const rowId = asset.id ?? id("ea");
  const { error } = await sb.from("equipment_assets").upsert({
    id: rowId,
    company_id: companyId,
    asset_id: asset.assetId,
    name: asset.name,
    category: asset.category,
    serial_number: asset.serialNumber,
    purchase_date: asset.purchaseDate,
    purchase_price: asset.purchasePrice,
    warranty_expires: asset.warrantyExpires,
    condition: asset.condition ?? "good",
    location: asset.location,
    assigned_employee_id: asset.assignedEmployeeId,
    assigned_truck_id: asset.assignedTruckId,
    notes: asset.notes,
    photo_paths: asset.photoPaths ?? [],
    expected_life_months: asset.expectedLifeMonths,
    barcode: asset.barcode,
    status: asset.status ?? "available",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return rowId;
}

export async function addMaintenanceLog(
  companyId: string,
  assetId: string,
  input: { serviceDate: string; description: string; cost?: number; vendor?: string; odometerOrHours?: number }
) {
  const sb = await sbWrite();
  const logId = id("eml");
  await sb.from("equipment_maintenance_logs").insert({
    id: logId,
    company_id: companyId,
    asset_id: assetId,
    service_date: input.serviceDate,
    description: input.description,
    cost: input.cost,
    vendor: input.vendor,
    odometer_or_hours: input.odometerOrHours,
  });
  return logId;
}

export async function getAssetCostRollup(companyId: string, assetId: string) {
  const sb = await sbWrite();
  const { data: asset } = await sb.from("equipment_assets").select("purchase_price").eq("id", assetId).single();
  const { data: logs } = await sb
    .from("equipment_maintenance_logs")
    .select("cost")
    .eq("company_id", companyId)
    .eq("asset_id", assetId);
  const purchase = Number(asset?.purchase_price ?? 0);
  const repairs = (logs ?? []).reduce((s, l) => s + Number(l.cost ?? 0), 0);
  return { purchase, repairs, total: purchase + repairs };
}

export async function getAssetById(companyId: string, assetId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("equipment_assets")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", assetId)
    .single();
  if (error) throw error;
  return rowToEquipmentAsset(data);
}

export async function retireAsset(companyId: string, assetId: string, reason?: string) {
  const sb = await sbWrite();
  await sb.from("equipment_assets").update({
    status: "retired",
    assigned_employee_id: null,
    assigned_truck_id: null,
    notes: reason,
    updated_at: new Date().toISOString(),
  }).eq("company_id", companyId).eq("id", assetId);
}

export async function adminReturnAsset(companyId: string, assetId: string, conditionIn = "good") {
  const sb = await sbWrite();
  const { data: openCheckout } = await sb
    .from("equipment_checkout_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("asset_id", assetId)
    .is("returned_at", null)
    .order("checkout_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openCheckout?.id) {
    await sb.from("equipment_checkout_events").update({
      returned_at: new Date().toISOString(),
      condition_in: conditionIn,
    }).eq("id", openCheckout.id);
  }

  await sb.from("equipment_assets").update({
    assigned_employee_id: null,
    status: "available",
    condition: conditionIn as EquipmentAsset["condition"],
    updated_at: new Date().toISOString(),
  }).eq("company_id", companyId).eq("id", assetId);
}

export async function assignAssetToTruck(companyId: string, assetId: string, truckId: string) {
  return assignAssetToFleetUnit(companyId, assetId, truckId, "truck");
}

export async function assignAssetToTrailer(companyId: string, assetId: string, trailerId: string) {
  return assignAssetToFleetUnit(companyId, assetId, trailerId, "trailer");
}

export async function assignAssetToFleetUnit(
  companyId: string,
  assetId: string,
  unitId: string,
  kind: "truck" | "trailer"
) {
  const sb = await sbWrite();
  await sb.from("equipment_assets").update({
    assigned_truck_id: kind === "truck" ? unitId : null,
    location: kind === "trailer" ? `trailer:${unitId}` : null,
    assigned_employee_id: null,
    status: "assigned",
    updated_at: new Date().toISOString(),
  }).eq("company_id", companyId).eq("id", assetId);
}

export async function markAssetCondition(
  companyId: string,
  assetId: string,
  condition: EquipmentAsset["condition"],
  status?: EquipmentAsset["status"]
) {
  const sb = await sbWrite();
  await sb.from("equipment_assets").update({
    condition,
    status: status ?? undefined,
    updated_at: new Date().toISOString(),
  }).eq("company_id", companyId).eq("id", assetId);
}

export async function deleteAsset(companyId: string, assetId: string) {
  const sb = await sbWrite();
  const { count } = await sb
    .from("equipment_checkout_events")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", assetId)
    .is("returned_at", null);
  if ((count ?? 0) > 0) throw new Error("Return asset before deleting");
  await sb.from("equipment_assets").delete().eq("company_id", companyId).eq("id", assetId);
}

export async function getLegacyEquipmentAssignments(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data } = await sb
    .from("equipment_assignments")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("assigned_at", { ascending: false });
  return (data ?? []).map(rowToEquipmentAssignment);
}
