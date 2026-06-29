#!/usr/bin/env node
/**
 * Prelaunch production deploy checks (static).
 * Usage: APP_STATUS=prelaunch node scripts/verify-prelaunch-deploy.mjs
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

checks.push(assert("APP_STATUS documented in .env.example", read(".env.example").includes("APP_STATUS=prelaunch")));

checks.push(
  assert(
    "Booking gated by APP_STATUS + flags",
    read("lib/public-site.ts").includes("isPrelaunch()") &&
      read("lib/public-site.ts").includes('getAppStatus() === "prelaunch"')
  )
);

checks.push(
  assert(
    "Jobs create API gated",
    read("app/api/jobs/create/route.ts").includes("isBookingSubmissionAllowed")
  )
);

checks.push(
  assert(
    "Online payments disabled",
    read("lib/payments/online-payments-enabled.ts").includes("return false")
  )
);

checks.push(
  assert(
    "Dev tools API 404 in prod",
    read("lib/env/dev-tools.ts").includes("areDevToolsEnabled()") &&
      read("app/api/hr/employees/create-test/route.ts").includes("requireDevToolsApi")
  )
);

checks.push(
  assert(
    "Data inspector gated",
    read("app/admin/settings/data-inspector/page.tsx").includes("areDevToolsEnabled")
  )
);

checks.push(
  assert(
    "Book page prelaunch copy",
    read("app/book/page.tsx").includes("coming soon")
  )
);

checks.push(
  assert(
    "Admin routes in middleware",
    read("middleware.ts").includes('"/admin"')
  )
);

checks.push(
  assert(
    "Send placeholder rejected",
    read("app/api/admin/invoices/route.ts").includes("sendPlaceholder")
  )
);

checks.push(
  assert(
    "/hauling redirects to hauling home",
    fs.existsSync(path.join(root, "app/hauling/page.tsx")) &&
      read("app/hauling/page.tsx").includes("/junk-removal")
  )
);

checks.push(
  assert(
    "Auth me route handles Supabase misconfiguration",
    read("app/api/auth/me/route.ts").includes("isSupabaseConfigured") &&
      read("app/api/auth/me/route.ts").includes("catch")
  )
);

checks.push(
  assert(
    "Public providers do not block render on auth loading",
    !read("components/auth/AuthProvider.tsx").includes('if (loading) {\n    return (\n      <div className="flex min-h-screen items-center justify-center') &&
      !read("lib/company-context.tsx").includes("if (!hydrated)")
  )
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? "PASS" : "FAIL", c.name, c.detail);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} prelaunch check(s) failed.`);
  process.exit(1);
}

console.log("\nAll prelaunch deploy static checks passed.");
console.log("\nManual Vercel env (set in dashboard for Production + Preview):");
console.log("  APP_STATUS=prelaunch");
console.log("  NEXT_PUBLIC_APP_STATUS=prelaunch");
console.log("  NEXT_PUBLIC_USE_SUPABASE=true");
console.log("  NEXT_PUBLIC_SUPABASE_URL");
console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY");
console.log("  SUPABASE_SERVICE_ROLE_KEY");
console.log("  STAFF_OWNER_EMAILS");
console.log("  DEMO_DATA — unset or false");
console.log("  ALLOW_PUBLIC_BOOKING — unset");
console.log("  NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING — unset");
console.log("\nAfter adding/changing env vars, redeploy (env changes require a new build).");
