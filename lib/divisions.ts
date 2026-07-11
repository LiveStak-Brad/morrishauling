/** Shared Morris Services divisions — Junk Removal and Hauling. */

export const DIVISION_IDS = {
  junk_removal: "junk_removal",
  hauling: "hauling",
} as const;

export type DivisionId = (typeof DIVISION_IDS)[keyof typeof DIVISION_IDS];

/** Maps legacy service_type column values to division ids. */
export type ServiceType = "junk_removal" | "hauling_transport";

export function serviceTypeToDivision(serviceType: ServiceType | string | undefined): DivisionId {
  if (serviceType === "hauling_transport" || serviceType === "hauling") return "hauling";
  return "junk_removal";
}

export function divisionToServiceType(divisionId: DivisionId): ServiceType {
  return divisionId === "hauling" ? "hauling_transport" : "junk_removal";
}

/**
 * Operational launch status per division.
 * Public booking / estimate acceptance respects this independently of APP_STATUS.
 */
export type DivisionLaunchStatus =
  | "setup"
  | "internal_testing"
  | "accepting_interest"
  | "accepting_estimate_requests"
  | "accepting_bookings"
  | "temporarily_paused";

export type DivisionConfig = {
  id: DivisionId;
  name: string;
  shortName: string;
  serviceType: ServiceType;
  hubPath: string;
  bookPath: string;
  logo: string;
  launchStatus: DivisionLaunchStatus;
  /** Env override key, e.g. DIVISION_JUNK_LAUNCH_STATUS */
  envKey: string;
};

const DEFAULT_JUNK_STATUS: DivisionLaunchStatus = "accepting_bookings";
const DEFAULT_HAULING_STATUS: DivisionLaunchStatus = "accepting_bookings";

function parseLaunchStatus(raw: string | undefined, fallback: DivisionLaunchStatus): DivisionLaunchStatus {
  const v = raw?.toLowerCase().trim();
  const allowed: DivisionLaunchStatus[] = [
    "setup",
    "internal_testing",
    "accepting_interest",
    "accepting_estimate_requests",
    "accepting_bookings",
    "temporarily_paused",
  ];
  if (v && (allowed as string[]).includes(v)) return v as DivisionLaunchStatus;
  return fallback;
}

export function getDivisionConfigs(): Record<DivisionId, DivisionConfig> {
  return {
    junk_removal: {
      id: "junk_removal",
      name: "Morris Junk Removal",
      shortName: "Junk Removal",
      serviceType: "junk_removal",
      hubPath: "/junk-removal",
      bookPath: "/book?division=junk_removal",
      logo: "/logo.png?v=4",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_JUNK_LAUNCH_STATUS ?? process.env.NEXT_PUBLIC_DIVISION_JUNK_LAUNCH_STATUS,
        DEFAULT_JUNK_STATUS
      ),
      envKey: "DIVISION_JUNK_LAUNCH_STATUS",
    },
    hauling: {
      id: "hauling",
      name: "Morris Hauling",
      shortName: "Hauling",
      serviceType: "hauling_transport",
      hubPath: "/hauling",
      bookPath: "/book?division=hauling",
      logo: "/haulinglogo.png?v=1",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_HAULING_LAUNCH_STATUS ?? process.env.NEXT_PUBLIC_DIVISION_HAULING_LAUNCH_STATUS,
        DEFAULT_HAULING_STATUS
      ),
      envKey: "DIVISION_HAULING_LAUNCH_STATUS",
    },
  };
}

export function getDivision(id: DivisionId): DivisionConfig {
  return getDivisionConfigs()[id];
}

export function getDivisionByServiceType(serviceType: ServiceType | string | undefined): DivisionConfig {
  return getDivision(serviceTypeToDivision(serviceType));
}

/** Public can submit estimate/booking requests for this division. */
export function divisionAcceptsEstimateRequests(id: DivisionId): boolean {
  const status = getDivision(id).launchStatus;
  return status === "accepting_estimate_requests" || status === "accepting_bookings";
}

/** Public can create live scheduled bookings (not just estimate requests). */
export function divisionAcceptsBookings(id: DivisionId): boolean {
  return getDivision(id).launchStatus === "accepting_bookings";
}

export function divisionIsPubliclyActive(id: DivisionId): boolean {
  const status = getDivision(id).launchStatus;
  return (
    status === "accepting_interest" ||
    status === "accepting_estimate_requests" ||
    status === "accepting_bookings"
  );
}

export const DIVISION_LAUNCH_LABELS: Record<DivisionLaunchStatus, string> = {
  setup: "Setup",
  internal_testing: "Internal testing",
  accepting_interest: "Accepting interest",
  accepting_estimate_requests: "Accepting estimate requests",
  accepting_bookings: "Accepting bookings",
  temporarily_paused: "Temporarily paused",
};
