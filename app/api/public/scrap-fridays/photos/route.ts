import { apiError, apiOk } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { addScrapMedia, getScrapRequest, updateScrapRequest } from "@/lib/db/scrap-fridays";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { uploadToStorage } from "@/lib/storage/upload";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "scrap-photos",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const form = await request.formData();
    const requestId = String(form.get("requestId") || "");
    const purpose = String(form.get("purpose") || "overview");
    const file = form.get("file");
    if (!requestId) return apiError("requestId required", 400);
    if (!(file instanceof File)) return apiError("file required", 400);
    if (file.size > 10 * 1024 * 1024) return apiError("Max photo size is 10MB", 400);

    const existing = await getScrapRequest(requestId);
    if (!existing) return apiError("Request not found", 404);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${MORRIS_COMPANY_ID}/scrap-fridays/${requestId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await uploadToStorage({
      bucket: STORAGE_BUCKETS.jobPhotos,
      path,
      body: buf,
      contentType: file.type || "image/jpeg",
    });

    const media = await addScrapMedia({
      requestId,
      storagePath: path,
      mediaPurpose: purpose,
      mediaType: "photo",
    });
    await updateScrapRequest(requestId, { photos_confirmed: true });

    return apiOk({ media });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed");
  }
}
