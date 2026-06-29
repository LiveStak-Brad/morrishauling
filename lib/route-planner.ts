import type { CompanyConfig, LatLng } from "@/types";
import type { Job } from "@/types/job";
import type { RoutePlan, RoutePlanInput, RouteStop, RouteWarning } from "@/types/route";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { getJob as mockGetJob } from "@/lib/mock-data";

export interface RoutePlanner {
  planRoute(input: RoutePlanInput, company: CompanyConfig, jobs?: Job[]): RoutePlan;
}

function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestDumpSite(from: LatLng, company: CompanyConfig) {
  return company.dumpSites.reduce((nearest, site) => {
    const dist = haversineMiles(from, site.location);
    if (!nearest || dist < nearest.dist) return { site, dist };
    return nearest;
  }, null as { site: (typeof company.dumpSites)[0]; dist: number } | null)!;
}

function jobWarnings(job: Job): RouteWarning[] {
  const warnings: RouteWarning[] = [];
  if (job.warnings.includes("heavy_load")) {
    warnings.push({ type: "heavy_load", message: "Heavy load — extra labor may be needed", jobId: job.id });
  }
  if (job.warnings.includes("stairs_access")) {
    warnings.push({ type: "stairs_access", message: "Stairs/access issue reported", jobId: job.id });
  }
  if (job.warnings.includes("long_carry")) {
    warnings.push({ type: "long_carry", message: "Long carry distance", jobId: job.id });
  }
  if (job.warnings.includes("price_may_need_adjustment")) {
    warnings.push({ type: "price_adjustment", message: "Price may need on-site adjustment", jobId: job.id });
  }
  if (job.warnings.includes("outside_service_area")) {
    warnings.push({ type: "outside_service_area", message: "Outside service area", jobId: job.id });
  }
  return warnings;
}

function sortByNearestNeighbor(jobs: Job[], start: LatLng): Job[] {
  const remaining = [...jobs];
  const sorted: Job[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((job, i) => {
      const loc = job.address.location ?? start;
      const dist = haversineMiles(current, loc);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });
    const [next] = remaining.splice(nearestIdx, 1);
    sorted.push(next);
    current = next.address.location ?? current;
  }

  return sorted;
}

export class DefaultRoutePlanner implements RoutePlanner {
  planRoute(input: RoutePlanInput, company: CompanyConfig, jobsArg?: Job[]): RoutePlan {
    const jobs = (
      jobsArg?.length
        ? jobsArg
        : isDemoDataEnabled()
          ? input.jobIds.map((id) => mockGetJob(id)).filter(Boolean)
          : []
    ) as Job[];
    const trailer = company.trailers.find((t) => t.id === input.trailerId);
    const capacity = trailer?.capacityPercent ?? 100;

    let orderedJobs = [...jobs];
    if (input.sortByDistance !== false) {
      orderedJobs = sortByNearestNeighbor(jobs, input.startPoint);
    } else {
      orderedJobs.sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0));
    }

    const stops: RouteStop[] = [];
    const allWarnings: RouteWarning[] = [];
    let currentLoad = 0;
    let prevLocation = input.startPoint;
    let totalDistance = 0;

    stops.push({
      id: "stop-start",
      type: "start",
      label: "Start / Yard",
      location: input.startPoint,
      trailerLoadBefore: 0,
      trailerLoadAfter: 0,
      distanceFromPreviousMiles: 0,
      warnings: [],
    });

    for (const job of orderedJobs) {
      const jobLoc = job.address.location ?? company.serviceArea.center;
      const jobPercent = job.estimate?.trailerPercent ?? 25;

      if (currentLoad + jobPercent > capacity && currentLoad > 0) {
        const dump = nearestDumpSite(prevLocation, company);
        const dumpDist = haversineMiles(prevLocation, dump.site.location);
        totalDistance += dumpDist;

        stops.push({
          id: `stop-dump-${job.id}`,
          type: "dump",
          dumpSiteId: dump.site.id,
          label: `Dump Run — ${dump.site.name}`,
          location: dump.site.location,
          trailerLoadBefore: currentLoad,
          trailerLoadAfter: 0,
          distanceFromPreviousMiles: dumpDist,
          warnings: [{ type: "trailer_likely_full", message: `Trailer was at ${currentLoad}% — dump inserted before next pickup` }],
        });

        allWarnings.push({
          type: "trailer_likely_full",
          message: `Dump stop added at ${dump.site.name}`,
          jobId: job.id,
        });

        currentLoad = 0;
        prevLocation = dump.site.location;
      }

      const dist = haversineMiles(prevLocation, jobLoc);
      totalDistance += dist;
      const loadBefore = currentLoad;
      currentLoad = Math.min(capacity, currentLoad + jobPercent);
      const warnings = jobWarnings(job);

      if (loadBefore + jobPercent > capacity * 0.85) {
        warnings.push({
          type: "trailer_likely_full",
          message: `Trailer at ${currentLoad}% after this job`,
          jobId: job.id,
        });
      }

      stops.push({
        id: `stop-${job.id}`,
        type: "pickup",
        jobId: job.id,
        label: `Pickup — ${job.address.street}`,
        location: jobLoc,
        trailerLoadBefore: loadBefore,
        trailerLoadAfter: currentLoad,
        distanceFromPreviousMiles: dist,
        warnings,
      });

      allWarnings.push(...warnings);
      prevLocation = jobLoc;
    }

    if (input.endPoint) {
      const dist = haversineMiles(prevLocation, input.endPoint);
      totalDistance += dist;
      stops.push({
        id: "stop-end",
        type: "end",
        label: "End / Return",
        location: input.endPoint,
        trailerLoadBefore: currentLoad,
        trailerLoadAfter: currentLoad,
        distanceFromPreviousMiles: dist,
        warnings: [],
      });
    }

    return {
      id: `route-${Date.now()}`,
      companyId: company.companyId,
      stops,
      totalDistanceMiles: Math.round(totalDistance * 10) / 10,
      warnings: allWarnings,
      trailerId: input.trailerId,
      truckId: input.truckId,
      employeeIds: input.employeeIds,
      createdAt: new Date().toISOString(),
    };
  }
}

export const routePlanner = new DefaultRoutePlanner();
