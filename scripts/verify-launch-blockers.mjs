#!/usr/bin/env node
/**
 * Static verification for launch blocker fixes (Batch 1).
 * Optional: BASE_URL=http://localhost:3000 node scripts/verify-launch-blockers.mjs
 *
 * Rate limiting uses in-memory storage — replace with Redis/Upstash at scale.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(name, ok, detail = "") {
  return { name, ok, detail };
}

const checks = [];

checks.push(
  assert(
    "SEC-001 data/store requires auth",
    read("app/api/data/store/route.ts").includes("requireApiProfile")
  )
);

checks.push(
  assert(
    "SEC-001 filterStoreByProfile null guard",
    read("lib/db/operations.ts").includes("if (!profile) return emptyScoped()")
  )
);

checks.push(
  assert(
    "SEC-002 public health minimal",
    read("app/api/health/supabase/route.ts").includes("getPublicSupabaseHealth") &&
      !read("app/api/health/supabase/route.ts").includes("tableStatus")
  )
);

checks.push(
  assert(
    "SEC-002 admin health detailed",
    read("app/api/admin/health/supabase/route.ts").includes("getDetailedSupabaseHealth")
  )
);

checks.push(
  assert(
    "SEC-004 punch uses timeclock auth",
    read("app/api/timeclock/punch/route.ts").includes("resolveTimeclockTarget")
  )
);

checks.push(
  assert(
    "SEC-006 invoice PDF uses canAccessInvoice",
    read("app/api/customer/invoices/[id]/pdf/route.ts").includes("canAccessInvoice")
  )
);

checks.push(
  assert(
    "SEC-007 rate limit module",
    fs.existsSync(path.join(root, "lib/api/rate-limit.ts"))
  )
);

for (const route of [
  "app/api/auth/register/route.ts",
  "app/api/careers/applications/route.ts",
  "app/api/careers/applications/documents/route.ts",
  "app/api/schedule/slots/route.ts",
  "app/api/health/supabase/route.ts",
  "app/api/data/store/route.ts",
]) {
  checks.push(
    assert(`SEC-007 rate limit on ${route}`, read(route).includes("enforceRateLimit"))
  );
}

checks.push(
  assert(
    "SEC-008 dev tools gate on create-test",
    read("app/api/hr/employees/create-test/route.ts").includes("requireDevToolsApi")
  )
);

checks.push(
  assert(
    "UX-002 dev tools gate on test-data-status",
    read("app/api/admin/test-data-status/route.ts").includes("requireDevToolsApi")
  )
);

checks.push(
  assert(
    "UX-010 forgot password form",
    read("app/forgot-password/page.tsx").includes("requestPasswordReset") &&
      !read("app/forgot-password/page.tsx").includes("coming soon")
  )
);

checks.push(
  assert(
    "SEC-005 online payments disabled flag",
    read("lib/payments/online-payments-enabled.ts").includes("return false")
  )
);

checks.push(
  assert(
    "SEC-005 block card in payments/create",
    read("app/api/payments/create/route.ts").includes("isOnlinePaymentMethod")
  )
);

checks.push(
  assert(
    "UX-016 reject sendPlaceholder in admin invoices",
    read("app/api/admin/invoices/route.ts").includes("sendPlaceholder") &&
      read("app/api/admin/invoices/route.ts").includes("Email sending is not connected")
  )
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? "PASS" : "FAIL", c.name, c.detail);
}

async function httpChecks() {
  const base = process.env.BASE_URL;
  if (!base) {
    console.log("\nSKIP HTTP checks (set BASE_URL to run against a running server)");
    return;
  }

  const storeRes = await fetch(`${base}/api/data/store?companyId=test`);
  console.log(storeRes.status === 401 ? "PASS" : "FAIL", "HTTP unauthenticated data/store → 401", storeRes.status);

  const healthRes = await fetch(`${base}/api/health/supabase`);
  const healthJson = await healthRes.json();
  const minimal = Object.keys(healthJson).length <= 2 && "ok" in healthJson;
  console.log(minimal ? "PASS" : "FAIL", "HTTP public health minimal shape", JSON.stringify(healthJson));
}

await httpChecks();

if (failed.length > 0) {
  console.error(`\n${failed.length} static check(s) failed.`);
  process.exit(1);
}

console.log("\nAll static launch blocker checks passed.");
