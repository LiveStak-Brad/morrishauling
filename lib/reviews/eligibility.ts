import type { ServiceType } from "@/lib/divisions";
import { isEquipmentDivision, serviceTypeToDivision } from "@/lib/divisions";

/**
 * Jobs that may receive a legitimate post-completion review request.
 * Does not send reviews. Does not fabricate testimonials.
 */
export function jobEligibleForReviewRequest(serviceType: ServiceType | string | undefined): boolean {
  const division = serviceTypeToDivision(serviceType);
  return (
    division === "junk_removal" ||
    division === "hauling" ||
    isEquipmentDivision(division)
  );
}
