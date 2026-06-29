import { format } from "date-fns";
import type { CompanyConfig } from "@/types";
import type { Job } from "@/types/job";
import type { OperationsDepthSnapshot } from "@/types/operations-depth";
import type { OperationalTruck } from "@/types/operations-depth";
import type {
  LiveCrewUpdate,
  LiveDispatchPhase,
  RouteTimelineStop,
  TruckRouteTimeline,
} from "@/types/operations-command-center";
import {
  avatarForEmployee,
  findEmployeeInRoster,
  type EmployeeRosterEntry,
} from "@/lib/hr/employee-roster";
import { isDemoDataEnabled } from "@/lib/is-demo-data";

export interface LivePhaseState {
  phase: LiveDispatchPhase;
  headline: string;
  detail: string;
  etaMinutes: number | null;
  trailerLoadPct: number | null;
}

/** Time-of-day simulation — demo only */
export function getMarcusLivePhase(now = new Date()): LivePhaseState {
  const mins = now.getHours() * 60 + now.getMinutes();
  const cycle = ((mins - 390) % 120 + 120) % 120;

  if (mins < 390) {
    return { phase: "available", headline: "Off shift", detail: "Not on today's route", etaMinutes: null, trailerLoadPct: null };
  }
  if (cycle < 8) return { phase: "clocked_in", headline: "Clocked in", detail: "Pre-trip at yard", etaMinutes: null, trailerLoadPct: 0 };
  if (cycle < 18) return { phase: "departed_yard", headline: "Left yard", detail: "Heading to first stop", etaMinutes: 22, trailerLoadPct: 0 };
  if (cycle < 35) return { phase: "driving", headline: "Driving to next stop", detail: "En route", etaMinutes: 14, trailerLoadPct: 0 };
  if (cycle < 55) return { phase: "on_site", headline: "On site", detail: `Started ${format(now, "h:mm a")}`, etaMinutes: null, trailerLoadPct: 12 };
  if (cycle < 72) return { phase: "loading", headline: "Loading trailer", detail: "Pickup in progress", etaMinutes: null, trailerLoadPct: 47 };
  if (cycle < 85) return { phase: "driving_dump", headline: "Driving to dump", detail: "Transfer station", etaMinutes: 18, trailerLoadPct: 47 };
  if (cycle < 95) return { phase: "at_dump", headline: "At dump", detail: "Unloading trailer", etaMinutes: null, trailerLoadPct: 47 };
  if (cycle < 102) return { phase: "dump_complete", headline: "Dump complete", detail: "Trailer cleared", etaMinutes: null, trailerLoadPct: 0 };
  return { phase: "next_job", headline: "Heading to next job", detail: "Next scheduled stop", etaMinutes: 28, trailerLoadPct: 0 };
}

function phaseForJob(job: Job): LiveDispatchPhase {
  if (job.status === "in_progress") return "on_site";
  if (job.status === "scheduled" || job.status === "estimated") return "driving";
  return "available";
}

