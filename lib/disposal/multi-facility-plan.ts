/**
 * Multi-facility disposal planner.
 * Chooses the best facility (or set of facilities) by total company cost,
 * material fit, commercial acceptance, open-now, and route efficiency —
 * not merely nearest distance.
 */

import type { MorrisConfig } from "@/lib/morris-config";
import type { LatLng } from "@/types";
import type {
  DisposalFacility,
  DisposalPlanStop,
  MultiFacilityDisposalPlan,
} from "@/types/disposal-management";
import type { MaterialCategory } from "@/lib/disposal/material-categories";
import { facilityAcceptsMaterials } from "@/lib/disposal/material-categories";
import {
  rankDisposalSites,
  type RankDisposalSitesInput,
} from "@/lib/disposal/disposal-recommendation";
import { defaultDistanceProvider, type DistanceProvider } from "@/lib/distance";

const ROAD_FACTOR = 1.22;

/** Materials that typically must be separated from mixed MSW loads. */
const SPECIALTY_BUCKETS: MaterialCategory[][] = [
  ["hazardous_waste", "paint", "oil", "batteries", "propane"],
  ["electronics"],
  ["recycling", "cardboard"],
  ["yard_waste", "brush", "leaves", "tree_limbs", "logs", "stumps"],
  ["tires"],
  ["freon_appliances", "freon", "appliances"],
  ["scrap_metal", "copper", "steel", "aluminum"],
  ["concrete", "brick", "clean_fill", "dirt", "rock", "asphalt"],
];

export interface PlanDisposalRouteInput extends Omit<RankDisposalSitesInput, "materials" | "strictMaterials"> {
  materials: MaterialCategory[];
  /** Prefer commercial-accepting facilities (default true for Morris hauling). */
  requireCommercial?: boolean;
  /** Exclude facilities with residency restrictions that block commercial haulers. */
  excludeResidentOnly?: boolean;
  /** Soft-exclude facilities that require appointments unless no alternative. */
  preferNoAppointment?: boolean;
  /** Trailer length (ft) — filters sites with explicit trailer restrictions when possible. */
  trailerLengthFt?: number;
  allowMultiFacility?: boolean;
}

function partitionMaterials(materials: MaterialCategory[]): MaterialCategory[][] {
  const remaining = new Set(materials);
  const groups: MaterialCategory[][] = [];

  for (const bucket of SPECIALTY_BUCKETS) {
    const hit = bucket.filter((m) => remaining.has(m));
    if (hit.length) {
      groups.push(hit);
      hit.forEach((m) => remaining.delete(m));
    }
  }

  if (remaining.size) {
    groups.push([...remaining]);
  }

  return groups.length ? groups : [["mixed_junk"]];
}

function passesOperationalFilters(
  site: DisposalFacility,
  opts: {
    requireCommercial: boolean;
    excludeResidentOnly: boolean;
    trailerLengthFt?: number;
  }
): boolean {
  if (!site.location) return false;
  if (opts.requireCommercial && site.commercialAccepted === false) return false;
  if (opts.requireCommercial && site.accessType === "public" && site.commercialAccepted !== true) return false;
  if (
    opts.excludeResidentOnly &&
    site.residencyRestriction &&
    site.residencyRestriction !== "none" &&
    site.residencyRestriction !== "unknown"
  ) {
    return false;
  }
  if (opts.trailerLengthFt != null && site.trailerRestrictions) {
    const m = site.trailerRestrictions.match(/(\d+)\s*(ft|feet)/i);
    if (m && opts.trailerLengthFt > Number(m[1])) return false;
  }
  return true;
}

function legMiles(from: LatLng, to: LatLng, provider: DistanceProvider): number {
  return Math.round(provider.straightLineMiles(from, to) * ROAD_FACTOR * 10) / 10;
}

