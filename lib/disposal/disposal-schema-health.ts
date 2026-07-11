import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDbReady } from "@/lib/db/operations";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";

export interface DisposalSchemaCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface DisposalSchemaHealth {
  ready: boolean;
  checks: DisposalSchemaCheck[];
}

const JRD_COLUMNS = [
  "disposal_skip_reason",
  "disposal_weight_ticket_url",
  "actual_gross_profit",
  "no_disposal_cost_reason",
  "disposal_review_status",
] as const;

const DUMP_SITE_COLUMNS = [
  "is_avoid_vendor",
  "is_preferred_vendor",
  "hours_json",
  "facility_type",
  "verification_status",
  "pricing_unknown",
] as const;

export async function checkDisposalSchemaHealth(): Promise<DisposalSchemaHealth> {
  const checks: DisposalSchemaCheck[] = [];

  // Storage bucket
  const admin = createAdminClient();
  if (admin) {
    const { data: buckets } = await admin.storage.listBuckets();
    const receiptBucket = buckets?.find((b) => b.id === STORAGE_BUCKETS.disposalReceipts);
    checks.push({
      id: "bucket_disposal_receipts",
      label: "disposal-receipts storage bucket",
      ok: Boolean(receiptBucket),
      detail: receiptBucket ? "Private bucket configured" : "Bucket missing — run migration 036",
    });
  } else {
    checks.push({
      id: "bucket_disposal_receipts",
      label: "disposal-receipts storage bucket",
      ok: false,
      detail: "Service role not configured — cannot verify bucket",
    });
  }

  if (!(await isDbReady())) {
    checks.push({
      id: "db",
      label: "Database connection",
      ok: false,
      detail: "Database not ready",
    });
    return { ready: false, checks };
  }

  const sb = admin ?? (await createClient());

  // disposal_events table
  const { error: eventsErr } = await sb.from("disposal_events").select("id").limit(1);
  checks.push({
    id: "table_disposal_events",
    label: "disposal_events table",
    ok: !eventsErr,
    detail: eventsErr?.message,
  });

  // dump_sites reference data
  const { count: siteCount, error: sitesErr } = await sb
    .from("dump_sites")
    .select("id", { count: "exact", head: true });
  checks.push({
    id: "dump_sites_data",
    label: "Disposal network facilities (040+)",
    ok: !sitesErr && (siteCount ?? 0) > 0,
    detail: sitesErr?.message ?? `${siteCount ?? 0} facilities`,
  });

  const { count: countyCount, error: countyErr } = await sb
    .from("disposal_coverage_counties")
    .select("id", { count: "exact", head: true });
  checks.push({
    id: "disposal_coverage_counties",
    label: "disposal_coverage_counties registry",
    ok: !countyErr && (countyCount ?? 0) > 0,
    detail: countyErr?.message ?? `${countyCount ?? 0} counties (run migration 040)`,
  });

  // Column probes via select
  for (const col of JRD_COLUMNS) {
    const { error } = await sb.from("junk_removal_details").select(col).limit(1);
    checks.push({
      id: `jrd_${col}`,
      label: `junk_removal_details.${col}`,
      ok: !error,
      detail: error?.message,
    });
  }

  for (const col of DUMP_SITE_COLUMNS) {
    const { error } = await sb.from("dump_sites").select(col).limit(1);
    checks.push({
      id: `dump_${col}`,
      label: `dump_sites.${col}`,
      ok: !error,
      detail: error?.message,
    });
  }

  // disposal_events extended columns (035)
  for (const col of ["wait_minutes", "weight_ticket_url"] as const) {
    const { error } = await sb.from("disposal_events").select(col).limit(1);
    checks.push({
      id: `events_${col}`,
      label: `disposal_events.${col}`,
      ok: !error,
      detail: error?.message,
    });
  }

  const ready = checks.every((c) => c.ok);
  return { ready, checks };
}
