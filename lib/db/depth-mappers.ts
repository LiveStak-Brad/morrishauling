import type {
  CustomerInteraction,
  EmployeeTimeclockEntry,
  OperationalDumpSite,
  OperationalTruck,
  TruckMaintenanceLog,
} from "@/types/operations-depth";

export function rowToTimeclock(row: Record<string, unknown>): EmployeeTimeclockEntry {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    employeeId: row.employee_id as string,
    profileId: (row.profile_id as string) ?? undefined,
    clockInAt: row.clock_in_at as string,
    clockOutAt: (row.clock_out_at as string) ?? undefined,
    shiftDate: row.shift_date as string,
    shiftStatus: row.shift_status as EmployeeTimeclockEntry["shiftStatus"],
    startLocation: row.start_location as EmployeeTimeclockEntry["startLocation"],
    endLocation: row.end_location as EmployeeTimeclockEntry["endLocation"],
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToOperationalTruck(row: Record<string, unknown>): OperationalTruck {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: row.name as string,
    licensePlate: (row.license_plate as string) ?? undefined,
    capacity: (row.model as string) ?? undefined,
    odometerMiles: row.odometer_miles != null ? Number(row.odometer_miles) : Number(row.mileage ?? 0) || undefined,
    lastServiceAt: (row.last_service_at as string) ?? undefined,
    nextServiceDueAt: (row.next_service_due_at as string) ?? undefined,
    nextServiceDueMiles: row.next_service_due_miles != null ? Number(row.next_service_due_miles) : undefined,
    maintenanceStatus: (row.maintenance_status as OperationalTruck["maintenanceStatus"]) ?? "good",
    maintenanceNotes: (row.maintenance_notes as string) ?? undefined,
    status: (row.status as string) ?? undefined,
  };
}

export function rowToMaintenanceLog(row: Record<string, unknown>): TruckMaintenanceLog {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    truckId: row.truck_id as string,
    serviceType: row.service_type as string,
    serviceDate: row.service_date as string,
    odometerMiles: row.odometer_miles != null ? Number(row.odometer_miles) : undefined,
    cost: row.cost != null ? Number(row.cost) : undefined,
    vendor: (row.vendor as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    nextDueDate: (row.next_due_date as string) ?? undefined,
    nextDueMiles: row.next_due_miles != null ? Number(row.next_due_miles) : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToOperationalDumpSite(row: Record<string, unknown>): OperationalDumpSite {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    location:
      row.latitude != null && row.longitude != null
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : undefined,
    hoursJson: (row.hours_json as OperationalDumpSite["hoursJson"]) ?? {},
    isClosed: Boolean(row.is_closed),
    closureReason: (row.closure_reason as string) ?? undefined,
    closureStartsAt: (row.closure_starts_at as string) ?? undefined,
    closureEndsAt: (row.closure_ends_at as string) ?? undefined,
    status: (row.status as string) ?? undefined,
    acceptedMaterials: (row.accepted_materials as string[]) ?? [],
    baseFee: row.base_fee != null ? Number(row.base_fee) : undefined,
    perTonFee: row.per_ton_fee != null ? Number(row.per_ton_fee) : undefined,
    feeType: (row.fee_type as string) ?? undefined,
  };
}

export function rowToCustomerInteraction(row: Record<string, unknown>): CustomerInteraction {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    customerId: row.customer_id as string,
    profileId: (row.profile_id as string) ?? undefined,
    interactionType: row.interaction_type as CustomerInteraction["interactionType"],
    direction: row.direction as CustomerInteraction["direction"],
    subject: (row.subject as string) ?? undefined,
    body: (row.body as string) ?? undefined,
    followUpAt: (row.follow_up_at as string) ?? undefined,
    completedAt: (row.completed_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function maintenanceLogToRow(log: TruckMaintenanceLog) {
  return {
    id: log.id,
    company_id: log.companyId,
    truck_id: log.truckId,
    service_type: log.serviceType,
    service_date: log.serviceDate,
    odometer_miles: log.odometerMiles ?? null,
    cost: log.cost ?? null,
    vendor: log.vendor ?? null,
    notes: log.notes ?? null,
    next_due_date: log.nextDueDate ?? null,
    next_due_miles: log.nextDueMiles ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function timeclockToRow(entry: EmployeeTimeclockEntry) {
  return {
    id: entry.id,
    company_id: entry.companyId,
    employee_id: entry.employeeId,
    profile_id: entry.profileId ?? null,
    clock_in_at: entry.clockInAt,
    clock_out_at: entry.clockOutAt ?? null,
    shift_date: entry.shiftDate,
    shift_status: entry.shiftStatus,
    start_location: entry.startLocation ?? null,
    end_location: entry.endLocation ?? null,
    notes: entry.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function interactionToRow(i: CustomerInteraction) {
  return {
    id: i.id,
    company_id: i.companyId,
    customer_id: i.customerId,
    profile_id: i.profileId ?? null,
    interaction_type: i.interactionType,
    direction: i.direction,
    subject: i.subject ?? null,
    body: i.body ?? null,
    follow_up_at: i.followUpAt ?? null,
    completed_at: i.completedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}
