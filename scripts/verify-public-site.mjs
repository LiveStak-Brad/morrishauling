#!/usr/bin/env node
/**
 * Static checks for Morris Services public website (prelaunch-safe copy).
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
  "app/page.tsx",
  "components/public/HaulingHomePage.tsx",
  "app/book/page.tsx",
  "app/pricing/page.tsx",
  "components/careers/CareersHero.tsx",
  "lib/careers/constants.ts",
  "components/public/PublicHeader.tsx",
  "components/public/PublicFooter.tsx",
  "app/services/page.tsx",
];

const BANNED_CLAIMS = [
  { pattern: /Rated 4\.9/i, label: "4.9★ rating" },
  { pattern: /4\.9★/i, label: "4.9★ rating" },
  { pattern: /same-week/i, label: "same-week pickups" },
  { pattern: /same-day service/i, label: "same-day service claim" },
  { pattern: /Licensed\s*&\s*insured/i, label: "licensed & insured" },
  { pattern: /on-time guarantee/i, label: "on-time guarantee" },
  { pattern: /Live rates from admin/i, label: "live rates claim" },
  { pattern: /Book Now/i, label: "Book Now CTA" },
  { pattern: /instant estimate/i, label: "instant estimate" },
  { pattern: /Track pickup/i, label: "track pickup" },
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
    "Morris Services portal prelaunch copy",
    read("app/page.tsx").includes("morrisServicesConfig.publicBrandName") &&
      read("app/page.tsx").includes("Launching Soon") &&
      !read("app/page.tsx").includes("Rated 4.9")
  )
);

checks.push(
  assert(
    "Hauling homepage prelaunch copy",
    read("components/public/HaulingHomePage.tsx").includes("Launching soon") &&
      read("components/public/HaulingHomePage.tsx").includes("Online booking preview") &&
      !read("components/public/HaulingHomePage.tsx").includes("Rated 4.9")
  )
);

for (const rel of PUBLIC_COPY_FILES) {
  const content = read(rel);
  for (const banned of BANNED_CLAIMS) {
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
    "Company breadcrumb bar",
    fs.existsSync(path.join(root, "components/public/CompanyBreadcrumbBar.tsx"))
  )
);

checks.push(
  assert(
    "Book page pre-launch copy",
    read("app/book/page.tsx").includes("coming soon") &&
      read("app/book/page.tsx").includes("preview=1") &&
      read("app/book/page.tsx").includes("Early customer interest list") &&
      read("app/book/page.tsx").includes("BOOKING_PREVIEW_BANNER")
  )
);

checks.push(
  assert(
    "Pricing page prelaunch disclaimer",
    read("app/pricing/page.tsx").includes("Pre-launch pricing") &&
      read("app/pricing/page.tsx").includes("PRELAUNCH_PRICING_NOTE")
  )
);

checks.push(
  assert(
    "Booking wizard demo mode",
    read("components/public/BookingWizard.tsx").includes("demoMode")
  )
);

checks.push(
  assert(
    "Jobs create gated when booking closed",
    read("app/api/jobs/create/route.ts").includes("isBookingSubmissionAllowed")
  )
);

checks.push(
  assert(
    "PublicHeader umbrella variant",
    read("components/public/PublicHeader.tsx").includes('variant = "umbrella"')
  )
);

checks.push(
  assert(
    "PublicFooter mission statement",
    read("components/public/PublicFooter.tsx").includes("footerMission")
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
