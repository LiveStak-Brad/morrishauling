import { getPrimaryOperatingBase } from "@/lib/geo/service-area";
import { routeDriving } from "@/lib/geo/route-driving";
import { selectDisposalSite, type DisposalCategory } from "@/lib/disposal/disposal-routing";
import { morrisConfig } from "@/lib/morris-config";
import type { VerifiedAddress } from "@/types/address";
import { assertVerifiedForBooking } from "@/lib/geo/verify-place";
import { RouteCalculationError, secondsToHours } from "@/lib/geo/types";
import type { LatLng } from "@/types";

export type JunkRoutePlan = {
  customer: VerifiedAddress;
  base: { id: string; name: string; location: LatLng };
  /** Filled when disposal system provides / selects a destination — never hardcoded here */
  dump: {
    id: string;
    name: string;
    location: LatLng;
    category: DisposalCategory;
  } | null;
  /** Base → customer (always calculated) */
  dispatchMiles: number;
  /** Customer → disposal (0 when disposal not yet inserted) */
  customerToDisposalMiles: number;
  /** Disposal → base, or customer → base when disposal pending */
  returnMiles: number;
  totalRouteMiles: number;
  driveDurationSeconds: number;
  estimatedDriverHours: number;
  provider: string;
  disposalPending: boolean;
};

/**
 * Junk road legs from the primary operating base.
 * Always computes Base → Customer. Disposal destination is inserted by the disposal
 * system (selectDisposalSite or an explicit override) — never a hardcoded dump.
 */
export async function planJunkRoute(input: {
  customer: VerifiedAddress;
  materialCategories?: DisposalCategory[];
  loadMinutes?: number;
  /** Explicit disposal destination from the disposal system */
  disposal?: {
    id: string;
    name: string;
    location: LatLng;
    category?: DisposalCategory;
  } | null;
  /** When true and no disposal provided, only Base↔Customer legs (disposal pending) */
  allowPendingDisposal?: boolean;
}): Promise<JunkRoutePlan> {
  assertVerifiedForBooking(input.customer, "Service address");

  const base = getPrimaryOperatingBase();
  if (!base?.location) {
    throw new RouteCalculationError("route_failed", "Operating base is not configured.");
  }

  const customerLoc = { lat: input.customer.lat, lng: input.customer.lng };
  const category = (input.materialCategories?.[0] ?? "general_junk") as DisposalCategory;

  let dump: JunkRoutePlan["dump"] = null;
  if (input.disposal?.location) {
    dump = {
      id: input.disposal.id,
      name: input.disposal.name,
      location: input.disposal.location,
      category: input.disposal.category ?? category,
    };
  } else if (!input.allowPendingDisposal) {
    const selection = selectDisposalSite(
      morrisConfig.dumpSites as Parameters<typeof selectDisposalSite>[0],
      category,
      customerLoc
    );
    if (selection?.site?.location && selection.site.id !== "unknown") {
      dump = {
        id: selection.site.id,
        name: selection.site.name,
        location: selection.site.location,
        category: selection.category,
      };
    }
  }

  const toCustomer = await routeDriving(base.location, customerLoc);
  const dispatchMiles = toCustomer.distanceMiles;

  if (!dump) {
    // Disposal system has not inserted a destination yet — keep base↔customer ready
    const returnLeg = await routeDriving(customerLoc, base.location);
    const returnMiles = returnLeg.distanceMiles;
    const totalRouteMiles = Math.round((dispatchMiles + returnMiles) * 10) / 10;
    const driveDurationSeconds = toCustomer.durationSeconds + returnLeg.durationSeconds;
    const loadMinutes = input.loadMinutes ?? 45;
    return {
      customer: input.customer,
      base: { id: base.id, name: base.name, location: base.location },
      dump: null,
      dispatchMiles,
      customerToDisposalMiles: 0,
      returnMiles,
      totalRouteMiles,
      driveDurationSeconds,
      estimatedDriverHours: Math.max(
        0.5,
        secondsToHours(driveDurationSeconds + loadMinutes * 60)
      ),
      provider: [toCustomer.provider, returnLeg.provider].join("+"),
      disposalPending: true,
    };
  }

  const toDump = await routeDriving(customerLoc, dump.location);
  const toBase = await routeDriving(dump.location, base.location);
  const customerToDisposalMiles = toDump.distanceMiles;
  const returnMiles = toBase.distanceMiles;
  const totalRouteMiles =
    Math.round((dispatchMiles + customerToDisposalMiles + returnMiles) * 10) / 10;
  const driveDurationSeconds =
    toCustomer.durationSeconds + toDump.durationSeconds + toBase.durationSeconds;
  const loadMinutes = input.loadMinutes ?? 45;

  return {
    customer: input.customer,
    base: { id: base.id, name: base.name, location: base.location },
    dump,
    dispatchMiles,
    customerToDisposalMiles,
    returnMiles,
    totalRouteMiles,
    driveDurationSeconds,
    estimatedDriverHours: Math.max(
      0.5,
      secondsToHours(driveDurationSeconds + loadMinutes * 60)
    ),
    provider: [toCustomer.provider, toDump.provider, toBase.provider].join("+"),
    disposalPending: false,
  };
}
