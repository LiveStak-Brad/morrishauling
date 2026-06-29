import { createAdminClient } from "@/lib/supabase/admin";
import type { StorageBucket } from "./buckets";

function requireAdmin() {
  const admin = createAdminClient();
  if (!admin) throw new Error("Storage unavailable — configure SUPABASE_SERVICE_ROLE_KEY");
  return admin;
}

export async function uploadToStorage(params: {
  bucket: StorageBucket;
  path: string;
  body: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}): Promise<{ path: string }> {
  const admin = requireAdmin();
  const { error } = await admin.storage.from(params.bucket).upload(params.path, params.body, {
    contentType: params.contentType,
    upsert: params.upsert ?? true,
  });
  if (error) throw new Error(error.message);
  return { path: params.path };
}

export async function createSignedStorageUrl(
  bucket: StorageBucket,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const admin = requireAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to sign URL");
  return data.signedUrl;
}

export async function downloadFromStorage(bucket: StorageBucket, path: string): Promise<ArrayBuffer> {
  const admin = requireAdmin();
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error || !data) throw new Error(error?.message ?? "Download failed");
  return data.arrayBuffer();
}
