export type PunchType =
  | "clock_in"
  | "clock_out"
  | "lunch_out"
  | "lunch_in"
  | "break_start"
  | "break_end";

export interface TimeclockPunch {
  id: string;
  timeclockId: string;
  employeeId: string;
  punchType: PunchType;
  punchedAt: string;
  location?: Record<string, unknown>;
  deviceInfo?: Record<string, unknown>;
  photoPath?: string;
}

export interface TimesheetAdjustment {
  id: string;
  employeeId: string;
  punchId?: string;
  originalPunchedAt?: string;
  proposedPunchedAt: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedByProfileId?: string;
  reviewedByProfileId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface PunchPayload {
  employeeId: string;
  punchType: PunchType;
  location?: Record<string, unknown>;
  deviceInfo?: Record<string, unknown>;
}
