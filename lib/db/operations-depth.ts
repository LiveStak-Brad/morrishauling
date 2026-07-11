import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { isDbReady } from "@/lib/db/operations";
import { logActivity } from "@/lib/db/activity";
import { businessDateString } from "@/lib/datetime/business-timezone";
import {
  interactionToRow,
  maintenanceLogToRow,
  rowToCustomerInteraction,
  rowToMaintenanceLog,
  rowToOperationalDumpSite,
  rowToOperationalTruck,
  rowToTimeclock,
  timeclockToRow,
} from "@/lib/db/depth-mappers";
import { morrisConfig } from "@/lib/morris-config";
import type {
  CallbackStatus,
  CustomerInteraction,
  EmployeeTimeclockEntry,
  MaintenanceStatus,
  OperationalDumpSite,
  OperationalTruck,
  OperationsDepthSnapshot,
  TruckMaintenanceLog,
} from "@/types/operations-depth";
import {
  getCustomerInteractions as mockGetInteractions,
  getDumpSiteOps as mockGetDumpSiteOps,
  getMaintenanceLogs as mockGetMaintenanceLogs,
  getOperationalTrucks as mockGetOperationalTrucks,
  getTimeclockEntries as mockGetTimeclockEntries,
  mockClockIn,
  mockClockOut,
  mockCreateInteraction,
  mockCreateMaintenanceLog,
  mockUpdateCustomerCallback,
  mockUpdateDumpSite,
  mockUpdateTruck,
} from "@/lib/mock-operations-depth";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

function demoOr<T>(value: T, empty: T): T {
  return isDemoDataEnabled() ? value : empty;
}

export async function getOperationsDepthSnapshot(companyId: string): Promise<OperationsDepthSnapshot> {
  const [timeclock, trucks, maintenanceLogs, dumpSites, interactions] = await Promise.all([
    getTimeclockEntries(companyId),
    getOperationalTrucks(companyId),
    getMaintenanceLogs(companyId),
    getOperationalDumpSites(companyId),
    getCustomerInteractions(companyId),
  ]);
  return { timeclock, trucks, maintenanceLogs, dumpSites, interactions };
}

export async function getTimeclockEntries(
  companyId: string,
  filters?: { shiftDate?: string; employeeId?: string }
): Promise<EmployeeTimeclockEntry[]> {
  if (!(await isDbReady())) return demoOr(mockGetTimeclockEntries(companyId, filters), []);

  let query = (await createClient())
    .from("employee_timeclock")
    .select("*")
    .eq("company_id", companyId)
    .order("clock_in_at", { ascending: false });
  if (filters?.shiftDate) query = query.eq("shift_date", filters.shiftDate);
  if (filters?.employeeId) query = query.eq("employee_id", filters.employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToTimeclock);
}

export async function getActiveTimeclockForEmployee(
  companyId: string,
  employeeId: string
): Promise<EmployeeTimeclockEntry | undefined> {
  const entries = await getTimeclockEntries(companyId, { employeeId });
  return entries.find((e) => e.shiftStatus === "clocked_in" || e.shiftStatus === "on_break");
}

export async function clockIn(
  companyId: string,
  params: { employeeId: string; profileId?: string; notes?: string },
  options?: { actorProfileId?: string }
): Promise<EmployeeTimeclockEntry> {
  const today = businessDateString(new Date());
  const existing = await getActiveTimeclockForEmployee(companyId, params.employeeId);
  if (existing) throw new Error("Already clocked in");

  const entry: EmployeeTimeclockEntry = {
    id: id("tc"),
    companyId,
    employeeId: params.employeeId,
    profileId: params.profileId,
    clockInAt: new Date().toISOString(),
    shiftDate: today,
    shiftStatus: "clocked_in",
    notes: params.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!(await isDbReady())) {
    const saved = mockClockIn(entry);
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? params.profileId,
      entityType: "employee",
      entityId: params.employeeId,
      action: "clocked_in",
      message: "Employee clocked in",
      metadata: { timeclockId: saved.id },
    });
    return saved;
  }

  const { data, error } = await (await sbWrite())
    .from("employee_timeclock")
    .insert(timeclockToRow(entry))
    .select("*")
    .single();
  if (error) throw error;
  const saved = rowToTimeclock(data);
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId ?? params.profileId,
    entityType: "employee",
    entityId: params.employeeId,
    action: "clocked_in",
    message: "Employee clocked in",
    metadata: { timeclockId: saved.id },
  });
  return saved;
}

