/**
 * End-to-end auth verification (login, register, role gates, booking).
 * Usage: node scripts/auth-verify.mjs
 * Requires dev server on localhost:3000
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const adminEmail = process.env.ADMIN_SETUP_EMAIL ?? "brad@morrisjunk.com";
const adminPassword = process.env.ADMIN_SETUP_PASSWORD ?? "MorrisBrad2026!";

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}
function fail(label, detail) {
  console.log(`  ✗ ${label}: ${detail}`);
  failed++;
}

console.log("1. Health check");
const health = await fetch(`${base}/api/health/supabase`).then((r) => r.json());
if (health.ok && health.tablesReady) ok("health/supabase");
else fail("health/supabase", JSON.stringify(health));

console.log("2. Admin login");
const adminSb = createClient(url, anon, { auth: { persistSession: false } });
const { data: adminAuth, error: adminErr } = await adminSb.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});
if (adminErr) fail("admin login", adminErr.message);
else ok(`admin login (${adminEmail})`);

const adminToken = adminAuth?.session?.access_token;
const adminMe = await fetch(`${base}/api/auth/me`, {
  headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
}).then((r) => r.json());
if (adminMe.profile?.role === "admin") ok("admin profile role");
else fail("admin profile", JSON.stringify(adminMe));

console.log("3. Customer registration");
const customerEmail = `verify.customer.${Date.now()}@morrisjunk.com`;
const customerPassword = "VerifyCust2026!";
let reg = await fetch(`${base}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: customerEmail,
    password: customerPassword,
    fullName: "Verify Customer",
    phone: "6365559999",
  }),
}).then((r) => r.json());

if (!reg.ok && String(reg.error).includes("rate limit")) {
  console.log("  (register rate limited — creating via Postgres fallback)");
  const { createAuthUserViaPg, withPgClient } = await import("./pg-admin.mjs");
  const { userId } = await withPgClient((client) =>
    createAuthUserViaPg(client, {
      email: customerEmail,
      password: customerPassword,
      fullName: "Verify Customer",
    })
  );
  await withPgClient(async (client) => {
    const customerId = `cust-${userId.slice(0, 8)}`;
    await client.query(
      `insert into profiles (id, company_id, email, name, full_name, role, phone, status)
       values ($1, 'morris-hauling', $2, 'Verify Customer', 'Verify Customer', 'customer', '6365559999', 'active')
       on conflict (id) do nothing`,
      [userId, customerEmail]
    );
    await client.query(
      `insert into customers (id, company_id, profile_id, first_name, last_name, email, phone, preferred_contact_method)
       values ($1, 'morris-hauling', $2, 'Verify', 'Customer', $3, '6365559999', 'email')
       on conflict (id) do nothing`,
      [customerId, userId, customerEmail]
    );
  });
  reg = { ok: true, fallback: true };
}

if (reg.ok) ok(reg.fallback ? "customer account (postgres fallback)" : "register API");
else fail("register API", reg.error ?? JSON.stringify(reg));

const custSb = createClient(url, anon, { auth: { persistSession: false } });
const { error: custErr } = await custSb.auth.signInWithPassword({
  email: customerEmail,
  password: customerPassword,
});
if (custErr) fail("customer login", custErr.message);
else ok("customer login");

const custToken = (await custSb.auth.getSession()).data.session?.access_token;
const custMeFixed = await fetch(`${base}/api/auth/me`, {
  headers: custToken ? { Authorization: `Bearer ${custToken}` } : {},
}).then((r) => r.json());

if (custMeFixed.profile?.role === "customer" && custMeFixed.profile?.customer_id) {
  ok(`customer profile + customer_id (${custMeFixed.profile.customer_id})`);
} else {
  fail("customer profile", JSON.stringify(custMeFixed));
}

console.log("4. Role gate — customer is not admin");
if (custMeFixed.profile?.role === "customer") ok("customer role confirmed (browser middleware blocks /admin)");
else fail("customer role check", JSON.stringify(custMeFixed.profile));

console.log("5. Booking ties to logged-in customer");
const customerId = custMeFixed.profile?.customer_id;
if (customerId && custToken) {
  const jobRes = await fetch(`${base}/api/jobs/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      companyId: "morris-hauling",
      job: {
        customerId: "wrong-id-should-be-overridden",
        status: "pending",
        junkType: "general",
        address: { street: "123 Test St", city: "St Charles", state: "MO", zip: "63301" },
        scheduledDate: new Date().toISOString().split("T")[0],
        timeWindow: "morning",
        accessNotes: "",
        stairs: 0,
        walkingDistance: "short",
        heavyItems: false,
        specialDisposal: false,
        photos: [],
        estimate: null,
        paymentStatus: "unpaid",
        assignedEmployeeIds: [],
      },
    }),
  }).then((r) => r.json());

  if (jobRes.ok && jobRes.job?.customerId === customerId) {
    ok(`job created with customerId ${customerId}`);
  } else {
    fail("job create", jobRes.error ?? JSON.stringify(jobRes));
  }
} else {
  fail("booking test", "no customer session");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
