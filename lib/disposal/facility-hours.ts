import type { DumpSiteHours } from "@/types/operations-depth";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseTimeRange(hours: string): { open: number; close: number } | null {
  if (!hours || /closed/i.test(hours)) return null;
  const match = hours.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[–\-—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  const toMinutes = (h: string, m: string | undefined, ampm: string | undefined) => {
    let hour = parseInt(h, 10);
    const min = m ? parseInt(m, 10) : 0;
    const mer = (ampm ?? "").toUpperCase();
    if (mer === "PM" && hour < 12) hour += 12;
    if (mer === "AM" && hour === 12) hour = 0;
    if (!mer && hour >= 1 && hour <= 6) hour += 12;
    return hour * 60 + min;
  };
  return {
    open: toMinutes(match[1], match[2], match[3]),
    close: toMinutes(match[4], match[5], match[6]),
  };
}

export function isFacilityOpenNow(
  hoursJson: DumpSiteHours | undefined,
  isClosed: boolean,
  holidayClosures?: string[],
  at: Date = new Date()
): boolean {
  if (isClosed) return false;
  const dateStr = at.toISOString().slice(0, 10);
  if (holidayClosures?.includes(dateStr)) return false;

  const dayKey = DAY_KEYS[at.getDay()];
  const todayHours = hoursJson?.[dayKey];
  if (!todayHours) return false;
  const range = parseTimeRange(todayHours);
  if (!range) return false;
  const nowMinutes = at.getHours() * 60 + at.getMinutes();
  return nowMinutes >= range.open && nowMinutes <= range.close;
}

export function formatTodayHours(hoursJson: DumpSiteHours | undefined, at: Date = new Date()): string {
  const dayKey = DAY_KEYS[at.getDay()];
  const h = hoursJson?.[dayKey];
  return h && !/closed/i.test(h) ? h : "Closed today";
}
