import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionId, DivisionLaunchStatus } from "@/lib/divisions";
import { DIVISION_LAUNCH_LABELS } from "@/lib/divisions";

export type DivisionRow = {
  id: DivisionId;
  companyId: string;
  name: string;
  shortName: string;
  serviceType: string;
  launchStatus: DivisionLaunchStatus;
  logoPath: string | null;
  config: Record<string, unknown>;
};

const ALLOWED: DivisionLaunchStatus[] = [
  "setup",
  "internal_testing",
  "accepting_interest",
  "accepting_estimate_requests",
  "accepting_bookings",
  "temporarily_paused",
];

export function isValidLaunchStatus(v: string): v is DivisionLaunchStatus {
  return (ALLOWED as string[]).includes(v);
}

export async function listDivisions(companyId: string): Promise<DivisionRow[]> {
  const sb = createAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("divisions")
    .select("id, company_id, name, short_name, service_type, launch_status, logo_path, config")
    .eq("company_id", companyId)
    .order("id");
  if (error || !data) {
    console.warn("[divisions] list failed:", error?.message);
    return [];
  }
  return data.map((r) => ({
    id: r.id as DivisionId,
    companyId: r.company_id as string,
    name: r.name as string,
    shortName: r.short_name as string,
    serviceType: r.service_type as string,
    launchStatus: (r.launch_status as DivisionLaunchStatus) || "accepting_interest",
    logoPath: (r.logo_path as string) || null,
    config: (r.config as Record<string, unknown>) || {},
  }));
}

export async function getDivisionLaunchStatus(
  companyId: string,
  divisionId: DivisionId
): Promise<DivisionLaunchStatus | null> {
  const sb = createAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("divisions")
    .select("launch_status")
    .eq("company_id", companyId)
    .eq("id", divisionId)
    .maybeSingle();
  if (error || !data) return null;
  const s = data.launch_status as string;
  return isValidLaunchStatus(s) ? s : null;
}

export async function updateDivisionLaunchStatus(input: {
  companyId: string;
  divisionId: DivisionId;
  launchStatus: DivisionLaunchStatus;
  actorProfileId?: string;
}): Promise<DivisionRow | null> {
  if (!isValidLaunchStatus(input.launchStatus)) {
    throw new Error(`Invalid launch status: ${input.launchStatus}`);
  }
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");

  const { data, error } = await sb
    .from("divisions")
    .update({
      launch_status: input.launchStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", input.companyId)
    .eq("id", input.divisionId)
    .select("id, company_id, name, short_name, service_type, launch_status, logo_path, config")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  try {
    await sb.from("activity_log").insert({
      id: `al-div-${Date.now()}`,
      company_id: input.companyId,
      actor_profile_id: input.actorProfileId ?? null,
      entity_type: "division",
      entity_id: input.divisionId,
      action: "launch_status_changed",
      message: `${data.name} launch status → ${DIVISION_LAUNCH_LABELS[input.launchStatus]}`,
      metadata: { launchStatus: input.launchStatus },
    });
  } catch {
    /* activity_log optional */
  }

  return {
    id: data.id as DivisionId,
    companyId: data.company_id as string,
    name: data.name as string,
    shortName: data.short_name as string,
    serviceType: data.service_type as string,
    launchStatus: data.launch_status as DivisionLaunchStatus,
    logoPath: (data.logo_path as string) || null,
    config: (data.config as Record<string, unknown>) || {},
  };
}