export async function clockOut(
  companyId: string,
  params: { employeeId: string; profileId?: string },
  options?: { actorProfileId?: string }
): Promise<EmployeeTimeclockEntry> {
  const active = await getActiveTimeclockForEmployee(companyId, params.employeeId);
  if (!active) throw new Error("Not clocked in");

  if (!(await isDbReady())) {
    const saved = mockClockOut(companyId, active.id);
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? params.profileId,
      entityType: "employee",
      entityId: params.employeeId,
      action: "clocked_out",
      message: "Employee clocked out",
      metadata: { timeclockId: saved.id },
    });
    return saved;
  }

  const { data, error } = await (await sbWrite())
    .from("employee_timeclock")
    .update({
      clock_out_at: new Date().toISOString(),
      shift_status: "clocked_out",
      updated_at: new Date().toISOString(),
    })
    .eq("id", active.id)
    .select("*")
    .single();
  if (error) throw error;
  const saved = rowToTimeclock(data);
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId ?? params.profileId,
    entityType: "employee",
    entityId: params.employeeId,
    action: "clocked_out",
    message: "Employee clocked out",
    metadata: { timeclockId: saved.id },
  });
  return saved;
}

export async function getOperationalTrucks(companyId: string): Promise<OperationalTruck[]> {
  if (!(await isDbReady())) return demoOr(mockGetOperationalTrucks(companyId), []);

  const { data, error } = await (await createClient())
    .from("trucks")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  if (!data?.length) return isDemoDataEnabled() ? mockGetOperationalTrucks(companyId) : [];
  return data.map(rowToOperationalTruck);
}

export async function updateOperationalTruck(
  companyId: string,
  truckId: string,
  updates: Partial<OperationalTruck>
): Promise<OperationalTruck> {
  if (!(await isDbReady())) {
    return mockUpdateTruck(companyId, truckId, updates);
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.odometerMiles != null) row.odometer_miles = updates.odometerMiles;
  if (updates.lastServiceAt != null) row.last_service_at = updates.lastServiceAt;
  if (updates.nextServiceDueAt != null) row.next_service_due_at = updates.nextServiceDueAt;
  if (updates.nextServiceDueMiles != null) row.next_service_due_miles = updates.nextServiceDueMiles;
  if (updates.maintenanceStatus != null) row.maintenance_status = updates.maintenanceStatus;
  if (updates.maintenanceNotes != null) row.maintenance_notes = updates.maintenanceNotes;

  const { data, error } = await (await sbWrite())
    .from("trucks")
    .update(row)
    .eq("company_id", companyId)
    .eq("id", truckId)
    .select("*")
    .single();
  if (error) throw error;
  return rowToOperationalTruck(data);
}

export async function getMaintenanceLogs(companyId: string, truckId?: string): Promise<TruckMaintenanceLog[]> {
  if (!(await isDbReady())) return demoOr(mockGetMaintenanceLogs(companyId, truckId), []);

  let query = (await createClient())
    .from("truck_maintenance_logs")
    .select("*")
    .eq("company_id", companyId)
    .order("service_date", { ascending: false });
  if (truckId) query = query.eq("truck_id", truckId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToMaintenanceLog);
}

