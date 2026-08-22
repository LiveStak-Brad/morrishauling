/** Shared Morris Services divisions — parent company operating units. */

export const DIVISION_IDS = {
  junk_removal: "junk_removal",
  hauling: "hauling",
  land_clearing: "land_clearing",
  site_work: "site_work",
  equipment_services: "equipment_services",
} as const;

export type DivisionId = (typeof DIVISION_IDS)[keyof typeof DIVISION_IDS];

export const ALL_DIVISION_IDS = Object.values(DIVISION_IDS) as DivisionId[];

/** Maps operational service_type column values to division ids. */
export type ServiceType =
  | "junk_removal"
  | "hauling_transport"
  | "land_clearing"
  | "site_work"
  | "equipment_services";

export const SERVICE_TYPE_VALUES: ServiceType[] = [
  "junk_removal",
  "hauling_transport",
  "land_clearing",
  "site_work",
  "equipment_services",
];

export function isDivisionId(value: string | undefined | null): value is DivisionId {
  return !!value && (ALL_DIVISION_IDS as string[]).includes(value);
}

export function isEquipmentDivision(id: DivisionId): boolean {
  return id === "land_clearing" || id === "site_work" || id === "equipment_services";
}

/** Safe parse for query params / API bodies. Unknown values fall back to junk (legacy). */
export function parseDivisionId(
  raw: string | undefined | null,
  fallback: DivisionId = "junk_removal"
): DivisionId {
  if (!raw) return fallback;
  const v = raw.toLowerCase().trim();
  if (v === "hauling_transport") return "hauling";
  if (isDivisionId(v)) return v;
  return fallback;
}

export function serviceTypeToDivision(serviceType: ServiceType | string | undefined): DivisionId {
  switch (serviceType) {
    case "hauling_transport":
    case "hauling":
      return "hauling";
    case "land_clearing":
      return "land_clearing";
    case "site_work":
      return "site_work";
    case "equipment_services":
      return "equipment_services";
    case "junk_removal":
    default:
      return "junk_removal";
  }
}

export function divisionToServiceType(divisionId: DivisionId): ServiceType {
  switch (divisionId) {
    case "hauling":
      return "hauling_transport";
    case "land_clearing":
      return "land_clearing";
    case "site_work":
      return "site_work";
    case "equipment_services":
      return "equipment_services";
    default:
      return "junk_removal";
  }
}

export function divisionShortLabel(id: DivisionId): string {
  return getDivision(id).shortName;
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
const DEFAULT_EQUIPMENT_STATUS: DivisionLaunchStatus = "accepting_estimate_requests";

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
      logo: "/MorrisServicesLogo.png?v=6",
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
      logo: "/MorrisServicesLogo.png?v=6",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_HAULING_LAUNCH_STATUS ?? process.env.NEXT_PUBLIC_DIVISION_HAULING_LAUNCH_STATUS,
        DEFAULT_HAULING_STATUS
      ),
      envKey: "DIVISION_HAULING_LAUNCH_STATUS",
    },
    land_clearing: {
      id: "land_clearing",
      name: "Morris Land Clearing",
      shortName: "Land Clearing",
      serviceType: "land_clearing",
      hubPath: "/land-clearing",
      bookPath: "/book?division=land_clearing",
      logo: "/MorrisServicesLogo.png?v=6",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_LAND_CLEARING_LAUNCH_STATUS ??
          process.env.NEXT_PUBLIC_DIVISION_LAND_CLEARING_LAUNCH_STATUS,
        DEFAULT_EQUIPMENT_STATUS
      ),
      envKey: "DIVISION_LAND_CLEARING_LAUNCH_STATUS",
    },
    site_work: {
      id: "site_work",
      name: "Morris Site Work",
      shortName: "Site Work",
      serviceType: "site_work",
      hubPath: "/site-work",
      bookPath: "/book?division=site_work",
      logo: "/MorrisServicesLogo.png?v=6",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_SITE_WORK_LAUNCH_STATUS ?? process.env.NEXT_PUBLIC_DIVISION_SITE_WORK_LAUNCH_STATUS,
        DEFAULT_EQUIPMENT_STATUS
      ),
      envKey: "DIVISION_SITE_WORK_LAUNCH_STATUS",
    },
    equipment_services: {
      id: "equipment_services",
      name: "Morris Equipment Services",
      shortName: "Equipment Services",
      serviceType: "equipment_services",
      hubPath: "/equipment-services",
      bookPath: "/book?division=equipment_services",
      logo: "/MorrisServicesLogo.png?v=6",
      launchStatus: parseLaunchStatus(
        process.env.DIVISION_EQUIPMENT_SERVICES_LAUNCH_STATUS ??
          process.env.NEXT_PUBLIC_DIVISION_EQUIPMENT_SERVICES_LAUNCH_STATUS,
        DEFAULT_EQUIPMENT_STATUS
      ),
      envKey: "DIVISION_EQUIPMENT_SERVICES_LAUNCH_STATUS",
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
