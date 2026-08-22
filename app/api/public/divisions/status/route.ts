import { NextResponse } from "next/server";
import { getDivisionLaunchStatus } from "@/lib/db/divisions";
import {
  ALL_DIVISION_IDS,
  type DivisionId,
  type DivisionLaunchStatus,
  getDivision,
} from "@/lib/divisions";
import { ctaLabelForLaunchStatus } from "@/lib/equipment/status";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { isBookingSubmissionAllowed, isPrelaunch } from "@/lib/public-site";
import { enforceRateLimit } from "@/lib/api/rate-limit";

type PublicDivisionStatus = {
  id: DivisionId;
  name: string;
  launchStatus: DivisionLaunchStatus;
  hubPath: string;
  bookPath: string;
  acceptsInterest: boolean;
  acceptsEstimateRequests: boolean;
  acceptsBookings: boolean;
  publiclyActive: boolean;
  bookingCtaLabel: string;
  statusLabel: string;
};

function labelsFor(
  status: DivisionLaunchStatus,
  id: DivisionId
): { statusLabel: string; bookingCtaLabel: string } {
  return ctaLabelForLaunchStatus(status, id);
}

async function resolvePublicDivisionStatus(id: DivisionId): Promise<PublicDivisionStatus> {
  const config = getDivision(id);
  // DB is source of truth; env defaults only when DB row missing
  const dbStatus = await getDivisionLaunchStatus(MORRIS_COMPANY_ID, id);
  let launchStatus = dbStatus ?? config.launchStatus;

  // Emergency global freeze
  if (isPrelaunch() || !isBookingSubmissionAllowed()) {
    if (launchStatus === "accepting_bookings" || launchStatus === "accepting_estimate_requests") {
      launchStatus = "accepting_interest";
    }
  }

  const { statusLabel, bookingCtaLabel } = labelsFor(launchStatus, id);
  return {
    id,
    name: config.name,
    launchStatus,
    hubPath: config.hubPath,
    bookPath: config.bookPath,
    acceptsInterest:
      launchStatus === "accepting_interest" ||
      launchStatus === "accepting_estimate_requests" ||
      launchStatus === "accepting_bookings",
    acceptsEstimateRequests:
      launchStatus === "accepting_estimate_requests" || launchStatus === "accepting_bookings",
    acceptsBookings: launchStatus === "accepting_bookings",
    publiclyActive:
      launchStatus === "accepting_interest" ||
      launchStatus === "accepting_estimate_requests" ||
      launchStatus === "accepting_bookings",
    bookingCtaLabel,
    statusLabel,
  };
}

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "public-divisions-status",
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const divisions = Object.fromEntries(
    await Promise.all(
      ALL_DIVISION_IDS.map(async (id) => [id, await resolvePublicDivisionStatus(id)] as const)
    )
  );

  return NextResponse.json({
    ok: true,
    data: {
      globalFrozen: isPrelaunch() || !isBookingSubmissionAllowed(),
      divisions,
    },
  });
}
