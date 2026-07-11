import type { DivisionId, ServiceType } from "@/lib/divisions";

export type { DivisionId, DivisionLaunchStatus, DivisionConfig } from "@/lib/divisions";

/** Granular operational statuses — stored on jobs.status (text). */
export type JunkJobStatus =
  | "draft"
  | "new_request"
  | "review_required"
  | "estimate_prepared"
  | "estimate_sent"
  | "customer_approved"
  | "scheduled"
  | "crew_assigned"
  | "en_route"
  | "arrived"
  | "loading"
  | "disposal_required"
  | "traveling_to_disposal"
  | "disposed"
  | "returning"
  | "completed"
  | "invoiced"
  | "paid"
  | "canceled"
  /** Legacy aliases kept for existing rows / UI */
  | "submitted"
  | "estimated"
  | "in_progress"
  | "needs_dump"
  | "cancelled";

export type HaulingJobStatus =
  | "draft"
  | "new_request"
  | "load_review_required"
  | "estimate_prepared"
  | "estimate_sent"
  | "customer_approved"
  | "scheduled"
  | "driver_assigned"
  | "equipment_assigned"
  | "traveling_to_pickup"
  | "arrived_at_pickup"
  | "loading"
  | "secured"
  | "in_transit"
  | "arrived_at_delivery"
  | "unloading"
  | "delivery_proof_captured"
  | "completed"
  | "invoiced"
  | "paid"
  | "canceled"
  /** Legacy */
  | "submitted"
  | "estimated"
  | "in_progress"
  | "cancelled";

export type OperationalJobStatus = JunkJobStatus | HaulingJobStatus;

export type JobPhotoStage =
  | "customer_upload"
  | "arrival"
  | "before"
  | "loaded_trailer"
  | "disposal_proof"
  | "after"
  | "pickup_condition"
  | "securement"
  | "loaded"
  | "delivery"
  | "damage"
  | "other";

export type MaterialHandlingPolicy = "accepted" | "restricted" | "prohibited";

export type MaterialCategory = {
  id: string;
  name: string;
  divisionId: DivisionId;
  policy: MaterialHandlingPolicy;
  notes?: string;
  disposalHint?: string;
};

export type DivisionAccessScope = DivisionId | "all";

export type ProfileDivisionAccess = {
  profileId: string;
  scope: DivisionAccessScope;
  divisions: DivisionId[];
};
