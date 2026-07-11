/**
 * Public website helpers — operational by default.
 * Only APP_STATUS=prelaunch or ALLOW_PUBLIC_BOOKING=false re-closes the doors.
 */

import {
  type DivisionId,
  type DivisionLaunchStatus,
  getDivision,
} from "@/lib/divisions";
import { getDivisionLaunchStatus } from "@/lib/db/divisions";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

export type AppStatus = "prelaunch" | "live";

/** Defaults to live. Set APP_STATUS=prelaunch only for emergency freeze. */
export function getAppStatus(): AppStatus {
  const status = process.env.APP_STATUS?.toLowerCase();
  if (status === "prelaunch") return "prelaunch";
  if (process.env.NEXT_PUBLIC_APP_STATUS === "prelaunch") return "prelaunch";
  return "live";
}

export function isPrelaunch(): boolean {
  return getAppStatus() === "prelaunch";
}

/** Client-visible: operational unless explicitly frozen. */
export function isPublicPrelaunch(): boolean {
  return isPrelaunch();
}

/**
 * Live booking submissions allowed unless platform is frozen
 * or ALLOW_PUBLIC_BOOKING is explicitly false.
 */
export function isBookingSubmissionAllowed(): boolean {
  if (isPrelaunch()) return false;
  if (process.env.ALLOW_PUBLIC_BOOKING === "false") return false;
  if (process.env.NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING === "false") return false;
  return true;
}

function statusAllowsBookings(status: DivisionLaunchStatus): boolean {
  return status === "accepting_bookings";
}

function statusAllowsSubmissions(status: DivisionLaunchStatus): boolean {
  return (
    status === "accepting_bookings" ||
    status === "accepting_estimate_requests" ||
    status === "accepting_interest"
  );
}

/** Sync: division accepts public bookings (client-safe). */
export function isDivisionSubmissionAllowed(divisionId: DivisionId): boolean {
  if (!isBookingSubmissionAllowed()) return false;
  const status = getDivision(divisionId).launchStatus;
  return statusAllowsSubmissions(status) && status !== "temporarily_paused" && status !== "setup";
}

/** Server-side: prefer DB launch status. */
export async function isDivisionSubmissionAllowedAsync(divisionId: DivisionId): Promise<boolean> {
  if (!isBookingSubmissionAllowed()) return false;
  const dbStatus = await getDivisionLaunchStatus(MORRIS_COMPANY_ID, divisionId);
  const status = dbStatus ?? getDivision(divisionId).launchStatus;
  if (status === "temporarily_paused" || status === "setup" || status === "internal_testing") {
    return false;
  }
  return statusAllowsSubmissions(status);
}

/** Guaranteed appointment booking (real scheduling). */
export async function isDivisionLiveBookingAllowedAsync(divisionId: DivisionId): Promise<boolean> {
  if (!isBookingSubmissionAllowed()) return false;
  const dbStatus = await getDivisionLaunchStatus(MORRIS_COMPANY_ID, divisionId);
  const status = dbStatus ?? getDivision(divisionId).launchStatus;
  // Operational default: accepting_bookings. Also allow estimate_requests to schedule
  // preferred windows that convert after approval (no dead ends).
  return statusAllowsBookings(status) || status === "accepting_estimate_requests";
}

export function isBookingDemoMode(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): boolean {
  // Demo/preview mode disabled in production operations
  return false;
}

export function parseDivisionParam(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): DivisionId {
  const raw = searchParams.get("division")?.toLowerCase();
  if (raw === "hauling" || raw === "hauling_transport") return "hauling";
  return "junk_removal";
}

export function divisionBookingClosedMessage(divisionId: DivisionId): string {
  const d = getDivision(divisionId);
  return `${d.name} is temporarily unable to accept online bookings. Please call us.`;
}

export const PUBLIC_BOOKING_CLOSED_MESSAGE =
  "Online booking is temporarily unavailable. Please call us to schedule.";
