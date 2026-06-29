import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS, type StorageBucket } from "./buckets";
import { uploadToStorage, createSignedStorageUrl } from "./upload";

export type StorageBucketHealth = {
  bucket: StorageBucket;
  /** null = not probed (service role missing) */
  exists: boolean | null;
  canUpload: boolean;
  canSignUrl: boolean;
  error?: string;
  skipped?: boolean;
};

const ALL_BUCKETS: StorageBucket[] = [
  STORAGE_BUCKETS.jobPhotos,
  STORAGE_BUCKETS.employeeDocuments,
  STORAGE_BUCKETS.applicantDocuments,
  STORAGE_BUCKETS.hrDocuments,
  STORAGE_BUCKETS.invoicePdfs,
  STORAGE_BUCKETS.disposalReceipts,
];

/** Minimal 1×1 JPEG — matches allowed MIME on photo buckets */
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==",
  "base64"
);

const BUCKET_PROBE: Record<StorageBucket, { ext: string; contentType: string; body: Buffer }> = {
  [STORAGE_BUCKETS.jobPhotos]: { ext: "jpg", contentType: "image/jpeg", body: TINY_JPEG },
  [STORAGE_BUCKETS.employeeDocuments]: { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 healthcheck") },
  [STORAGE_BUCKETS.applicantDocuments]: { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 healthcheck") },
  [STORAGE_BUCKETS.hrDocuments]: { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 healthcheck") },
  [STORAGE_BUCKETS.invoicePdfs]: { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 healthcheck") },
  [STORAGE_BUCKETS.disposalReceipts]: { ext: "jpg", contentType: "image/jpeg", body: TINY_JPEG },
};

export async function checkStorageHealth(): Promise<{
  available: boolean;
  serviceRoleConfigured: boolean;
  buckets: StorageBucketHealth[];
}> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      available: false,
      serviceRoleConfigured: false,
      buckets: ALL_BUCKETS.map((bucket) => ({
        bucket,
        exists: null,
        canUpload: false,
        canSignUrl: false,
        skipped: true,
        error: "SUPABASE_SERVICE_ROLE_KEY not configured",
      })),
    };
  }

  const { data: bucketList, error: listError } = await admin.storage.listBuckets();
  const knownIds = new Set((bucketList ?? []).map((b) => b.id));

  const results: StorageBucketHealth[] = [];

  for (const bucket of ALL_BUCKETS) {
    const exists = !listError && knownIds.has(bucket);
    let canUpload = false;
    let canSignUrl = false;
    let error: string | undefined = listError?.message;

    if (!exists) {
      error = error ?? `Bucket "${bucket}" not found`;
    } else {
      const probe = BUCKET_PROBE[bucket];
      const testPath = `_healthcheck/${Date.now()}.${probe.ext}`;
      try {
        await uploadToStorage({
          bucket,
          path: testPath,
          body: probe.body,
          contentType: probe.contentType,
        });
        canUpload = true;
        await createSignedStorageUrl(bucket, testPath, 60);
        canSignUrl = true;
        await admin.storage.from(bucket).remove([testPath]);
      } catch (e) {
        error = e instanceof Error ? e.message : "Storage test failed";
      }
    }

    results.push({ bucket, exists, canUpload, canSignUrl, error });
  }

  return {
    available: results.every((b) => b.exists === true && b.canUpload && b.canSignUrl),
    serviceRoleConfigured: true,
    buckets: results,
  };
}
