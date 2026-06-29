import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { useSupabaseData } from "./config";
import { appendMockActivity, getMockActivityLog } from "@/lib/mock-data";

function activityId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function canLogToDb(): Promise<boolean> {
  if (!useSupabaseData()) return false;
  try {
    const sb = await createClient();
    const { error } = await sb.from("activity_log").select("id").limit(1);
    return !error || error.code !== "PGRST205";
  } catch {
    return false;
  }
}

export async function logActivity(params: {
  companyId: string;
  actorProfileId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const row = {
    id: activityId(),
    company_id: params.companyId,
    actor_profile_id: params.actorProfileId ?? null,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    message: params.message,
    metadata: params.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  if (await canLogToDb()) {
    const sb = createAdminClient() ?? (await createClient());
    await sb.from("activity_log").insert(row);
  } else {
    appendMockActivity(row);
  }
}

export async function getActivityLogRows(companyId: string, limit = 50) {
  if (await canLogToDb()) {
    const sb = await createClient();
    const { data, error } = await sb
      .from("activity_log")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
  return getMockActivityLog(companyId, limit);
}
