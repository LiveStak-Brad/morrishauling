import type { MorrisConfig } from "@/lib/morris-config";
import type { OperatingBase } from "@/types/disposal";
import { approximateCustomerLocation } from "@/lib/disposal/disposal-routing";
import { selectOptimalOperatingBase } from "@/lib/disposal/operating-base-selection";
import type { DisposalSelection } from "@/lib/disposal/disposal-routing";
import type { DistanceProvider } from "@/lib/distance";
import { defaultDistanceProvider } from "@/lib/distance";
import type { LatLng } from "@/types";

export interface JunkRouteCost {
  originBase: OperatingBase;
  customerLocation: LatLng;
  disposal: DisposalSelection;
  dispatchMiles: number;
  customerToDisposalMiles: number;
  returnMiles: number;
  totalRouteMiles: number;
  estimatedDriveMinutes: number;
  customerTransportationCharge: number;
  internalFuelCost: number;
  internalTruckOperatingCost: number;
  internalTrailerOperatingCost: number;
  internalDriveLaborCost: number;
  baseSelectionReason: string;
}

export function calculateJunkRouteCost(
  config: MorrisConfig,
  ctx: {
    customerLocation?: LatLng;
    zip?: string;
    disposal: DisposalSelection;
    originBaseId?: string;
  },
  distanceProvider: DistanceProvider = defaultDistanceProvider
): JunkRouteCost {
  const p = config.junkRemovalPricing;
  const fallbackBase =
    config.operatingBases.find((b) => b.isPrimary) ?? config.operatingBases[0];
  const customerLocation =
    ctx.customerLocation ?? approximateCustomerLocation(ctx.zip, fallbackBase);

  const routeFromBase = selectOptimalOperatingBase(
    config.operatingBases,
    customerLocation,
    ctx.disposal.site.location,
    distanceProvider,
    ctx.originBaseId
  );

  const {
    originBase,
    dispatchMiles,
    customerToDisposalMiles,
    returnMiles,
    totalRouteMiles,
    selectionReason: baseSelectionReason,
  } = routeFromBase;

  const estimatedDriveMinutes = Math.round((totalRouteMiles / p.averageDriveMph) * 60);

  const mileageCharge = Math.round(totalRouteMiles * p.customerTravelRatePerMile);
  const fuelCharge = Math.max(
    p.minimumFuelFee,
    Math.round(totalRouteMiles * p.fuelAdjustmentRate)
  );
  const customerTransportationCharge = Math.max(
    p.minimumTravelFee,
    p.minimumDispatchFee + mileageCharge + fuelCharge
  );

  const gallonsUsed = totalRouteMiles / p.internalFuelMpg;
  const internalFuelCost = Math.round(gallonsUsed * p.internalDieselPricePerGallon);
  const internalTruckOperatingCost = Math.round(
    totalRouteMiles * p.internalTruckOperatingCostPerMile
  );
  const internalTrailerOperatingCost = Math.round(
    totalRouteMiles * p.internalTrailerOperatingCostPerMile
  );
  const driveHours = estimatedDriveMinutes / 60;
  const internalDriveLaborCost = Math.round(
    driveHours * p.laborHourlyRate * p.internalDriveLaborMultiplier
  );

  return {
    originBase,
    customerLocation,
    disposal: ctx.disposal,
    dispatchMiles,
    customerToDisposalMiles,
    returnMiles,
    totalRouteMiles,
    estimatedDriveMinutes,
    customerTransportationCharge,
    internalFuelCost,
    internalTruckOperatingCost,
    internalTrailerOperatingCost,
    internalDriveLaborCost,
    baseSelectionReason,
  };
}