function orderStopsNearestNeighbor(
  origin: LatLng,
  candidates: DisposalPlanStop[],
  provider: DistanceProvider,
  mph: number
): DisposalPlanStop[] {
  const remaining = [...candidates];
  const ordered: DisposalPlanStop[] = [];
  let cursor = origin;

  while (remaining.length) {
    remaining.sort(
      (a, b) =>
        legMiles(cursor, a.site.location!, provider) - legMiles(cursor, b.site.location!, provider)
    );
    const next = remaining.shift()!;
    const miles = legMiles(cursor, next.site.location!, provider);
    ordered.push({
      ...next,
      sequence: ordered.length + 1,
      legMilesFromPrevious: miles,
      legMinutesFromPrevious: Math.round((miles / mph) * 60),
    });
    cursor = next.site.location!;
  }

  return ordered;
}

function summarizePlan(
  strategy: MultiFacilityDisposalPlan["strategy"],
  stops: DisposalPlanStop[],
  unassigned: MaterialCategory[],
  jobRevenue: number | undefined,
  reason: string,
  alternativesConsidered: number
): MultiFacilityDisposalPlan {
  const totalCompanyCost = stops.reduce((s, x) => s + x.score.costs.totalCompanyCost, 0);
  const totalDriveMiles = stops.reduce((s, x) => s + x.legMilesFromPrevious, 0);
  const totalDriveMinutes = stops.reduce((s, x) => s + x.legMinutesFromPrevious, 0);
  const pricingUncertain = stops.some(
    (x) => x.site.pricingUnknown || x.site.verificationStatus === "needs_call"
  );

  return {
    strategy,
    stops,
    totalCompanyCost,
    totalDriveMiles,
    totalDriveMinutes,
    estimatedProfitAfterDisposal:
      jobRevenue != null ? Math.round(jobRevenue - totalCompanyCost) : undefined,
    pricingUncertain,
    unassignedMaterials: unassigned,
    selectionReason: reason,
    alternativesConsidered,
  };
}

/**
 * Build the best disposal plan for a job.
 * Tries a single facility that accepts all materials first; if none (or multi is cheaper
 * for specialty splits), returns an ordered multi-stop plan.
 */
