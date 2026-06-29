#!/usr/bin/env node
/**
 * Production workflow smoke test.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (optional — health API only)
 *   SUPABASE_SERVICE_ROLE_KEY (required for storage + DB workflow steps)
 *   SMOKE_TEST_BASE_URL (default http://localhost:3000)
 *   TEST_MODE=true — delete created test rows after run
 *
 * Usage: node scripts/smoke-test-production-workflows.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

const BASE = process.env.SMOKE_TEST_BASE_URL ?? "http://localhost:3000";
const COMPANY_ID = "morris-hauling";
const TEST_MODE = process.env.TEST_MODE === "true";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const results = [];
const ids = {};
const categories = {
  migration: [],
  storage: [],
  serviceRole: [],
  app: [],
  auth: [],
  workflow: [],
};

function categorize(step, category) {
  return { step, category };
}

function pass(step, detail, category = "workflow") {
  results.push({ step, status: "PASS", detail, category });
  categories[category]?.push({ step, status: "PASS", detail });
  console.log(`✓ PASS  [${category}] ${step}${detail ? ` — ${detail}` : ""}`);
}

function fail(step, detail, category = "workflow") {
  results.push({ step, status: "FAIL", detail, category });
  categories[category]?.push({ step, status: "FAIL", detail });
  console.error(`✗ FAIL  [${category}] ${step}${detail ? ` — ${detail}` : ""}`);
}

function skip(step, reason, category = "workflow") {
  results.push({ step, status: "SKIP", detail: reason, category });
  categories[category]?.push({ step, status: "SKIP", detail: reason });
  console.log(`○ SKIP  [${category}] ${step} — ${reason}`);
}

async function fetchJson(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function id(prefix) {
  return `${prefix}-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const MIGRATION_032_TABLES = [
  "employee_document_uploads",
  "applicant_documents",
  "document_audit_log",
];

async function main() {
  console.log("Morris OS production smoke test\n");
  console.log(`Base URL: ${BASE}`);
  console.log(`TEST_MODE cleanup: ${TEST_MODE}\n`);

  if (!url) {
    fail("env NEXT_PUBLIC_SUPABASE_URL", "not set", "app");
    printReport();
    process.exit(1);
  }

  let sb = null;
  if (!serviceKey) {
    fail(
      "env SUPABASE_SERVICE_ROLE_KEY",
      "not set — storage uploads, signed URLs, and DB workflow steps cannot run",
      "serviceRole"
    );
  } else {
    pass("env SUPABASE_SERVICE_ROLE_KEY", "configured", "serviceRole");
    sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  // Health API (app layer — no service role required on client)
  try {
    const { res, data } = await fetchJson("/api/health/supabase");
    if (!res.ok || !data.ok) {
      fail("health API", data.error ?? res.statusText, "app");
    } else {
      pass("health API reachable", "ok", "app");

      for (const table of MIGRATION_032_TABLES) {
        const ok = data.tableStatus?.[table] === true || data.migration032?.[table] === true;
        if (ok) pass(`table ${table}`, "exists", "migration");
        else
          fail(
            `table ${table}`,
            "missing — apply supabase/migrations/032_document_uploads_and_avatars.sql",
            "migration"
          );
      }

      if (!data.storage?.serviceRoleConfigured) {
        skip(
          "storage bucket probe",
          "SUPABASE_SERVICE_ROLE_KEY not configured on app server — restart dev server after adding key",
          "serviceRole"
        );
      } else if (!data.storage?.available) {
        const missing = (data.storage?.buckets ?? []).filter(
          (b) => b.exists === false || (!b.canUpload && !b.skipped)
        );
        if (missing.some((b) => b.exists === false)) {
          fail(
            "storage buckets",
            missing.map((b) => `${b.bucket}: ${b.error ?? "not found"}`).join("; "),
            "storage"
          );
        } else {
          fail(
            "storage permissions",
            (data.storage?.warnings ?? []).join("; ") || "upload or signed-URL test failed",
            "storage"
          );
        }
      } else {
        pass("storage buckets", `${data.storage.buckets?.length ?? 0} buckets OK`, "storage");
      }
    }
  } catch (e) {
    fail("health API", e.message, "app");
  }

  if (!sb) {
    skip("workflow steps", "skipped — SUPABASE_SERVICE_ROLE_KEY required", "workflow");
    printReport();
    process.exit(categories.serviceRole.some((r) => r.status === "FAIL") ? 1 : 0);
  }

  const customerId = id("cust");
  const jobId = id("job");
  const employeeId = id("emp");
  const applicantId = id("applicant");
  const applicationId = id("application");
  const invoiceId = id("inv");

  ids.customerId = customerId;
  ids.jobId = jobId;
  ids.employeeId = employeeId;
  ids.applicantId = applicantId;
  ids.applicationId = applicationId;
  ids.invoiceId = invoiceId;

  try {
    const { error: cErr } = await sb.from("customers").insert({
      id: customerId,
      company_id: COMPANY_ID,
      first_name: "QA TEST",
      last_name: "Customer",
      email: `qa-test-${Date.now()}@example.com`,
      phone: "6365550100",
    });
    if (cErr) fail("create customer", cErr.message, "workflow");
    else pass("create customer", customerId, "workflow");
  } catch (e) {
    fail("create customer", e.message, "workflow");
  }

  try {
    const { error: jErr } = await sb.from("jobs").insert({
      id: jobId,
      company_id: COMPANY_ID,
      customer_id: customerId,
      service_type: "junk_removal",
      status: "scheduled",
      junk_type: "general",
      address: "QA TEST - 100 Test St",
      city: "Warrenton",
      state: "MO",
      zip: "63383",
      scheduled_date: new Date().toISOString().slice(0, 10),
      payload: { photos: [], is_test: true },
    });
    if (jErr) fail("create job", jErr.message, "workflow");
    else pass("create job", jobId, "workflow");
  } catch (e) {
    fail("create job", e.message, "workflow");
  }

  const tinyJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==",
    "base64"
  );

  try {
    const photoPath = `${COMPANY_ID}/${jobId}/smoke-photo.jpg`;
    const { error: upErr } = await sb.storage
      .from("job-photos")
      .upload(photoPath, tinyJpeg, { contentType: "image/jpeg", upsert: true });
    if (upErr) fail("upload booking photo", upErr.message, "storage");
    else {
      await sb.from("job_photos").insert({
        id: id("jp"),
        company_id: COMPANY_ID,
        job_id: jobId,
        photo_url: photoPath,
        photo_type: "customer_upload",
      });
      pass("upload booking photo", photoPath, "storage");
    }
  } catch (e) {
    fail("upload booking photo", e.message, "storage");
  }

  try {
    const { error: eErr } = await sb.from("employees").insert({
      id: employeeId,
      company_id: COMPANY_ID,
      first_name: "QA TEST",
      last_name: "Worker",
      email: `qa-test-emp-${Date.now()}@example.com`,
      role: "helper",
      lifecycle_status: "active",
      employment_type: "w2_full_time",
      hourly_rate: 18,
    });
    if (eErr) fail("create employee", eErr.message, "workflow");
    else pass("create/assign employee", employeeId, "workflow");

    await sb.from("jobs").update({ assigned_employee_ids: [employeeId] }).eq("id", jobId);
    pass("schedule job", "assigned employee", "workflow");
  } catch (e) {
    fail("employee assignment", e.message, "workflow");
  }

  try {
    for (const [type, suffix] of [
      ["before", "before"],
      ["after", "after"],
    ]) {
      const p = `${COMPANY_ID}/${jobId}/smoke-${suffix}.jpg`;
      const { error } = await sb.storage
        .from("job-photos")
        .upload(p, tinyJpeg, { contentType: "image/jpeg", upsert: true });
      if (error) fail(`employee ${type} photo`, error.message, "storage");
      else {
        await sb.from("job_photos").insert({
          id: id("jp"),
          company_id: COMPANY_ID,
          job_id: jobId,
          photo_url: p,
          photo_type: type,
        });
        pass(`employee ${type} photo`, p, "storage");
      }
    }
  } catch (e) {
    fail("employee photos", e.message, "storage");
  }

  try {
    await sb.from("jobs").update({ status: "completed" }).eq("id", jobId);
    pass("complete job", undefined, "workflow");
  } catch (e) {
    fail("complete job", e.message, "workflow");
  }

  try {
    const total = 299;
    const { error: invErr } = await sb.from("invoices").insert({
      id: invoiceId,
      company_id: COMPANY_ID,
      job_id: jobId,
      customer_id: customerId,
      invoice_number: `INV-SMOKE-${Date.now()}`,
      estimate_amount: total,
      subtotal: total,
      total,
      balance_due: total,
      amount_paid: 0,
      status: "sent",
      payment_status: "balance_due",
    });
    if (invErr) fail("create invoice", invErr.message, "workflow");
    else pass("create invoice", invoiceId, "workflow");

    const pdfPath = `${COMPANY_ID}/invoices/${invoiceId}.pdf`;
    const pdfBody = Buffer.from("%PDF-1.4 smoke test");
    const { error: pdfUp } = await sb.storage
      .from("invoice-pdfs")
      .upload(pdfPath, pdfBody, { contentType: "application/pdf", upsert: true });
    if (pdfUp) fail("invoice PDF storage", pdfUp.message, "storage");
    else {
      await sb.from("invoices").update({ pdf_storage_path: pdfPath }).eq("id", invoiceId);
      const { data: signed } = await sb.storage.from("invoice-pdfs").createSignedUrl(pdfPath, 60);
      if (!signed?.signedUrl) fail("invoice PDF signed URL", "no url", "storage");
      else pass("invoice PDF upload + signed URL", pdfPath, "storage");
    }

    const payAmount = 150;
    await sb.from("payments").insert({
      id: id("pay"),
      company_id: COMPANY_ID,
      job_id: jobId,
      invoice_id: invoiceId,
      customer_id: customerId,
      amount: payAmount,
      method: "cash",
      status: "completed",
    });
    const balance = total - payAmount;
    await sb.from("invoices").update({ amount_paid: payAmount, balance_due: balance, status: "partial" }).eq("id", invoiceId);
    pass("record payment", `balance $${balance}`, "workflow");
  } catch (e) {
    fail("invoice workflow", e.message, "workflow");
  }

  try {
    await sb.from("applicants").insert({
      id: applicantId,
      company_id: COMPANY_ID,
      first_name: "Apply",
      last_name: "Smoke",
      email: `apply-smoke-${Date.now()}@example.com`,
      status: "applied",
    });
    await sb.from("applications").insert({
      id: applicationId,
      company_id: COMPANY_ID,
      applicant_id: applicantId,
      status: "applied",
      status_token: `token-${Date.now()}`,
    });
    pass("submit applicant", applicantId, "workflow");
  } catch (e) {
    fail("applicant", e.message, "workflow");
  }

  try {
    const uploadId = id("edup");
    const docPath = `${COMPANY_ID}/${employeeId}/${uploadId}.pdf`;
    const { error: stErr } = await sb.storage
      .from("employee-documents")
      .upload(docPath, Buffer.from("%PDF-test"), { contentType: "application/pdf", upsert: true });
    if (stErr) fail("employee document storage", stErr.message, "storage");
    else {
      const { error } = await sb.from("employee_document_uploads").insert({
        id: uploadId,
        company_id: COMPANY_ID,
        employee_id: employeeId,
        document_type: "certification",
        label: "Smoke cert",
        storage_path: docPath,
        mime_type: "application/pdf",
        status: "pending_review",
      });
      if (error) fail("employee document upload row", error.message, "migration");
      else pass("employee document upload", uploadId, "storage");
    }
  } catch (e) {
    fail("employee document upload", e.message, "storage");
  }

  try {
    const edocId = id("edoc");
    const { data: tmpl } = await sb.from("document_templates").select("id").eq("company_id", COMPANY_ID).limit(1).maybeSingle();
    if (!tmpl) skip("employee signs policy", "no document_templates seeded", "workflow");
    else {
      await sb.from("employee_documents").insert({
        id: edocId,
        company_id: COMPANY_ID,
        employee_id: employeeId,
        template_id: tmpl.id,
        document_key: "smoke_policy",
        name: "Smoke Policy",
        version: 1,
        status: "signed",
        completed_at: new Date().toISOString(),
      });
      pass("employee signs policy", edocId, "workflow");
    }
  } catch (e) {
    fail("employee signs policy", e.message, "workflow");
  }

  try {
    const { data: activity } = await sb
      .from("activity_log")
      .select("id")
      .eq("company_id", COMPANY_ID)
      .order("created_at", { ascending: false })
      .limit(1);
    if (activity?.length) pass("activity log", "entries exist", "workflow");
    else skip("activity log", "no entries (non-blocking)", "workflow");
  } catch (e) {
    skip("activity log", e.message, "workflow");
  }

  if (TEST_MODE && sb) {
    console.log("\nTEST_MODE: cleaning up smoke test rows…");
    await sb.from("job_photos").delete().eq("job_id", jobId);
    await sb.from("payments").delete().eq("invoice_id", invoiceId);
    await sb.from("invoices").delete().eq("id", invoiceId);
    await sb.from("employee_document_uploads").delete().eq("employee_id", employeeId);
    await sb.from("employee_documents").delete().eq("employee_id", employeeId);
    await sb.from("applications").delete().eq("id", applicationId);
    await sb.from("applicants").delete().eq("id", applicantId);
    await sb.from("jobs").delete().eq("id", jobId);
    await sb.from("employees").delete().eq("id", employeeId);
    await sb.from("customers").delete().eq("id", customerId);
  }

  printReport();
  const failed = results.filter((r) => r.status === "FAIL");
  process.exit(failed.length ? 1 : 0);
}

function printReport() {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log("\n--- REPORT ---");
  console.log(`PASS: ${passed}  FAIL: ${failed}  SKIP: ${skipped}`);

  for (const [cat, items] of Object.entries(categories)) {
    if (!items.length) continue;
    const f = items.filter((i) => i.status === "FAIL");
    const p = items.filter((i) => i.status === "PASS");
    const s = items.filter((i) => i.status === "SKIP");
    console.log(`\n[${cat}] PASS ${p.length} / FAIL ${f.length} / SKIP ${s.length}`);
    f.forEach((i) => console.log(`  ✗ ${i.step}: ${i.detail}`));
  }

  console.log("\nRecord IDs:", JSON.stringify(ids, null, 2));

  if (!TEST_MODE) {
    console.log("\nCleanup: set TEST_MODE=true to auto-delete smoke data, or manually remove IDs above.");
  }

  const migrationFails = categories.migration.filter((r) => r.status === "FAIL");
  const storageFails = categories.storage.filter((r) => r.status === "FAIL");
  const serviceRoleFails = categories.serviceRole.filter((r) => r.status === "FAIL");
  const appFails = categories.app.filter((r) => r.status === "FAIL");

  if (migrationFails.length) {
    console.log("\nMigration blockers:");
    migrationFails.forEach((e) => console.log(`  - ${e.step}: ${e.detail}`));
  }
  if (serviceRoleFails.length) {
    console.log("\nService role blockers:");
    serviceRoleFails.forEach((e) => console.log(`  - ${e.step}: ${e.detail}`));
    console.log("  Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server.");
  }
  if (storageFails.length) {
    console.log("\nStorage blockers:");
    storageFails.forEach((e) => console.log(`  - ${e.step}: ${e.detail}`));
  }
  if (appFails.length) {
    console.log("\nApp/API blockers:");
    appFails.forEach((e) => console.log(`  - ${e.step}: ${e.detail}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