export async function createMaintenanceLog(
  companyId: string,
  input: Omit<TruckMaintenanceLog, "id" | "companyId" | "createdAt" | "updatedAt">,
  options?: { actorProfileId?: string }
): Promise<TruckMaintenanceLog> {
  const log: TruckMaintenanceLog = {
    ...input,
    id: id("tml"),
    companyId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let maintenanceStatus: MaintenanceStatus = "good";
  const today = format(new Date(), "yyyy-MM-dd");
  if (input.nextDueDate && input.nextDueDate <= today) maintenanceStatus = "overdue";
  else if (input.nextDueDate) maintenanceStatus = "due_soon";

  if (!(await isDbReady())) {
    const saved = mockCreateMaintenanceLog(log);
    mockUpdateTruck(companyId, input.truckId, {
      lastServiceAt: input.serviceDate,
      nextServiceDueAt: input.nextDueDate,
      nextServiceDueMiles: input.nextDueMiles,
      odometerMiles: input.odometerMiles,
      maintenanceStatus,
    });
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "truck",
      entityId: input.truckId,
      action: "maintenance_logged",
      message: `Maintenance logged — ${input.serviceType}`,
      metadata: { logId: saved.id, cost: input.cost },
    });
    return saved;
  }

  await (await sbWrite()).from("truck_maintenance_logs").insert(maintenanceLogToRow(log));
  await updateOperationalTruck(companyId, input.truckId, {
    lastServiceAt: input.serviceDate,
    nextServiceDueAt: input.nextDueDate,
    nextServiceDueMiles: input.nextDueMiles,
    odometerMiles: input.odometerMiles,
    maintenanceStatus,
  });
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "truck",
    entityId: input.truckId,
    action: "maintenance_logged",
    message: `Maintenance logged — ${input.serviceType}`,
    metadata: { logId: log.id, cost: input.cost },
  });
  return log;
}

export async function getOperationalDumpSites(companyId: string): Promise<OperationalDumpSite[]> {
  if (!(await isDbReady())) return demoOr(mockGetDumpSiteOps(companyId), []);

  const { data, error } = await (await createClient())
    .from("dump_sites")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  if (!data?.length) return isDemoDataEnabled() ? mockGetDumpSiteOps(companyId) : [];
  return data.map(rowToOperationalDumpSite);
}

export async function updateOperationalDumpSite(
  companyId: string,
  dumpSiteId: string,
  updates: Partial<OperationalDumpSite>,
  options?: { actorProfileId?: string }
): Promise<OperationalDumpSite> {
  if (!(await isDbReady())) {
    return mockUpdateDumpSite(companyId, dumpSiteId, updates);
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.hoursJson != null) row.hours_json = updates.hoursJson;
  if (updates.isClosed != null) row.is_closed = updates.isClosed;
  if (updates.closureReason !== undefined) row.closure_reason = updates.closureReason;
  if (updates.closureStartsAt !== undefined) row.closure_starts_at = updates.closureStartsAt;
  if (updates.closureEndsAt !== undefined) row.closure_ends_at = updates.closureEndsAt;

  const { data, error } = await (await sbWrite())
    .from("dump_sites")
    .update(row)
    .eq("company_id", companyId)
    .eq("id", dumpSiteId)
    .select("*")
    .single();
  if (error) throw error;
  const site = rowToOperationalDumpSite(data);
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "dump_site",
    entityId: dumpSiteId,
    action: updates.isClosed ? "closed" : "updated",
    message: updates.isClosed ? `Dump site closed — ${site.name}` : `Dump site updated — ${site.name}`,
  });
  return site;
}

export async function getCustomerInteractions(
  companyId: string,
  customerId?: string
): Promise<CustomerInteraction[]> {
  if (!(await isDbReady())) return demoOr(mockGetInteractions(companyId, customerId), []);

  let query = (await createClient())
    .from("customer_interactions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToCustomerInteraction);
}

export async function createCustomerInteraction(
  companyId: string,
  input: Omit<CustomerInteraction, "id" | "companyId" | "createdAt" | "updatedAt">,
  options?: { actorProfileId?: string }
): Promise<CustomerInteraction> {
  const interaction: CustomerInteraction = {
    ...input,
    id: id("ci"),
    companyId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!(await isDbReady())) {
    const saved = mockCreateInteraction(interaction);
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? input.profileId,
      entityType: "customer",
      entityId: input.customerId,
      action: "interaction",
      message: `${input.interactionType} — ${input.subject ?? "Customer interaction"}`,
    });
    return saved;
  }

  await (await sbWrite()).from("customer_interactions").insert(interactionToRow(interaction));
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId ?? input.profileId,
    entityType: "customer",
    entityId: input.customerId,
    action: "interaction",
    message: `${input.interactionType} — ${input.subject ?? "Customer interaction"}`,
  });
  return interaction;
}