export function buildLiveCrewUpdates(
  roster: EmployeeRosterEntry[],
  jobs: Job[],
  today: string,
  depth?: OperationsDepthSnapshot
): LiveCrewUpdate[] {
  if (roster.length === 0) return [];

  if (isDemoDataEnabled()) {
    const lead = roster.find((e) => e.id === "emp-m2") ?? roster[0];
    const partner = roster.find((e) => e.id === "emp-m3") ?? roster[1];
    const now = new Date();
    const live = getMarcusLivePhase(now);
    const updates: LiveCrewUpdate[] = [
      {
        id: `live-${lead.id}`,
        employeeId: lead.id,
        employeeName: lead.name,
        avatarUrl: lead.avatarUrl ?? avatarForEmployee(lead.name, lead.id),
        phase: live.phase,
        headline: live.headline,
        detail: live.detail,
        etaMinutes: live.etaMinutes,
        trailerLoadPct: live.trailerLoadPct,
        truckName: "Truck 1",
        updatedAt: now.toISOString(),
        isLive: true,
      },
    ];
    if (partner) {
      updates.push({
        id: `live-${partner.id}`,
        employeeId: partner.id,
        employeeName: partner.name,
        avatarUrl: partner.avatarUrl ?? avatarForEmployee(partner.name, partner.id),
        phase: live.phase === "on_site" || live.phase === "loading" ? live.phase : "available",
        headline: live.phase === "loading" ? "Assisting load" : `With ${lead.name}`,
        detail: live.phase === "loading" ? "Trailer load assist" : "Crew partner on route",
        etaMinutes: null,
        trailerLoadPct: live.trailerLoadPct,
        truckName: "Truck 1",
        updatedAt: now.toISOString(),
        isLive: ["on_site", "loading", "driving_dump", "at_dump"].includes(live.phase),
      });
    }
    return updates;
  }

  const clockedIn = new Set(
    (depth?.timeclock ?? [])
      .filter((t) => t.shiftDate === today && (t.shiftStatus === "clocked_in" || t.shiftStatus === "on_break"))
      .map((t) => t.employeeId)
  );

  const todayJobs = jobs.filter(
    (j) => j.scheduledDate === today && !["cancelled", "draft", "completed"].includes(j.status)
  );

  const seen = new Set<string>();
  const updates: LiveCrewUpdate[] = [];

  for (const job of todayJobs) {
    for (const empId of job.assignedEmployeeIds ?? []) {
      if (seen.has(empId)) continue;
      const emp = findEmployeeInRoster(roster, empId);
      if (!emp) continue;
      seen.add(empId);

      const active = job.status === "in_progress";
      const phase = phaseForJob(job);
      updates.push({
        id: `live-${empId}`,
        employeeId: empId,
        employeeName: emp.name,
        avatarUrl: emp.avatarUrl ?? avatarForEmployee(emp.name, empId),
        phase,
        headline: active ? "On active job" : job.status === "scheduled" ? "Scheduled today" : "Assigned",
        detail: `${job.address.street}, ${job.address.city}`,
        etaMinutes: null,
        trailerLoadPct: null,
        truckName: null,
        updatedAt: new Date().toISOString(),
        isLive: active || clockedIn.has(empId),
      });
    }
  }

  for (const empId of clockedIn) {
    if (seen.has(empId)) continue;
    const emp = findEmployeeInRoster(roster, empId);
    if (!emp) continue;
    updates.push({
      id: `live-${empId}`,
      employeeId: empId,
      employeeName: emp.name,
      avatarUrl: emp.avatarUrl ?? avatarForEmployee(emp.name, empId),
      phase: "clocked_in",
      headline: "Clocked in",
      detail: "Available for dispatch",
      etaMinutes: null,
      trailerLoadPct: null,
      truckName: null,
      updatedAt: new Date().toISOString(),
      isLive: true,
    });
  }

  return updates;
}

function timeLabel(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return format(d, "h:mm a");
}

