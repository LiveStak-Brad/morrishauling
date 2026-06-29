import type { DistanceProvider } from "@/lib/distance";
import { defaultDistanceProvider } from "@/lib/distance";
import type { OperatingBase } from "@/types/disposal";
import type { LatLng } from "@/types";

export interface RouteFromBase {
  originBase: OperatingBase;
  dispatchMiles: number;
  customerToDisposalMiles: number;
  returnMiles: number;
  totalRouteMiles: number;
  selectionReason: string;
}

export function computeRouteFromBase(
  originBase: OperatingBase,
  customerLocation: LatLng,
  disposalLocation: LatLng,
  distanceProvider: DistanceProvider = defaultDistanceProvider
): Omit<RouteFromBase, "selectionReason"> {
  const dispatchMiles = distanceProvider.roadMiles(originBase.location, customerLocation);
  const customerToDisposalMiles = distanceProvider.roadMiles(
    customerLocation,
    disposalLocation
  );
  const returnMiles = distanceProvider.roadMiles(disposalLocation, originBase.location);
  const totalRouteMiles =
    Math.round((dispatchMiles + customerToDisposalMiles + returnMiles) * 10) / 10;

  return {
    originBase,
    dispatchMiles,
    customerToDisposalMiles,
    returnMiles,
    totalRouteMiles,
  };
}

export function selectOptimalOperatingBase(
  bases: OperatingBase[],
  customerLocation: LatLng,
  disposalLocation: LatLng,
  distanceProvider: DistanceProvider = defaultDistanceProvider,
  overrideBaseId?: string
): RouteFromBase {
  const activeBases = bases.filter((b) => b.id);
  if (activeBases.length === 0) {
    throw new Error("No operating bases configured");
  }

  if (overrideBaseId) {
    const forced = activeBases.find((b) => b.id === overrideBaseId);
    if (forced) {
      const route = computeRouteFromBase(forced, customerLocation, disposalLocation, distanceProvider);
      return {
        ...route,
        selectionReason: `Admin override — ${forced.name}`,
      };
    }
  }

  const ranked = activeBases
    .map((base) => {
      const route = computeRouteFromBase(base, customerLocation, disposalLocation, distanceProvider);
      return { base, ...route };
    })
    .sort((a, b) => a.totalRouteMiles - b.totalRouteMiles);

  const best = ranked[0];
  const primary = activeBases.find((b) => b.isPrimary);
  const savings =
    ranked.length > 1 ? ranked[ranked.length - 1].totalRouteMiles - best.totalRouteMiles : 0;

  let selectionReason: string;
  if (ranked.length === 1) {
    selectionReason = `Single operating base — ${best.originBase.name}`;
  } else if (best.originBase.id === primary?.id && savings < 3) {
    selectionReason = `Primary base — ${best.originBase.name}`;
  } else if (savings >= 3) {
    selectionReason = `Shortest route — ${best.originBase.name} saves ~${Math.round(savings)} mi vs other base`;
  } else {
    selectionReason = `Shortest route — ${best.originBase.name}`;
  }

  return { ...best, selectionReason };
}
