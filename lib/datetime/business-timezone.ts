/** Morris operating timezone for shift dates and “today” clock logic. */
export const BUSINESS_TIMEZONE = "America/Chicago";

/** Calendar date (YYYY-MM-DD) in the business timezone. */
export function businessDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** True when an ISO timestamp falls on the given business calendar date. */
export function isOnBusinessDate(iso: string, businessDate: string): boolean {
  return businessDateString(iso) === businessDate;
}

/**
 * UTC bounds covering a full business calendar day (America/Chicago),
 * suitable for timestamptz range queries.
 */
export function businessDayUtcBounds(businessDate: string): { startIso: string; endIso: string } {
  // Walk hour-by-hour to find the first/last UTC instant that maps to this Chicago date.
  // Avoids hard-coding CST/CDT offsets.
  const probeStart = Date.parse(`${businessDate}T00:00:00.000Z`) - 12 * 60 * 60 * 1000;
  let startMs: number | null = null;
  let endMs: number | null = null;
  for (let ms = probeStart; ms < probeStart + 48 * 60 * 60 * 1000; ms += 15 * 60 * 1000) {
    if (businessDateString(new Date(ms)) === businessDate) {
      if (startMs == null) startMs = ms;
      endMs = ms + 15 * 60 * 1000 - 1;
    } else if (startMs != null) {
      break;
    }
  }
  if (startMs == null || endMs == null) {
    // Fallback: treat as UTC calendar day
    return {
      startIso: `${businessDate}T00:00:00.000Z`,
      endIso: `${businessDate}T23:59:59.999Z`,
    };
  }
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}