export async function updateCustomerCallback(
  companyId: string,
  customerId: string,
  updates: {
    callbackDueAt?: string | null;
    callbackNotes?: string;
    callbackStatus?: CallbackStatus;
  },
  options?: { actorProfileId?: string }
): Promise<void> {
  if (!(await isDbReady())) {
    mockUpdateCustomerCallback(companyId, customerId, updates);
  } else {
    await (await sbWrite())
      .from("customers")
      .update({
        callback_due_at: updates.callbackDueAt ?? null,
        callback_notes: updates.callbackNotes ?? null,
        callback_status: updates.callbackStatus ?? "none",
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("id", customerId);
  }

  if (updates.callbackStatus === "completed") {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "customer",
      entityId: customerId,
      action: "callback_completed",
      message: "Customer callback completed",
    });
  }
}

export async function createOperationalDumpSite(
  companyId: string,
  input: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    baseFee?: number;
    perTonFee?: number;
    feeType?: string;
  },
  options?: { actorProfileId?: string }
): Promise<OperationalDumpSite> {
  const siteId = id("dump");
  const row = {
    id: siteId,
    company_id: companyId,
    name: input.name,
    address: input.address,
    city: input.city,
    state: input.state ?? "MO",
    zip: input.zip,
    base_fee: input.baseFee,
    per_ton_fee: input.perTonFee,
    fee_type: input.feeType ?? "flat",
    status: "active",
    hours_json: {},
    is_closed: false,
  };
  const { data, error } = await (await sbWrite()).from("dump_sites").insert(row).select("*").single();
  if (error) throw error;
  const site = rowToOperationalDumpSite(data);
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "dump_site",
    entityId: siteId,
    action: "created",
    message: `Dump site created — ${input.name}`,
  });
  return site;
}

export async function createOperationalTruck(
  companyId: string,
  input: { name: string; licensePlate?: string; make?: string; model?: string; year?: number },
  options?: { actorProfileId?: string }
) {
  const truckId = id("truck");
  const { data, error } = await (await sbWrite())
    .from("trucks")
    .insert({
      id: truckId,
      company_id: companyId,
      name: input.name,
      license_plate: input.licensePlate,
      make: input.make,
      model: input.model,
      year: input.year,
      status: "active",
      maintenance_status: "good",
    })
    .select("*")
    .single();
  if (error) throw error;
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "truck",
    entityId: truckId,
    action: "created",
    message: `Truck created — ${input.name}`,
  });
  return rowToOperationalTruck(data);
}

export async function getOperationalTrailers(companyId: string) {
  if (!(await isDbReady())) {
    if (!isDemoDataEnabled()) return [];
    return morrisConfig.trailers.map((t) => ({
      id: t.id,
      name: t.name,
      type: "trailer",
      status: "active",
      licensePlate: undefined as string | undefined,
    }));
  }
  const { data, error } = await (await createClient())
    .from("trailers")
    .select("id, name, trailer_type, status, license_plate")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: String(t.id),
    name: String(t.name),
    type: String(t.trailer_type ?? "trailer"),
    status: String(t.status ?? "active"),
    licensePlate: t.license_plate as string | undefined,
  }));
}

export async function createOperationalTrailer(
  companyId: string,
  input: { name: string; trailerType?: string; licensePlate?: string },
  options?: { actorProfileId?: string }
) {
  const trailerId = id("trailer");
  const { data, error } = await (await sbWrite())
    .from("trailers")
    .insert({
      id: trailerId,
      company_id: companyId,
      name: input.name,
      trailer_type: input.trailerType ?? "dump",
      license_plate: input.licensePlate,
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw error;
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "trailer",
    entityId: trailerId,
    action: "created",
    message: `Trailer created — ${input.name}`,
  });
  return {
    id: String(data.id),
    name: String(data.name),
    type: String(data.trailer_type),
    status: String(data.status),
    licensePlate: data.license_plate as string | undefined,
  };
}
