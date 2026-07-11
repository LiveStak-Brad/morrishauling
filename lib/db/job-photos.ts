import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createSignedStorageUrl } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { isDbReady } from "@/lib/db/operations";

/** Legacy + operational proof stages stored in photo_type / photo_stage. */
export type JobPhotoType =
  | "customer_upload"
  | "before"
  | "after"
  | "damage"
  | "dump_receipt"
  | "arrival"
  | "loaded_trailer"
  | "disposal_proof"
  | "pickup_condition"
  | "securement"
  | "loaded"
  | "delivery"
  | "exception"
  | "other";

export interface JobPhotoRecord {
  id: string;
  companyId: string;
  jobId: string;
  uploadedByProfileId?: string;
  storagePath: string;
  photoType: JobPhotoType;
  photoStage?: string;
  notes?: string;
  createdAt: string;
  signedUrl?: string;
}

function photoId() {
  return `jp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function insertJobPhoto(params: {
  companyId: string;
  jobId: string;
  storagePath: string;
  photoType: JobPhotoType;
  photoStage?: string;
  uploadedByProfileId?: string;
  notes?: string;
}): Promise<JobPhotoRecord> {
  if (!(await isDbReady())) throw new Error("Database not available");

  const id = photoId();
  const stage = params.photoStage ?? params.photoType;
  const row = {
    id,
    company_id: params.companyId,
    job_id: params.jobId,
    uploaded_by_profile_id: params.uploadedByProfileId ?? null,
    photo_url: params.storagePath,
    photo_type: params.photoType,
    photo_stage: stage,
    notes: params.notes ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await (await sbWrite()).from("job_photos").insert(row);
  if (error) throw error;

  return {
    id,
    companyId: params.companyId,
    jobId: params.jobId,
    uploadedByProfileId: params.uploadedByProfileId,
    storagePath: params.storagePath,
    photoType: params.photoType,
    photoStage: stage,
    notes: params.notes,
    createdAt: row.created_at,
  };
}

export async function listJobPhotos(
  companyId: string,
  jobId: string,
  options?: { withSignedUrls?: boolean }
): Promise<JobPhotoRecord[]> {
  if (!(await isDbReady())) return [];

  const { data, error } = await (await createClient())
    .from("job_photos")
    .select("*")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    jobId: r.job_id as string,
    uploadedByProfileId: (r.uploaded_by_profile_id as string) ?? undefined,
    storagePath: r.photo_url as string,
    photoType: r.photo_type as JobPhotoType,
    photoStage: (r.photo_stage as string) ?? (r.photo_type as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    createdAt: r.created_at as string,
  }));

  if (!options?.withSignedUrls) return rows;

  return Promise.all(
    rows.map(async (p) => {
      try {
        const signedUrl = await createSignedStorageUrl(STORAGE_BUCKETS.jobPhotos, p.storagePath);
        return { ...p, signedUrl };
      } catch {
        return p;
      }
    })
  );
}
