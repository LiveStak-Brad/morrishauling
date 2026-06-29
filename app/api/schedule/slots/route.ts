import { apiError, apiOk } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getScheduleSlots } from "@/lib/db/schedule-operations";
import { scheduleSlotsToCalendarOptions } from "@/lib/schedule/map-slots-to-calendar";
import { format, addDays } from "date-fns";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "schedule-slots",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return apiError("companyId required", 400);

    const days = Number(searchParams.get("days") ?? 14);
    const fromDate = searchParams.get("fromDate") ?? format(addDays(new Date(), 1), "yyyy-MM-dd");
    const toDate =
      searchParams.get("toDate") ?? format(addDays(new Date(), days), "yyyy-MM-dd");
    const includeClosed = searchParams.get("includeClosed") === "1";

    const slots = await getScheduleSlots(companyId, { fromDate, toDate, includeClosed });
    const days_view = scheduleSlotsToCalendarOptions(slots);

    return apiOk({ slots, days: days_view });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load schedule slots");
  }
}
