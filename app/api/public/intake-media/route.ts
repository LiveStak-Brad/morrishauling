import { apiError, apiOk } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { uploadToStorage } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import { billingId } from "@/lib/billing/utils";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "public-intake-media",
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const form = await request.formData();
    const estimateId = String(form.get("estimateId") ?? "");
    const file = form.get("file");
    if (!estimateId) return apiError("estimateId required", 400);
    if (!(file instanceof File)) return apiError("file required", 400);

    const sb = createAdminClient();
    if (!sb) return apiError("Database unavailable", 503);

    const { data: estimate } = await sb
      .from("estimates")
      .select("id, company_id")
      .eq("id", estimateId)
      .eq("company_id", MORRIS_COMPANY_ID)
      .maybeSingle();
    if (!estimate) return apiError("Estimate not found", 404);

    const isVideo = VIDEO_TYPES.has(file.type);
    const isImage = IMAGE_TYPES.has(file.type);
    if (!isVideo && !isImage) return apiError("Unsupported file type", 400);
    if (isImage && file.size > MAX_IMAGE) return apiError("Image too large (max 10MB)", 400);
    if (isVideo && file.size > MAX_VIDEO) return apiError("Video too large (max 50MB)", 400);

    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || (isVideo ? "mp4" : "jpg");
    const path = `intake/${estimateId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await uploadToStorage({
      bucket: STORAGE_BUCKETS.intakeMedia,
      path,
      body: buf,
      contentType: file.type,
    });

    const { data: intake } = await sb
      .from("equipment_intake_details")
      .select("id")
      .eq("estimate_id", estimateId)
      .maybeSingle();

    const { error } = await sb.from("equipment_intake_media").insert({
      id: billingId("eqm"),
      company_id: MORRIS_COMPANY_ID,
      estimate_id: estimateId,
      intake_id: intake?.id ?? null,
      storage_path: path,
      media_kind: isVideo ? "video" : "photo",
      mime_type: file.type,
      original_name: file.name,
    });
    if (error) throw error;

    return apiOk({ path, kind: isVideo ? "video" : "photo" });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
