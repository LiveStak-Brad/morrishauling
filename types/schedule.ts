export type ScheduleSlotStatus =
  | "available"
  | "limited"
  | "almost_full"
  | "full"
  | "closed";

export interface ScheduleSlot {
  id: string;
  companyId: string;
  slotDate: string;
  windowLabel: string;
  startTime: string;
  endTime: string;
  maxJobs: number;
  currentJobs: number;
  serviceArea?: string;
  routeZone?: string;
  discountAmount: number;
  discountReason?: string;
  status: ScheduleSlotStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSlotInput {
  slotDate: string;
  windowLabel: string;
  startTime: string;
  endTime: string;
  maxJobs: number;
  serviceArea?: string;
  routeZone?: string;
  discountAmount?: number;
  discountReason?: string;
  status?: ScheduleSlotStatus;
}

export const SCHEDULE_SLOT_STATUS_LABELS: Record<ScheduleSlotStatus, string> = {
  available: "Available",
  limited: "Limited",
  almost_full: "Almost full",
  full: "Full",
  closed: "Closed",
};

export function isSlotBookable(status: ScheduleSlotStatus): boolean {
  return status !== "full" && status !== "closed";
}
