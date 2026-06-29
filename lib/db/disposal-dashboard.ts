import { createClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/db/operations";
import { isFacilityOpenNow } from "@/lib/disposal/facility-hours";
import { getDisposalFacilities } from "@/lib/db/disposal-facilities";
import type {
  DisposalActivityRow,
  DisposalDashboardKpis,
  DisposalFacilityReportRow,
  FacilityHistoricalStats,
} from "@/types/disposal-management";

export async function getFacilityHistoricalStats(companyId: string): Promise<Record<string, FacilityHistoricalStats>> {
  if (!(await isDbReady())) return {};
  const { data, error } = await (await createClient())
    .from("disposal_events")
    .select("dump_site_id, actual_cost, drive_minutes, wait_minutes, unload_minutes, was_recommended")
    .eq("company_id", companyId);
  if (error || !data?.length) return {};

  const bySite = new Map<string, typeof data>();
  for (const row of data) {
    const id = row.dump_site_id as string;
    if (!id) continue;
    if (!bySite.has(id)) bySite.set(id, []);
    bySite.get(id)!.push(row);
  }

  const out: Record<string, FacilityHistoricalStats> = {};
  for (const [id, rows] of bySite) {
    const n = rows.length;
    const sum = (fn: (r: (typeof rows)[0]) => number) => rows.reduce((s, r) => s + fn(r), 0);
    out[id] = {
      jobCount: n,
      avgActualCost: Math.round(sum((r) => Number(r.actual_cost ?? 0)) / n),
      avgWaitMinutes: Math.round(sum((r) => Number(r.wait_minutes ?? 0)) / n) || 12,
      avgUnloadMinutes: Math.round(sum((r) => Number(r.unload_minutes ?? 0)) / n) || 18,
      avgDriveMinutes: Math.round(sum((r) => Number(r.drive_minutes ?? 0)) / n) || 0,
      totalSpent: sum((r) => Number(r.actual_cost ?? 0)),
      recommendationAcceptRate: Math.round((rows.filter((r) => r.was_recommended).length / n) * 100),
    };
  }
  return out;
}

export async function getDisposalDashboard(companyId: string) {
  const facilities = await getDisposalFacilities(companyId);
  const active = facilities.filter((f) => f.status === "active");
  const openNow = active.filter((f) => isFacilityOpenNow(f.hoursJson, f.isClosed, f.holidayClosures)).length;
  const preferredVendors = active.filter((f) => f.isPreferredVendor).length;

  let kpis: DisposalDashboardKpis = {
    totalFacilities: active.length,
    openNow,
    preferredVendors,
    avgDisposalCost: 0,
    avgDriveMiles: 0,
    monthlySpend: 0,
    savingsFromRecommendations: 0,
  };
  let eventCount = 0;
  let recentActivity: DisposalActivityRow[] = [];
  let topFacilities: DisposalFacilityReportRow[] = [];
  const facilityStats = await getFacilityHistoricalStats(companyId);

  if (await isDbReady()) {
    const sb = await createClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [eventsRes, recentRes] = await Promise.all([
      sb.from("disposal_events").select("*").eq("company_id", companyId),
      sb
        .from("disposal_events")
        .select("id, job_id, dump_site_name, actual_cost, completed_at, was_recommended")
        .eq("company_id", companyId)
        .order("completed_at", { ascending: false })
        .limit(8),
    ]);

    const events = eventsRes.data ?? [];
    eventCount = events.length;
    const monthEvents = events.filter((e) => new Date(String(e.completed_at)) >= monthStart);

    kpis.monthlySpend = monthEvents.reduce((s, e) => s + Number(e.actual_cost ?? 0), 0);
    kpis.avgDisposalCost = events.length
      ? Math.round(events.reduce((s, e) => s + Number(e.actual_cost ?? 0), 0) / events.length)
      : 0;
    kpis.avgDriveMiles = events.length
      ? Math.round((events.reduce((s, e) => s + Number(e.drive_miles ?? 0), 0) / events.length) * 10) / 10
      : 0;
    kpis.savingsFromRecommendations = events.reduce((s, e) => {
      const est = Number(e.estimated_cost ?? 0);
      const act = Number(e.actual_cost ?? 0);
      return est > act ? s + (est - act) : s;
    }, 0);

    recentActivity = (recentRes.data ?? []).map((r) => ({
      id: String(r.id),
      jobId: String(r.job_id),
      dumpSiteName: String(r.dump_site_name ?? "Unknown"),
      actualCost: Number(r.actual_cost ?? 0),
      completedAt: String(r.completed_at),
      wasRecommended: Boolean(r.was_recommended),
    }));

    const siteMap = new Map<string, DisposalFacilityReportRow>();
    for (const e of events) {
      const id = String(e.dump_site_id ?? "");
      if (!id) continue;
      const cur = siteMap.get(id) ?? {
        dumpSiteId: id,
        dumpSiteName: String(e.dump_site_name ?? id),
        jobCount: 0,
        totalSpent: 0,
        avgCost: 0,
        avgWaitMinutes: 0,
      };
      cur.jobCount += 1;
      cur.totalSpent += Number(e.actual_cost ?? 0);
      cur.avgWaitMinutes += Number(e.wait_minutes ?? 0);
      siteMap.set(id, cur);
    }
    topFacilities = [...siteMap.values()]
      .map((r) => ({
        ...r,
        avgCost: r.jobCount ? Math.round(r.totalSpent / r.jobCount) : 0,
        avgWaitMinutes: r.jobCount ? Math.round(r.avgWaitMinutes / r.jobCount) : 0,
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 6);
  }

  return { kpis, recentActivity, topFacilities, facilityStats, facilities: active, eventCount };
}
