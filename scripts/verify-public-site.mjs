#!/usr/bin/env node
/**
 * Static checks for Morris Services public website (operational copy).
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

const PUBLIC_COPY_FILES = [
  "components/public/MorrisServicesHomePage.tsx",
  "components/public/JunkRemovalHomePage.tsx",
  "components/public/HaulingComingSoonPage.tsx",
  "app/book/page.tsx",
  "app/pricing/page.tsx",
  "app/services/page.tsx",
  "app/contact/page.tsx",
  "components/public/PublicHeader.tsx",
  "components/public/PublicFooter.tsx",
];

const BANNED_CLAIMS = [
  { pattern: /Rated 4\.9/i, label: "4.9★ rating" },
  { pattern: /4\.9★/i, label: "4.9★ rating" },
  { pattern: /Licensed\s*&\s*insured/i, label: "licensed & insured" },
  { pattern: /on-time guarantee/i, label: "on-time guarantee" },
  { pattern: /coming soon/i, label: "coming soon" },
  { pattern: /Launching soon/i, label: "launching soon" },
  { pattern: /Online booking preview/i, label: "booking preview" },
  { pattern: /Reserve interest/i, label: "reserve interest" },
  { pattern: /preview=1/i, label: "preview mode link" },
  { pattern: /Founding season/i, label: "founding season" },
  { pattern: /early access/i, label: "early access" },
  { pattern: /not live yet/i, label: "not live yet" },
];

const checks = [];

checks.push(
  assert(
    "Parent brand config exists",
    fs.existsSync(path.join(root, "lib/morris-services-config.ts"))
  )
);

checks.push(
  assert(
    "Operational home — Junk Removal booking CTA",
    read("components/public/JunkRemovalHomePage.tsx").includes("Book junk removal") &&
      read("components/public/JunkRemovalHomePage.tsx").includes('status="open"') &&
      !read("components/public/JunkRemovalHomePage.tsx").includes("Launching soon")
  )
);

checks.push(
  assert(
    "Operational home — Hauling booking CTA",
    read("components/public/HaulingComingSoonPage.tsx").includes("Book hauling") &&
      !read("components/public/HaulingComingSoonPage.tsx").includes("Coming soon.")
  )
);

checks.push(
  assert(
    "Morris Services home operational",
    read("components/public/MorrisServicesHomePage.tsx").includes("Book service") &&
      read("components/public/MorrisServicesHomePage.tsx").includes("Operating now")
  )
);

for (const rel of PUBLIC_COPY_FILES) {
  const content = read(rel);
  for (const banned of BANNED_CLAIMS) {
    // Allow "coming soon" only on future craft chips in parent home (futureCompanies)
    if (rel === "components/public/MorrisServicesHomePage.tsx" && banned.label === "coming soon") {
      continue;
    }
    if (rel === "components/public/CompanyStatusBadge.tsx") continue;
    checks.push(
      assert(
        `No ${banned.label} in ${rel}`,
        !banned.pattern.test(content),
        banned.pattern.test(content) ? `found in ${rel}` : ""
      )
    );
  }
}

checks.push(
  assert(
    "Book page is live booking",
    read("app/book/page.tsx").includes("Book service") &&
      !read("app/book/page.tsx").includes("preview=1") &&
      !read("app/book/page.tsx").includes("Request an estimate")
  )
);

checks.push(
  assert(
    "Public site defaults to live",
    read("lib/public-site.ts").includes('return "live"') &&
      read("lib/public-site.ts").includes("isBookingSubmissionAllowed")
  )
);

checks.push(
  assert(
    "Stripe gated separately",
    read("lib/payments/online-payments-enabled.ts").includes("NEXT_PUBLIC_STRIPE_ENABLED")
  )
);

checks.push(
  assert(
    "Jobs create gated by division",
    read("app/api/jobs/create/route.ts").includes("isDivisionSubmissionAllowedAsync") &&
      read("app/api/jobs/create/route.ts").includes('mode: "booking"')
  )
);

checks.push(
  assert(
    "Manual payment methods documented",
    fs.existsSync(path.join(root, "lib/payments/manual-methods.ts")) &&
      read("lib/payments/manual-methods.ts").includes("bank_transfer")
  )
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? "PASS" : "FAIL", c.name, c.detail);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll public site checks passed.");
