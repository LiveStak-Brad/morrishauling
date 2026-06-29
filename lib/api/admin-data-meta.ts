import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { useSupabaseData } from "@/lib/db/config";

export type AdminDataSource = "supabase" | "mock" | "empty";

export interface AdminListMeta {
  source: AdminDataSource;
  count: number;
  filteredCount: number;
  excludedDemoCount: number;
}

export async function resolveAdminDataSource(): Promise<AdminDataSource> {
  if (useSupabaseData()) return "supabase";
  if (isDemoDataEnabled()) return "mock";
  return "empty";
}

/** Build list metadata for admin API responses. */
export function buildListMeta(rawCount: number, filteredCount: number, source: AdminDataSource): AdminListMeta {
  return {
    source,
    count: rawCount,
    filteredCount,
    excludedDemoCount: Math.max(0, rawCount - filteredCount),
  };
}

export async function buildListMetaFromCounts(
  rawCount: number,
  filteredCount: number
): Promise<AdminListMeta> {
  return buildListMeta(rawCount, filteredCount, await resolveAdminDataSource());
}
