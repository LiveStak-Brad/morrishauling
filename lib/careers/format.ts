import type { JobPosting } from "@/types/hr/ats";
import { EMPLOYMENT_LABELS } from "./constants";

export function formatPayRange(posting: JobPosting, opts?: { prelaunch?: boolean }): string {
  let value: string;
  if (posting.payNote) value = posting.payNote;
  else if (posting.payRangeMin != null) {
    const unit = posting.payRangeUnit === "hourly" ? "hr" : "yr";
    if (posting.payRangeMax != null) {
      value = `$${posting.payRangeMin}–$${posting.payRangeMax}/${unit}`;
    } else {
      value = `$${posting.payRangeMin}+/${unit}`;
    }
  } else {
    value = "Pay based on experience";
  }
  if (opts?.prelaunch && value !== "Pay based on experience") {
    return `Est. ${value}`;
  }
  return value;
}

export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_LABELS[type] ?? type.replace(/_/g, " ");
}
