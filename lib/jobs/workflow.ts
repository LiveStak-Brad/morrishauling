import type { DivisionId } from "@/lib/divisions";
import type { Job } from "@/types/job";
import type { HaulingJobStatus, JunkJobStatus, JobPhotoStage, OperationalJobStatus } from "@/types/division";

/** Map legacy coarse statuses into the operational vocabulary. */
export function normalizeJobStatus(status: string | undefined): OperationalJobStatus {
  switch (status) {
    case "submitted":
      return "new_request";
    case "estimated":
      return "estimate_prepared";
    case "in_progress":
      return "loading";
    case "needs_dump":
      return "disposal_required";
    case "cancelled":
      return "canceled";
    default:
      return (status as OperationalJobStatus) || "new_request";
  }
}

/** Coarse status for UIs that still expect the original JobStatus union. */
export function toLegacyJobStatus(status: string | undefined): Job["status"] {
  const n = normalizeJobStatus(status);
  switch (n) {
    case "draft":
      return "draft";
    case "new_request":
    case "review_required":
    case "load_review_required":
      return "submitted";
    case "estimate_prepared":
    case "estimate_sent":
    case "customer_approved":
      return "estimated";
    case "scheduled":
    case "crew_assigned":
    case "driver_assigned":
    case "equipment_assigned":
      return "scheduled";
    case "en_route":
    case "arrived":
    case "loading":
    case "traveling_to_pickup":
    case "arrived_at_pickup":
    case "secured":
    case "in_transit":
    case "arrived_at_delivery":
    case "unloading":
    case "delivery_proof_captured":
    case "returning":
    case "disposed":
    case "traveling_to_disposal":
      return "in_progress";
    case "disposal_required":
      return "needs_dump";
    case "completed":
    case "invoiced":
    case "paid":
      return "completed";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return (status as Job["status"]) || "submitted";
  }
}

export const JUNK_FIELD_FLOW: { status: JunkJobStatus; label: string }[] = [
  { status: "en_route", label: "En route" },
  { status: "arrived", label: "Arrived" },
  { status: "loading", label: "Loading" },
  { status: "disposal_required", label: "Disposal required" },
  { status: "traveling_to_disposal", label: "Traveling to disposal" },
  { status: "disposed", label: "Disposed" },
  { status: "returning", label: "Returning" },
  { status: "completed", label: "Completed" },
];

export const HAULING_FIELD_FLOW: { status: HaulingJobStatus; label: string }[] = [
  { status: "traveling_to_pickup", label: "Traveling to pickup" },
  { status: "arrived_at_pickup", label: "Arrived at pickup" },
  { status: "loading", label: "Loading" },
  { status: "secured", label: "Secured" },
  { status: "in_transit", label: "In transit" },
  { status: "arrived_at_delivery", label: "Arrived at delivery" },
  { status: "unloading", label: "Unloading" },
  { status: "delivery_proof_captured", label: "Delivery proof" },
  { status: "completed", label: "Completed" },
];

export function fieldFlowForDivision(divisionId: DivisionId) {
  return divisionId === "hauling" ? HAULING_FIELD_FLOW : JUNK_FIELD_FLOW;
}

export function requiredPhotoStagesForCompletion(divisionId: DivisionId): JobPhotoStage[] {
  if (divisionId === "hauling") {
    return ["pickup_condition", "securement", "loaded", "delivery"];
  }
  return ["arrival", "before", "loaded_trailer", "after"];
}

export function jobPhotoStages(job: Job): string[] {
  return (job.photos ?? []).map((p) => {
    const anyPhoto = p as { stage?: string; photoStage?: string; caption?: string };
    return anyPhoto.photoStage || anyPhoto.stage || anyPhoto.caption || "other";
  });
}

export function missingRequiredPhotos(
  job: Job,
  divisionId: DivisionId
): JobPhotoStage[] {
  const have = new Set(jobPhotoStages(job).map((s) => s.toLowerCase()));
  return requiredPhotoStagesForCompletion(divisionId).filter((stage) => {
    const key = stage.toLowerCase();
    if (have.has(key)) return false;
    // Accept loose caption matches from older uploads
    for (const h of have) {
      if (h.includes(key.replace(/_/g, " ")) || h.includes(key)) return false;
    }
    return true;
  });
}

export function canCompleteWithProof(
  job: Job,
  divisionId: DivisionId,
  opts?: { managerOverride?: boolean; overrideReason?: string }
): { ok: true } | { ok: false; message: string; missingPhotos: JobPhotoStage[] } {
  if (opts?.managerOverride && opts.overrideReason?.trim()) {
    return { ok: true };
  }
  const missing = missingRequiredPhotos(job, divisionId);
  if (missing.length === 0) return { ok: true };
  return {
    ok: false,
    message: `Required photos missing before completion: ${missing.join(", ")}. A manager can override with a reason.`,
    missingPhotos: missing,
  };
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  new_request: "New request",
  submitted: "New request",
  review_required: "Review required",
  load_review_required: "Load review required",
  estimate_prepared: "Estimate prepared",
  estimated: "Estimate prepared",
  estimate_sent: "Estimate sent",
  customer_approved: "Customer approved",
  scheduled: "Scheduled",
  crew_assigned: "Crew assigned",
  driver_assigned: "Driver assigned",
  equipment_assigned: "Equipment assigned",
  en_route: "En route",
  arrived: "Arrived",
  loading: "Loading",
  disposal_required: "Disposal required",
  needs_dump: "Disposal required",
  traveling_to_disposal: "Traveling to disposal",
  disposed: "Disposed",
  returning: "Returning",
  traveling_to_pickup: "Traveling to pickup",
  arrived_at_pickup: "Arrived at pickup",
  secured: "Secured",
  in_transit: "In transit",
  arrived_at_delivery: "Arrived at delivery",
  unloading: "Unloading",
  delivery_proof_captured: "Delivery proof captured",
  in_progress: "In progress",
  completed: "Completed",
  invoiced: "Invoiced",
  paid: "Paid",
  canceled: "Canceled",
  cancelled: "Canceled",
};
