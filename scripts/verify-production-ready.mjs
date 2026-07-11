#!/usr/bin/env node
/**
 * Production readiness validation — fails clearly when launch config is incomplete.
 * Usage: node scripts/verify-production-ready.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const failures = [];
const warnings = [];
const ok = [];

function pass(msg) {
  ok.push(msg);
  console.log(`PASS  ${msg}`);
}
function fail(msg) {
  failures.push(msg);
  console.error(`FAIL  ${msg}`);
}
function warn(msg) {
  warnings.push(msg);
  console.warn(`WARN  ${msg}`);
}

function env(name) {
  return process.env[name]?.trim() || "";
}

// --- Static / env checks ---
if (env("DEMO_DATA") === "true") fail("DEMO_DATA must not be true in production");
else pass("DEMO_DATA not enabled");

if (env("NEXT_PUBLIC_USE_SUPABASE") !== "true" && env("NODE_ENV") === "production") {
  fail("NEXT_PUBLIC_USE_SUPABASE must be true in production");
} else pass("Supabase data mode expected");

const migrationsDir = join(root, "supabase", "migrations");
const requiredMigrations = [
  "038_divisions.sql",
  "039_verified_addresses.sql",
  "040_disposal_network_expansion.sql",
  "041_hauling_stops_verification.sql",
  "042_billing_workflow.sql",
  "043_customer_workflow.sql",
  "044_ops_day_one.sql",
  "045_stripe_email_tokens.sql",
];
for (const m of requiredMigrations) {
  if (existsSync(join(migrationsDir, m))) pass(`Migration present: ${m}`);
  else fail(`Missing migration file: ${m}`);
}

// Hardcoded public status scan
const publicFiles = [
  "components/public/JunkRemovalHomePage.tsx",
  "components/public/HaulingComingSoonPage.tsx",
  "components/public/MorrisServicesHomePage.tsx",
];
for (const f of publicFiles) {
  const path = join(root, f);
  if (!existsSync(path)) continue;
  const src = readFileSync(path, "utf8");
  if (src.includes('status="open"')) fail(`${f} still hardcodes status="open"`);
  else if (src.includes("useDivisionPublicStatus")) pass(`${f} uses division status hook`);
  else warn(`${f} — verify division status wiring`);
}

// Stripe stub safety
const createRoute = readFileSync(join(root, "app/api/payments/create/route.ts"), "utf8");
if (createRoute.includes("isOnlinePaymentMethod") && createRoute.includes("webhook")) {
  pass("payments/create blocks online methods (webhook-only)");
} else if (createRoute.includes("Use /api/payments/checkout")) {
  pass("payments/create redirects card pay to checkout");
} else {
  fail("payments/create may still complete card payments without webhook");
}

const stripeService = existsSync(join(root, "lib/payments/stripe-service.ts"));
const webhookRoute = existsSync(join(root, "app/api/payments/webhook/route.ts"));
if (stripeService && webhookRoute) pass("Stripe service + webhook route present");
else fail("Stripe service or webhook route missing");

const emailSend = existsSync(join(root, "lib/email/send.ts"));
if (emailSend) pass("Email send worker present");
else fail("Email send worker missing");

// Config status (credentials optional — report only)
const stripeMode = env("PAYMENTS_PROVIDER") || "manual";
const stripeEnabled = env("STRIPE_ENABLED") === "true" && env("NEXT_PUBLIC_STRIPE_ENABLED") === "true";
if (stripeMode === "stripe" && stripeEnabled && env("STRIPE_SECRET_KEY")) {
  pass("Stripe credentials configured");
  if (!env("STRIPE_WEBHOOK_SECRET")) warn("STRIPE_WEBHOOK_SECRET missing — webhooks will fail");
} else {
  warn("Stripe not fully configured (OK until activation) — set PAYMENTS_PROVIDER=stripe, STRIPE_ENABLED, keys, webhook secret");
}

if (env("NOTIFICATIONS_EMAIL_ENABLED") === "true" && (env("RESEND_API_KEY") || env("SMTP_HOST"))) {
  pass("Email provider credentials configured");
} else {
  warn("Email provider not configured (OK until activation)");
}

if (env("GOOGLE_MAPS_API_KEY") || env("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")) {
  pass("Google Maps key present (at least one)");
} else {
  warn("Google Maps keys not set (required for public booking address verify)");
}

// Live DB checks when credentials available
const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
if (url && key) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data: divisions, error } = await sb.from("divisions").select("id, launch_status");
    if (error) fail(`divisions query: ${error.message}`);
    else if (!divisions?.length) fail("No division records present — apply migration 038");
    else {
      pass(`Division records present (${divisions.length})`);
      for (const d of divisions) {
        pass(`  ${d.id}: ${d.launch_status}`);
      }
    }

    const { count: seedJobs } = await sb
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .like("id", "%-m%");
    if ((seedJobs ?? 0) > 0) warn(`Possible seed jobs still present (count≈${seedJobs}) — clean before launch`);
    else pass("No obvious seed job id pattern detected");

    // Check stripe_webhook_events table exists (045)
    const { error: whErr } = await sb.from("stripe_webhook_events").select("id").limit(1);
    if (whErr) warn(`stripe_webhook_events not queryable — apply migration 045 (${whErr.message})`);
    else pass("stripe_webhook_events table available");
  } catch (e) {
    fail(`Supabase live check failed: ${e instanceof Error ? e.message : e}`);
  }
} else {
  warn("Skipping live Supabase checks (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set)");
}

console.log("\n--- Summary ---");
console.log(`Passed: ${ok.length}  Warnings: ${warnings.length}  Failures: ${failures.length}`);
if (failures.length) {
  console.error("\nProduction validation FAILED.");
  process.exit(1);
}
console.log("\nProduction validation OK (warnings are activation/credential reminders).");
process.exit(0);
