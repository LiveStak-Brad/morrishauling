import { morrisConfig } from "@/lib/morris-config";
import { getJobById } from "@/lib/db/operations";
import { getJobDisposalState, recordJobDisposal } from "@/lib/db/disposal-facilities";
import { uploadToStorage } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);
const MAX_BYTES = 20 * 1024 * 1024;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  try {
    const { id: jobId } = await context.params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);
    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const state = await getJobDisposalState(companyId, jobId);
    return apiOk({ disposal: state });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load disposal", 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner", "employee"].includes(profile.role)) {
    return apiError("Access denied", 403);
  }

  try {
    const { id: jobId } = await context.params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);
    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const body = await parseJson<{
      actualSiteId: string;
      actualSiteName?: string;
      actualCost: number;
      actualWeightTons?: number;
      receiptUrl?: string;
      weightTicketUrl?: string;
      notes?: string;
      overrideReason?: string;
      recommendedSiteId?: string;
      estimatedCost?: number;
      driveMiles?: number;
      driveMinutes?: number;
      fuelCost?: number;
      waitMinutes?: number;
      unloadMinutes?: number;
      laborCost?: number;
      truckOperatingCost?: number;
      markJobCompleted?: boolean;
      noDisposalCostReason?: string;
    }>(request);

    if (!body.actualSiteId || body.actualCost == null) {
      return apiError("actualSiteId and actualCost required", 400);
    }
    if (body.actualCost === 0 && !body.noDisposalCostReason?.trim()) {
      return apiError("noDisposalCostReason required when actual cost is $0", 400);
    }

    const result = await recordJobDisposal(companyId, jobId, {
      ...body,
      actorProfileId: profile.id,
    });
    const disposal = await getJobDisposalState(companyId, jobId);
    return apiOk({ ...result, disposal });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to record disposal", 500);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner", "employee"].includes(profile.role)) {
    return apiError("Access denied", 403);
  }

  try {
    const { id: jobId } = await context.params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);
    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const form = await request.formData();
    const file = form.get("file");
    const fileType = (form.get("fileType") as string) ?? "receipt";

    if (!(file instanceof File)) return apiError("file required", 400);
    if (!ALLOWED_TYPES.has(file.type)) return apiError("Unsupported file type", 400);
    if (file.size > MAX_BYTES) return apiError("File too large (max 20MB)", 400);

    const ext =
      file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
    const storagePath = `${companyId}/${jobId}/${fileType}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadToStorage({
      bucket: STORAGE_BUCKETS.disposalReceipts,
      path: storagePath,
      body: buffer,
      contentType: file.type,
    });

    return apiOk({ storagePath, fileType });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
