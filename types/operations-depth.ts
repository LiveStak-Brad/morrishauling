import type { LatLng } from "./company";

export type ShiftStatus = "clocked_in" | "clocked_out" | "on_break" | "no_show";

export interface EmployeeTimeclockEntry {
  id: string;
  companyId: string;
  employeeId: string;
  profileId?: string;
  clockInAt: string;
  clockOutAt?: string;
  shiftDate: string;
  shiftStatus: ShiftStatus;
  startLocation?: LatLng;
  endLocation?: LatLng;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceStatus = "good" | "due_soon" | "overdue" | "out_of_service";

export interface OperationalTruck {
  id: string;
  companyId: string;
  name: string;
  licensePlate?: string;
  capacity?: string;
  odometerMiles?: number;
  lastServiceAt?: string;
  nextServiceDueAt?: string;
  nextServiceDueMiles?: number;
  maintenanceStatus: MaintenanceStatus;
  maintenanceNotes?: string;
  status?: string;
}

export interface TruckMaintenanceLog {
  id: string;
  companyId: string;
  truckId: string;
  serviceType: string;
  serviceDate: string;
  odometerMiles?: number;
  cost?: number;
  vendor?: string;
  notes?: string;
  nextDueDate?: string;
  nextDueMiles?: number;
  createdAt: string;
  updatedAt: string;
}

export type CallbackStatus = "none" | "due" | "completed" | "snoozed";

export type InteractionType =
  | "call"
  | "text"
  | "email"
  | "note"
  | "review_request"
  | "follow_up";

export type InteractionDirection = "inbound" | "outbound" | "internal";

export interface CustomerInteraction {
  id: string;
  companyId: string;
  customerId: string;
  profileId?: string;
  interactionType: InteractionType;
  direction: InteractionDirection;
  subject?: string;
  body?: string;
  followUpAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DumpSiteHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

export interface OperationalDumpSite {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  location?: LatLng;
  hoursJson?: DumpSiteHours;
  isClosed: boolean;
  closureReason?: string;
  closureStartsAt?: string;
  closureEndsAt?: string;
  status?: string;
  acceptedMaterials?: string[];
  baseFee?: number;
  perTonFee?: number;
  feeType?: string;
}

export interface OperationsDepthSnapshot {
  timeclock: EmployeeTimeclockEntry[];
  trucks: OperationalTruck[];
  maintenanceLogs: TruckMaintenanceLog[];
  dumpSites: OperationalDumpSite[];
  interactions: CustomerInteraction[];
}
