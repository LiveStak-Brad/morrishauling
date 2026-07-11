import { morrisConfig } from "@/lib/morris-config";
import { getJobById, updateJob } from "@/lib/db/operations";
import { insertJobPhoto, listJobPhotos, type JobPhotoType } from "@/lib/db/job-photos";
import { uploadToStorage } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = new Set<string>([
  "customer_upload",
  "before",
  "after",
  "damage",
  "dump_receipt",
  "arrival",
  "loaded_trailer",
  "disposal_proof",
  "pickup_condition",
  "securement",
  "loaded",
  "delivery",
  "exception",
  "other",
]);

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
    const rawType = String(form.get("photoType") ?? "customer_upload");
    const photoType = (ALLOWED_PHOTO_TYPES.has(rawType) ? rawType : "other") as JobPhotoType;
    const photoStage = String(form.get("photoStage") ?? photoType);
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
      photoStage,
      uploadedByProfileId: profile.id,
      notes,
    });

    let displayUrl = storagePath;
    try {
      const { createSignedStorageUrl } = await import("@/lib/storage/upload");
      displayUrl = await createSignedStorageUrl(STORAGE_BUCKETS.jobPhotos, storagePath);
    } catch {
      /* keep path */
    }

    // Keep jobs.payload.photos in sync — completion gates read this source of truth.
    const nextPhotos = [
      ...(job.photos ?? []),
      {
        id: photo.id,
        url: displayUrl,
        caption: photoStage,
        photoStage,
      },
    ];
    await updateJob(
      companyId,
      jobId,
      { photos: nextPhotos },
      {
        actorProfileId: profile.id,
        actorRole: profile.role,
      }
    );

    return apiOk({ photo: { ...photo, signedUrl: displayUrl } });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
