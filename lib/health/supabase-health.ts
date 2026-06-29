import { createClient } from "@/lib/supabase/server";
import { validateProductionEnv } from "@/lib/env/production";
import { checkStorageHealth } from "@/lib/storage/health";

const CORE_TABLES = [
  "companies",
  "profiles",
  "customers",
  "employees",
  "jobs",
  "job_photos",
  "estimates",
  "invoices",
  "payments",
  "employee_documents",
  "document_templates",
  "employee_document_uploads",
  "applicant_documents",
  "document_audit_log",
  "activity_log",
  "company_settings",
];

/** Minimal public health — no schema, env, or storage details. */
export async function getPublicSupabaseHealth(): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("companies").select("id").limit(1);
    const connected = !error || error.code !== "PGRST205";
    return { ok: connected };
  } catch {
    return { ok: false };
  }
}

/** Full diagnostics for authenticated admins only. */
export async function getDetailedSupabaseHealth() {
  const supabase = await createClient();
  const tableStatus: Record<string, boolean> = {};

  for (const table of CORE_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    tableStatus[table] = !error || error.code !== "PGRST205";
  }

  const tablesReady = tableStatus.customers === true && tableStatus.jobs === true;
  const production = validateProductionEnv();

  let storage: Awaited<ReturnType<typeof checkStorageHealth>> | null = null;
  try {
    storage = await checkStorageHealth();
  } catch {
    storage = {
      available: false,
      serviceRoleConfigured: false,
      buckets: [],
    };
  }

  const storageWarnings = (storage?.buckets ?? [])
    .filter((b) => b.skipped || b.exists === false || !b.canUpload || !b.canSignUrl)
    .map((b) => {
      if (b.skipped) return `${b.bucket}: upload/signed-URL test skipped (service role key missing)`;
      return `${b.bucket}: ${b.error ?? "unavailable"}`;
    });

  const migration032 = {
    employee_document_uploads: tableStatus.employee_document_uploads === true,
    applicant_documents: tableStatus.applicant_documents === true,
    document_audit_log: tableStatus.document_audit_log === true,
  };

  return {
    ok: true,
    connected: true,
    tablesReady,
    tableStatus,
    migration032,
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE === "true",
    production,
    storage: {
      available: storage?.available ?? false,
      serviceRoleConfigured: storage?.serviceRoleConfigured ?? false,
      buckets: storage?.buckets ?? [],
      warnings: storageWarnings,
    },
  };
}
