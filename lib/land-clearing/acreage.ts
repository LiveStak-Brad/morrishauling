export type WorkAreaGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

export type AcreageSource = "customer_entered" | "map_calculated" | "onsite_verified";

export type WorkArea = {
  id: string;
  label?: string;
  geometry?: WorkAreaGeometry;
  acres?: number;
};

export const SQ_METERS_PER_ACRE = 4046.8564224;

export function squareMetersToAcres(sqMeters: number): number {
  if (!Number.isFinite(sqMeters) || sqMeters <= 0) return 0;
  return Math.round((sqMeters / SQ_METERS_PER_ACRE) * 100) / 100;
}

export function totalWorkAreaAcres(areas: WorkArea[] | undefined): number {
  if (!areas?.length) return 0;
  return Math.round(areas.reduce((sum, a) => sum + (a.acres ?? 0), 0) * 100) / 100;
}

export function resolveAcreageSource(input: {
  mapAcres?: number | null;
  enteredAcres?: number | null;
  verifiedAcres?: number | null;
}): { acres: number | null; source: AcreageSource | null } {
  if (input.verifiedAcres != null && input.verifiedAcres > 0) {
    return { acres: input.verifiedAcres, source: "onsite_verified" };
  }
  if (input.mapAcres != null && input.mapAcres > 0) {
    return { acres: input.mapAcres, source: "map_calculated" };
  }
  if (input.enteredAcres != null && input.enteredAcres > 0) {
    return { acres: input.enteredAcres, source: "customer_entered" };
  }
  return { acres: null, source: null };
}

export const MAP_ACREAGE_DISCLAIMER =
  "Map measurements are estimates and may be adjusted after site review.";