export function planDisposalRoute(input: PlanDisposalRouteInput): MultiFacilityDisposalPlan {
  const {
    sites,
    origin,
    materials,
    config,
    jobRevenue,
    distanceProvider = defaultDistanceProvider,
    requireCommercial = true,
    excludeResidentOnly = true,
    preferNoAppointment = true,
    trailerLengthFt,
    allowMultiFacility = true,
    ...rankRest
  } = input;

  const mph = config.junkRemovalPricing.averageDriveMph;
  const filterOpts = { requireCommercial, excludeResidentOnly, trailerLengthFt };

  let pool = sites.filter((s) => passesOperationalFilters(s, filterOpts));
  if (!pool.length) {
    pool = sites.filter((s) => s.location && s.status === "active" && !s.isClosed);
  }

  if (preferNoAppointment) {
    const noAppt = pool.filter((s) => !s.appointmentRequired);
    if (noAppt.length) pool = noAppt;
  }

  // --- Single-facility attempt ---
  const singleRank = rankDisposalSites({
    ...rankRest,
    sites: pool,
    origin,
    materials,
    config,
    jobRevenue,
    distanceProvider,
    strictMaterials: true,
    filters: { ...(rankRest.filters ?? {}), accessType: requireCommercial ? "commercial" : rankRest.filters?.accessType },
  });

  const singleBest = singleRank.bestOverall;
  let singlePlan: MultiFacilityDisposalPlan | null = null;
  if (singleBest) {
    const miles = singleBest.distanceMiles;
    singlePlan = summarizePlan(
      "single_facility",
      [
        {
          sequence: 1,
          site: singleBest.site,
          materials: [...materials],
          score: singleBest,
          legMilesFromPrevious: miles,
          legMinutesFromPrevious: singleBest.driveMinutes,
        },
      ],
      [],
      jobRevenue,
      singleBest.selectionReason || "Best single facility for all materials",
      singleRank.ranked.length
    );
  }

  if (!allowMultiFacility || materials.length <= 1) {
    return (
      singlePlan ??
      summarizePlan("single_facility", [], [...materials], jobRevenue, "No compatible facility found", 0)
    );
  }

  // --- Multi-facility split ---
  const groups = partitionMaterials(materials);
  if (groups.length <= 1 && singlePlan) return singlePlan;

  const stops: DisposalPlanStop[] = [];
  const unassigned: MaterialCategory[] = [];
  let alternatives = 0;

  for (const group of groups) {
    let groupPool = pool;
    let ranked = rankDisposalSites({
      ...rankRest,
      sites: groupPool,
      origin,
      materials: group,
      config,
      jobRevenue,
      distanceProvider,
      strictMaterials: true,
      filters: {
        ...(rankRest.filters ?? {}),
        accessType: requireCommercial ? "commercial" : rankRest.filters?.accessType,
      },
    });

    // Specialty streams (e-waste, HHW, recycling, yard waste) often only have
    // resident/public drop-offs — fall back when no commercial tip exists.
    if (!ranked.bestOverall) {
      const specialtyPool = sites.filter(
        (s) =>
          s.location &&
          s.status === "active" &&
          !s.isClosed &&
          (!trailerLengthFt ||
            !s.trailerRestrictions ||
            !/(\d+)\s*(ft|feet)/i.test(s.trailerRestrictions) ||
            trailerLengthFt <= Number(s.trailerRestrictions.match(/(\d+)\s*(ft|feet)/i)![1]))
      );
      ranked = rankDisposalSites({
        ...rankRest,
        sites: specialtyPool,
        origin,
        materials: group,
        config,
        jobRevenue,
        distanceProvider,
        strictMaterials: true,
        filters: rankRest.filters,
      });
      groupPool = specialtyPool;
    }

    alternatives += ranked.ranked.length;
    const best = ranked.bestOverall;
    if (!best) {
      unassigned.push(...group);
      continue;
    }
    // Merge into existing stop if same facility already selected
    const existing = stops.find((s) => s.site.id === best.site.id);
    if (existing) {
      existing.materials = [...new Set([...existing.materials, ...group])];
      continue;
    }
    stops.push({
      sequence: 0,
      site: best.site,
      materials: [...group],
      score: best,
      legMilesFromPrevious: 0,
      legMinutesFromPrevious: 0,
    });
  }

  if (!stops.length) {
    return (
      singlePlan ??
      summarizePlan("multi_facility_split", [], unassigned, jobRevenue, "No compatible facilities for material split", alternatives)
    );
  }

  const ordered = orderStopsNearestNeighbor(origin, stops, distanceProvider, mph);
  // Recompute stop costs with leg from previous for drive portion already in score from origin;
  // keep tipping from each score; add extra inter-stop drive beyond first leg vs origin-only.
  // Practical approach: use each site's origin-based cost (conservative) + sum of NN legs for route miles.
  const multiPlan = summarizePlan(
    ordered.length > 1 ? "multi_facility_split" : "single_facility",
    ordered,
    unassigned,
    jobRevenue,
    ordered.length > 1
      ? `Split across ${ordered.length} facilities for material compatibility and lower total cost`
      : "Best facility after material partitioning",
    alternatives
  );

  // Prefer single facility when it accepts everything and is not materially more expensive
  if (singlePlan && singlePlan.unassignedMaterials.length === 0) {
    const multiPremium = multiPlan.totalCompanyCost - singlePlan.totalCompanyCost;
    const extraStopsPenalty = (ordered.length - 1) * 35; // labor/friction for extra tip stops
    if (multiPremium + extraStopsPenalty >= 0) {
      return {
        ...singlePlan,
        selectionReason: `${singlePlan.selectionReason} (preferred over ${ordered.length}-stop split)`,
        alternativesConsidered: Math.max(singlePlan.alternativesConsidered, alternatives),
      };
    }
  }

  // If multi left materials unassigned but single covered all, prefer single
  if (singlePlan && multiPlan.unassignedMaterials.length > 0 && singlePlan.unassignedMaterials.length === 0) {
    return singlePlan;
  }

  return multiPlan;
}

/** True when a facility can take every material in the list. */
export function facilityCoversAll(site: DisposalFacility, materials: MaterialCategory[]): boolean {
  return facilityAcceptsMaterials(site.acceptedMaterials, materials);
}
