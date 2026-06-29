import { morrisConfig } from "@/lib/morris-config";
import { getJobById } from "@/lib/db/operations";
import { insertJobPhoto, listJobPhotos, type JobPhotoType } from "@/lib/db/job-photos";
import { uploadToStorage } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const { id: jobId } = await params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);

    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const photos = await listJobPhotos(companyId, jobId, { withSignedUrls: true });
    return apiOk({ photos });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load photos", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const { id: jobId } = await params;
    const companyId = morrisConfig.companyId;
    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);

    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const form = await request.formData();
    const file = form.get("file");
    const photoType = (form.get("photoType") as JobPhotoType) ?? "customer_upload";
    const notes = (form.get("notes") as string) ?? undefined;

    if (!(file instanceof File)) return apiError("file required", 400);
    if (!ALLOWED_TYPES.has(file.type)) return apiError("Unsupported image type", 400);
    if (file.size > MAX_BYTES) return apiError("File too large (max 10MB)", 400);

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${companyId}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadToStorage({
      bucket: STORAGE_BUCKETS.jobPhotos,
      path: storagePath,
      body: buffer,
      contentType: file.type,
    });

    const photo = await insertJobPhoto({
      companyId,
      jobId,
      storagePath,
      photoType,
      uploadedByProfileId: profile.id,
      notes,
    });

    return apiOk({ photo });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
