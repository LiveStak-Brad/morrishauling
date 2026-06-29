#!/usr/bin/env node
/**
 * Verify migration 032 objects, storage buckets, and env prerequisites.
 * Does NOT assume migration is missing — reports actual DB/API state.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *      SUPABASE_SERVICE_ROLE_KEY (optional — enables bucket + column probes)
 *      SMOKE_TEST_BASE_URL (default http://localhost:3000)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const BASE = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MIGRATION_032 = {
  tables: ["employee_document_uploads", "applicant_documents", "document_audit_log"],
  columns: [
    { table: "employees", column: "avatar_storage_path" },
    { table: "document_templates", column: "storage_path" },
    { table: "document_template_versions", column: "storage_path" },
  ],
};

const BUCKETS = [
  "job-photos",
  "employee-documents",
  "applicant-documents",
  "hr-documents",
  "invoice-pdfs",
];

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==",
  "base64"
);

const BUCKET_PROBE = {
  "job-photos": { ext: "jpg", contentType: "image/jpeg", body: TINY_JPEG },
  "employee-documents": { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 verify") },
  "applicant-documents": { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 verify") },
  "hr-documents": { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 verify") },
  "invoice-pdfs": { ext: "pdf", contentType: "application/pdf", body: Buffer.from("%PDF-1.4 verify") },
};

const report = {
  env: {},
  migration032: { tables: {}, columns: {} },
  storage: { serviceRoleConfigured: false, buckets: {} },
  healthApi: null,
  blockers: [],
};

async function probeTable(sb, table) {
  const { error } = await sb.from(table).select("id").limit(1);
  if (!error) return { exists: true };
  if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
    return { exists: false, error: error.message };
  }
  return { exists: true, note: error.message };
}

async function probeColumn(sb, table, column) {
  const { error } = await sb.from(table).select(column).limit(1);
  if (!error) return { exists: true };
  if (
    error.code === "PGRST204" ||
    error.message?.includes("column") ||
    error.message?.includes("does not exist")
  ) {
    return { exists: false, error: error.message };
  }
  if (error.code === "PGRST205") {
    return { exists: false, error: `Table ${table} not found` };
  }
  return { exists: true, note: error.message };
}

async function main() {
  console.log("Morris OS — storage & migration 032 verification\n");

  report.env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
    NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE === "true",
  };

  console.log("Environment:");
  for (const [k, v] of Object.entries(report.env)) {
    console.log(`  ${v ? "✓" : "✗"} ${k}`);
  }
  console.log();

  if (!url || !anonKey) {
    report.blockers.push("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    printReport();
    process.exit(1);
  }

  const admin = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;

  report.storage.serviceRoleConfigured = Boolean(admin);

  const dbClient = admin ?? createClient(url, anonKey, { auth: { persistSession: false } });
  const probeLabel = admin ? "service role" : "anon (table may be RLS-hidden)";

  console.log(`Migration 032 probes (${probeLabel}):`);
  for (const table of MIGRATION_032.tables) {
    const r = await probeTable(dbClient, table);
    report.migration032.tables[table] = r;
    console.log(`  ${r.exists ? "✓" : "✗"} table ${table}${r.error ? ` — ${r.error}` : ""}`);
    if (!r.exists) {
      report.blockers.push(`Missing table: ${table} — run supabase/migrations/032_document_uploads_and_avatars.sql`);
    }
  }
  for (const { table, column } of MIGRATION_032.columns) {
    const r = await probeColumn(dbClient, table, column);
    report.migration032.columns[`${table}.${column}`] = r;
    console.log(`  ${r.exists ? "✓" : "✗"} column ${table}.${column}${r.error ? ` — ${r.error}` : ""}`);
    if (!r.exists) {
      report.blockers.push(
        `Missing column: ${table}.${column} — run supabase/migrations/032_document_uploads_and_avatars.sql`
      );
    }
  }
  console.log();

  if (admin) {
    console.log("Storage buckets (service role):");
    const { data: bucketList, error: listError } = await admin.storage.listBuckets();
    const known = new Set((bucketList ?? []).map((b) => b.id));
    if (listError) {
      console.log(`  ✗ listBuckets failed: ${listError.message}`);
      report.blockers.push(`Storage listBuckets failed: ${listError.message}`);
    }
    for (const bucket of BUCKETS) {
      const exists = known.has(bucket);
      let canUpload = false;
      let canSignUrl = false;
      let error;
      if (!exists) {
        error = `Bucket "${bucket}" not found in Supabase project`;
        report.blockers.push(error);
      } else {
        const probe = BUCKET_PROBE[bucket];
        const testPath = `_healthcheck/${Date.now()}.${probe.ext}`;
        try {
          const { error: upErr } = await admin.storage
            .from(bucket)
            .upload(testPath, probe.body, { contentType: probe.contentType, upsert: true });
          if (upErr) throw new Error(upErr.message);
          canUpload = true;
          const { data: signed, error: signErr } = await admin.storage
            .from(bucket)
            .createSignedUrl(testPath, 60);
          if (signErr || !signed?.signedUrl) throw new Error(signErr?.message ?? "no signed url");
          canSignUrl = true;
          await admin.storage.from(bucket).remove([testPath]);
        } catch (e) {
          error = e.message;
          report.blockers.push(`${bucket}: ${error}`);
        }
      }
      report.storage.buckets[bucket] = { exists, canUpload, canSignUrl, error };
      const status = exists && canUpload && canSignUrl ? "✓" : "✗";
      console.log(`  ${status} ${bucket}${error ? ` — ${error}` : ""}`);
    }
  } else {
    console.log("Storage buckets: SKIPPED — SUPABASE_SERVICE_ROLE_KEY not set");
    console.log("  (Cannot verify bucket existence or upload/signed-URL tests locally.)");
    for (const bucket of BUCKETS) {
      report.storage.buckets[bucket] = {
        exists: null,
        canUpload: null,
        canSignUrl: null,
        error: "SUPABASE_SERVICE_ROLE_KEY not configured",
      };
    }
  }
  console.log();

  try {
    const res = await fetch(`${BASE}/api/health/supabase`);
    report.healthApi = await res.json();
    console.log(`Health API (${BASE}/api/health/supabase):`);
    console.log(`  connected: ${report.healthApi.connected}`);
    console.log(`  hasServiceRole: ${report.healthApi.production?.hasServiceRole}`);
    const ts = report.healthApi.tableStatus ?? {};
    for (const table of MIGRATION_032.tables) {
      console.log(`  tableStatus.${table}: ${ts[table]}`);
    }
    console.log(`  storage.available: ${report.healthApi.storage?.available}`);
  } catch (e) {
    console.log(`Health API: unreachable — ${e.message}`);
    report.blockers.push(`Health API unreachable at ${BASE}`);
  }

  printReport();
  const hasMigrationBlocker = report.blockers.some((b) => b.includes("Missing table") || b.includes("Missing column"));
  const hasBucketBlocker = report.blockers.some((b) => b.includes("Bucket"));
  const onlyServiceRole =
    !admin && !hasMigrationBlocker && !hasBucketBlocker;

  process.exit(onlyServiceRole ? 0 : report.blockers.length ? 1 : 0);
}

function printReport() {
  console.log("\n--- SUMMARY ---");
  if (!report.storage.serviceRoleConfigured) {
    console.log(
      "Service role: MISSING — add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role)."
    );
    console.log(
      "Storage upload/signed-URL tests cannot run until the service role key is configured."
    );
  } else {
    console.log("Service role: configured");
  }
  if (report.blockers.length) {
    console.log("\nBlockers:");
    report.blockers.forEach((b) => console.log(`  - ${b}`));
  } else {
    console.log("\nNo blockers detected.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
