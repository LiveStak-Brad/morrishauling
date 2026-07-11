import type { JobPhotoType } from "@/lib/db/job-photos";

export async function uploadJobPhoto(
  jobId: string,
  file: File,
  photoType: JobPhotoType = "customer_upload",
  notes?: string,
  photoStage?: string
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("photoType", photoType);
  form.append("photoStage", photoStage ?? photoType);
  if (notes) form.append("notes", notes);

  const res = await fetch(`/api/jobs/${jobId}/photos`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "Photo upload failed");
  }
}

export async function uploadJobPhotos(
  jobId: string,
  files: File[],
  photoType: JobPhotoType = "customer_upload"
): Promise<void> {
  for (const file of files) {
    await uploadJobPhoto(jobId, file, photoType);
  }
}
