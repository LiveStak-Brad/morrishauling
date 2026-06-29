import { addDays, format, subDays } from "date-fns";
import { MORRIS_COMPANY_ID, morrisConfig } from "@/lib/morris-config";
import type {
  CallbackStatus,
  CustomerInteraction,
  EmployeeTimeclockEntry,
  OperationalDumpSite,
  OperationalTruck,
  TruckMaintenanceLog,
} from "@/types/operations-depth";
import type { Customer } from "@/types/user";

const now = new Date().toISOString();
const today = format(new Date(), "yyyy-MM-dd");

type DepthStore = {
  timeclock: EmployeeTimeclockEntry[];
  trucks: OperationalTruck[];
  maintenanceLogs: TruckMaintenanceLog[];
  dumpSites: OperationalDumpSite[];
  interactions: CustomerInteraction[];
  customerCallbacks: Record<string, { callbackDueAt?: string; callbackNotes?: string; callbackStatus: CallbackStatus }>;
};

const store: DepthStore = {
  timeclock: [
    {
      id: "tc-m1",
      companyId: MORRIS_COMPANY_ID,
      employeeId: "emp-m2",
      clockInAt: new Date(new Date().setHours(7, 15, 0, 0)).toISOString(),
      shiftDate: today,
      shiftStatus: "clocked_in",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "tc-m2",
      companyId: MORRIS_COMPANY_ID,
      employeeId: "emp-m3",
      clockInAt: new Date(new Date().setHours(7, 30, 0, 0)).toISOString(),
      shiftDate: today,
      shiftStatus: "clocked_in",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "tc-m3",
      companyId: MORRIS_COMPANY_ID,
      employeeId: "emp-m1",
      clockInAt: subDays(new Date(), 1).toISOString(),
      clockOutAt: subDays(new Date(), 1).toISOString(),
      shiftDate: format(subDays(new Date(), 1), "yyyy-MM-dd"),
      shiftStatus: "clocked_out",
      createdAt: now,
      updatedAt: now,
    },
  ],
  trucks: morrisConfig.trucks.map((t, i) => ({
    id: t.id,
    companyId: MORRIS_COMPANY_ID,
    name: t.name,
    licensePlate: t.licensePlate,
    capacity: t.capacity,
    odometerMiles: i === 0 ? 84200 : 61500,
    lastServiceAt: format(subDays(new Date(), 45), "yyyy-MM-dd"),
    nextServiceDueAt: i === 0 ? format(subDays(new Date(), 2), "yyyy-MM-dd") : format(addDays(new Date(), 14), "yyyy-MM-dd"),
    nextServiceDueMiles: i === 0 ? 85000 : 70000,
    maintenanceStatus: i === 0 ? "overdue" : "due_soon",
    maintenanceNotes: i === 0 ? "Oil change and brake inspection overdue" : "Scheduled service in 2 weeks",
  })),
  maintenanceLogs: [
    {
      id: "tml-m1",
      companyId: MORRIS_COMPANY_ID,
      truckId: "truck-m1",
      serviceType: "Oil change & inspection",
      serviceDate: format(subDays(new Date(), 120), "yyyy-MM-dd"),
      odometerMiles: 82000,
      cost: 285,
      vendor: "Warrenton Fleet Service",
      notes: "Full synthetic oil, tire rotation",
      nextDueDate: format(subDays(new Date(), 2), "yyyy-MM-dd"),
      nextDueMiles: 85000,
      createdAt: now,
      updatedAt: now,
    },
  ],
  dumpSites: morrisConfig.dumpSites.map((d, i) => ({
    id: d.id,
    name: d.name,
    address: d.address,
    city: d.city,
    state: d.state,
    location: d.location,
    hoursJson: {
      mon: "7:00 AM – 5:00 PM",
      tue: "7:00 AM – 5:00 PM",
      wed: "7:00 AM – 5:00 PM",
      thu: "7:00 AM – 5:00 PM",
      fri: "7:00 AM – 5:00 PM",
      sat: "8:00 AM – 12:00 PM",
      sun: "Closed",
    },
    isClosed: i === 1,
    closureReason: i === 1 ? "Paving work — reopening Monday" : undefined,
    closureStartsAt: i === 1 ? subDays(new Date(), 1).toISOString() : undefined,
    closureEndsAt: i === 1 ? addDays(new Date(), 2).toISOString() : undefined,
    status: d.status,
    acceptedMaterials: d.acceptedMaterials,
    baseFee: d.baseFee,
    perTonFee: d.perTonFee,
    feeType: d.feeType,
  })),
  interactions: [
    {
      id: "ci-m1",
      companyId: MORRIS_COMPANY_ID,
      customerId: "cust-m1",
      interactionType: "call",
      direction: "outbound",
      subject: "Estimate follow-up",
      body: "Confirmed flexible window pricing for estate cleanout.",
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: now,
    },
  ],
  customerCallbacks: {
    "cust-m1": {
      callbackDueAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      callbackNotes: "Confirm appliance disposal pricing",
      callbackStatus: "due",
    },
  },
};