export function buildTruckRouteTimelines(
  company: CompanyConfig,
  jobs: Job[],
  today: string,
  roster: EmployeeRosterEntry[],
  depthTrucks?: OperationalTruck[]
): TruckRouteTimeline[] {
  const live = isDemoDataEnabled() ? getMarcusLivePhase() : null;

  const truckSource = isDemoDataEnabled()
    ? company.trucks.map((t) => ({ id: t.id, name: t.name }))
    : (depthTrucks ?? []).map((t) => ({ id: t.id, name: t.name }));

  const timelines: TruckRouteTimeline[] = [];

  for (const truck of truckSource) {
    const truckJobs = jobs
      .filter(
        (j) =>
          j.assignedTruckId === truck.id &&
          j.scheduledDate === today &&
          !["cancelled", "draft"].includes(j.status)
      )
      .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99));

    if (truckJobs.length === 0 && !isDemoDataEnabled()) continue;

    const crewIds = new Set<string>();
    truckJobs.forEach((j) => j.assignedEmployeeIds?.forEach((id) => crewIds.add(id)));
    const crew = [...crewIds].map((id) => {
      const e = findEmployeeInRoster(roster, id);
      return {
        name: e?.name ?? id,
        avatarUrl: e?.avatarUrl ?? avatarForEmployee(e?.name ?? id, id),
      };
    });

    const trailerId = truckJobs.find((j) => j.assignedTrailerId)?.assignedTrailerId;
    const trailer = trailerId
      ? isDemoDataEnabled()
        ? company.trailers.find((t) => t.id === trailerId)?.name ?? trailerId
        : trailerId
      : null;

    const yard = company.yardLocation ?? company.serviceArea.center;
    const stops: RouteTimelineStop[] = [];

    if (isDemoDataEnabled() && truckJobs.length > 0) {
      stops.push({
        id: "yard-start",
        timeLabel: timeLabel(7, 2),
        title: "Left yard",
        subtitle: "Morris Yard",
        stopType: "yard",
        driveMinutesFromPrevious: null,
        location: yard,
      });
    }

    const times = [
      [8, 0],
      [10, 30],
      [12, 15],
      [14, 0],
    ];
    truckJobs.forEach((job, i) => {
      const [h, m] = times[i] ?? [9 + i, 0];
      stops.push({
        id: job.id,
        timeLabel: job.scheduledWindowLabel ?? (isDemoDataEnabled() ? timeLabel(h, m) : "Scheduled"),
        title: job.junkType?.replace(/_/g, " ") ?? "Pickup",
        subtitle: `${job.address.street}, ${job.address.city}`,
        stopType: "job",
        driveMinutesFromPrevious: isDemoDataEnabled() ? (i === 0 ? 28 : 45) : null,
        location: job.address.location,
      });
    });

    if (truckJobs.length > 0 && isDemoDataEnabled()) {
      const dump = company.dumpSites[0];
      stops.push({
        id: "dump-run",
        timeLabel: timeLabel(12, 15),
        title: dump?.name ?? "Transfer Station",
        subtitle: "Dump run",
        stopType: "dump",
        driveMinutesFromPrevious: 22,
        location: dump?.location,
      });
    }

    const waypoints = stops
      .filter((s) => s.location)
      .map((s) => `${s.location!.lat},${s.location!.lng}`);
    const googleMapsDirectionsUrl =
      waypoints.length >= 2
        ? `https://www.google.com/maps/dir/${waypoints.join("/")}`
        : `https://www.google.com/maps/search/?api=1&query=${yard.lat},${yard.lng}`;

    const demoTruck = isDemoDataEnabled() && truck.id === "truck-m1";

    timelines.push({
      truckId: truck.id,
      truckName: truck.name,
      crew,
      trailerName: trailer,
      stops,
      googleMapsDirectionsUrl,
      livePhase: live && demoTruck ? live.phase : null,
      liveMessage: live && demoTruck ? `${live.headline} — ${live.detail}` : null,
    });
  }

  return timelines;
}

export function getEmployeeLiveState(
  employeeId: string,
  roster: EmployeeRosterEntry[],
  jobs: Job[],
  today: string
): LivePhaseState | null {
  if (isDemoDataEnabled() && (employeeId === "emp-m2" || employeeId === "emp-m3")) {
    return getMarcusLivePhase();
  }

  const emp = findEmployeeInRoster(roster, employeeId);
  if (!emp) return null;

  const activeJob = jobs.find(
    (j) =>
      j.assignedEmployeeIds?.includes(employeeId) &&
      j.status === "in_progress" &&
      j.scheduledDate === today
  );
  if (activeJob) {
    return {
      phase: "on_site",
      headline: "On active job",
      detail: `${activeJob.address.street}, ${activeJob.address.city}`,
      etaMinutes: null,
      trailerLoadPct: null,
    };
  }

  const nextJob = jobs.find(
    (j) =>
      j.assignedEmployeeIds?.includes(employeeId) &&
      j.scheduledDate === today &&
      !["completed", "cancelled", "draft"].includes(j.status)
  );
  if (nextJob) {
    return {
      phase: "driving",
      headline: "Scheduled today",
      detail: `${nextJob.address.city} — ${nextJob.scheduledWindowLabel ?? "TBD"}`,
      etaMinutes: null,
      trailerLoadPct: null,
    };
  }

  return null;
}
