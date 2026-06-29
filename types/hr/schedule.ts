export type TimeOffType =
  | "vacation"
  | "sick"
  | "personal"
  | "unpaid"
  | "holiday"
  | "bereavement"
  | "jury_duty"
  | "military_leave"
  | "personal_day"
  | "other";
export type TimeOffStatus = "pending" | "approved" | "denied" | "cancelled";

export interface EmployeeAvailability {
  id: string;
  employeeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  requestType: TimeOffType;
  startDate: string;
  endDate: string;
  hoursRequested?: number;
  reason?: string;
  status: TimeOffStatus;
  reviewedByProfileId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  partialDay?: boolean;
  managerNotes?: string;
  createdAt: string;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
}

export interface ShiftConflict {
  employeeId: string;
  conflictType: "shift_overlap" | "job_assignment" | "time_off";
  message: string;
  conflictingId?: string;
}