function getStore(_companyId: string) {
  return store;
}

export function getTimeclockEntries(
  companyId: string,
  filters?: { shiftDate?: string; employeeId?: string }
) {
  let rows = getStore(companyId).timeclock;
  if (filters?.shiftDate) rows = rows.filter((r) => r.shiftDate === filters.shiftDate);
  if (filters?.employeeId) rows = rows.filter((r) => r.employeeId === filters.employeeId);
  return rows;
}

export function mockClockIn(entry: EmployeeTimeclockEntry) {
  getStore(entry.companyId).timeclock.unshift(entry);
  return entry;
}

export function mockClockOut(companyId: string, entryId: string) {
  const s = getStore(companyId);
  const idx = s.timeclock.findIndex((e) => e.id === entryId);
  if (idx === -1) throw new Error("Timeclock entry not found");
  s.timeclock[idx] = {
    ...s.timeclock[idx],
    clockOutAt: new Date().toISOString(),
    shiftStatus: "clocked_out",
    updatedAt: new Date().toISOString(),
  };
  return s.timeclock[idx];
}

export function getOperationalTrucks(companyId: string) {
  return getStore(companyId).trucks;
}

export function mockUpdateTruck(companyId: string, truckId: string, updates: Partial<OperationalTruck>) {
  const s = getStore(companyId);
  const idx = s.trucks.findIndex((t) => t.id === truckId);
  if (idx === -1) throw new Error("Truck not found");
  s.trucks[idx] = { ...s.trucks[idx], ...updates };
  return s.trucks[idx];
}

export function getMaintenanceLogs(companyId: string, truckId?: string) {
  let logs = getStore(companyId).maintenanceLogs;
  if (truckId) logs = logs.filter((l) => l.truckId === truckId);
  return logs;
}

export function mockCreateMaintenanceLog(log: TruckMaintenanceLog) {
  getStore(log.companyId).maintenanceLogs.unshift(log);
  return log;
}

export function getDumpSiteOps(companyId: string) {
  return getStore(companyId).dumpSites;
}

export function mockUpdateDumpSite(companyId: string, id: string, updates: Partial<OperationalDumpSite>) {
  const s = getStore(companyId);
  const idx = s.dumpSites.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error("Dump site not found");
  s.dumpSites[idx] = { ...s.dumpSites[idx], ...updates };
  return s.dumpSites[idx];
}

export function getCustomerInteractions(companyId: string, customerId?: string) {
  let rows = getStore(companyId).interactions;
  if (customerId) rows = rows.filter((i) => i.customerId === customerId);
  return rows;
}

export function mockCreateInteraction(interaction: CustomerInteraction) {
  getStore(interaction.companyId).interactions.unshift(interaction);
  return interaction;
}

export function mockUpdateCustomerCallback(
  companyId: string,
  customerId: string,
  updates: {
    callbackDueAt?: string | null;
    callbackNotes?: string;
    callbackStatus?: CallbackStatus;
  }
) {
  const s = getStore(companyId);
  s.customerCallbacks[customerId] = {
    ...s.customerCallbacks[customerId],
    callbackStatus: updates.callbackStatus ?? s.customerCallbacks[customerId]?.callbackStatus ?? "none",
    callbackDueAt: updates.callbackDueAt ?? s.customerCallbacks[customerId]?.callbackDueAt,
    callbackNotes: updates.callbackNotes ?? s.customerCallbacks[customerId]?.callbackNotes,
  };
}

export function applyCustomerCallbackFields(companyId: string, customers: Customer[]): Customer[] {
  const callbacks = getStore(companyId).customerCallbacks;
  return customers.map((c) => {
    const cb = callbacks[c.id];
    if (!cb) return c;
    return { ...c, ...cb };
  });
}

export function getCustomerCallback(companyId: string, customerId: string) {
  return getStore(companyId).customerCallbacks[customerId];
}

export function getMockOperationsDepthSnapshot(companyId: string): import("@/types/operations-depth").OperationsDepthSnapshot {
  return {
    timeclock: getTimeclockEntries(companyId),
    trucks: getOperationalTrucks(companyId),
    maintenanceLogs: getMaintenanceLogs(companyId),
    dumpSites: getDumpSiteOps(companyId),
    interactions: getCustomerInteractions(companyId),
  };
}
