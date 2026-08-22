import type { DivisionId, DivisionLaunchStatus } from "@/lib/divisions";
import { isEquipmentDivision } from "@/lib/divisions";
import type { ServiceStatus } from "@/types/equipment";
import { SERVICE_STATUS_LABELS } from "@/types/equipment";

export function ctaLabelForLaunchStatus(
  status: DivisionLaunchStatus,
  divisionId: DivisionId
): { statusLabel: string; bookingCtaLabel: string } {
  const equipment = isEquipmentDivision(divisionId);
  switch (status) {
    case "accepting_bookings":
      return {
        statusLabel: "Available",
        bookingCtaLabel: equipment ? "Request an Estimate" : "Book now",
      };
    case "accepting_estimate_requests":
      return {
        statusLabel: "Estimates Available",
        bookingCtaLabel: "Request an Estimate",
      };
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

export function ctaLabelForServiceStatus(status: ServiceStatus, fallback?: string): string {
  switch (status) {
    case "active":
      return fallback ?? "Request an Estimate";
    case "accepting_estimates":
      return fallback ?? "Request an Estimate";
    case "temporarily_unavailable":
      return "Contact us";
    case "coming_soon":
    default:
      return "Coming soon";
  }
}

export function serviceStatusBadge(status: ServiceStatus): string {
  return SERVICE_STATUS_LABELS[status];
}

export function serviceIsRequestable(status: ServiceStatus): boolean {
  return status === "active" || status === "accepting_estimates";
}
