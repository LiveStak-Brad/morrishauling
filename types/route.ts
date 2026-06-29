// @supabase-table: route_plans

import type { LatLng } from "./company";
import type { EstimateWarning } from "./job";

export type RouteStopType = "start" | "pickup" | "dump" | "end";

export type RouteWarningType =
  | "trailer_likely_full"
  | "heavy_load"
  | "stairs_access"
  | "long_carry"
  | "price_adjustment"
  | "outside_service_area";

export interface RouteWarning {
  type: RouteWarningType | EstimateWarning;
  message: string;
  jobId?: string;
}

export interface RouteStop {
  id: string;
  type: RouteStopType;
  jobId?: string;
  dumpSiteId?: string;
  label: string;
  location: LatLng;
  trailerLoadBefore: number;
  trailerLoadAfter: number;
  distanceFromPreviousMiles: number;
  warnings: RouteWarning[];
}

export interface TrailerLoadState {
  currentPercent: number;
  capacityPercent: number;
}

export interface RoutePlanInput {
  jobIds: string[];
  startPoint: LatLng;
  endPoint?: LatLng;
  truckId: string;
  trailerId: string;
  employeeIds: string[];
  sortByDistance?: boolean;
}

export interface RoutePlan {
  id: string;
  companyId: string;
  stops: RouteStop[];
  totalDistanceMiles: number;
  warnings: RouteWarning[];
  trailerId: string;
  truckId: string;
  employeeIds: string[];
  createdAt: string;
}
