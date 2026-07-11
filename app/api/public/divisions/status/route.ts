import { NextResponse } from "next/server";
import { getDivisionLaunchStatus } from "@/lib/db/divisions";
import { DIVISION_IDS, type DivisionId, type DivisionLaunchStatus, getDivision } from "@/lib/divisions";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { isBookingSubmissionAllowed, isPrelaunch } from "@/lib/public-site";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export type PublicDivisionStatus = {
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

function labelsFor(status: DivisionLaunchStatus): { statusLabel: string; bookingCtaLabel: string } {
  switch (status) {
    case "accepting_bookings":
      return { statusLabel: "Now booking", bookingCtaLabel: "Book now" };
    case "accepting_estimate_requests":
      return { statusLabel: "Accepting estimates", bookingCtaLabel: "Request estimate" };
    case "accepting_interest":
      return { statusLabel: "Accepting interest", bookingCtaLabel: "Share interest" };
    case "internal_testing":
      return { statusLabel: "Internal testing", bookingCtaLabel: "Preview" };
    case "temporarily_paused":
      return { statusLabel: "Temporarily paused", bookingCtaLabel: "Contact us" };
    case "setup":
    default:
      return { statusLabel: "Coming soon", bookingCtaLabel: "Coming soon" };
  }
}

export async function resolvePublicDivisionStatus(id: DivisionId): Promise<PublicDivisionStatus> {
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

  const { statusLabel, bookingCtaLabel } = labelsFor(launchStatus);
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

  const junk = await resolvePublicDivisionStatus(DIVISION_IDS.junk_removal);
  const hauling = await resolvePublicDivisionStatus(DIVISION_IDS.hauling);

  return NextResponse.json({
    ok: true,
    data: {
      globalFrozen: isPrelaunch() || !isBookingSubmissionAllowed(),
      divisions: { junk_removal: junk, hauling },
    },
  });
}
