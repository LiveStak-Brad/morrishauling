/**
 * Seed Morris demo data into Supabase from mock definitions.
 * Usage: node scripts/db-seed.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Inline Morris seed (mirrors lib/mock-data.ts + lib/mock-company.ts)
const MORRIS_ID = "morris-hauling";
const now = new Date().toISOString();
const today = new Date().toISOString().split("T")[0];

const morrisCompanyConfig = {
  companyId: MORRIS_ID,
  companyName: "Morris Hauling & Junk Removal",
  logo: "/logo.png",
  heroBanner: "/banner.png",
  phone: "(636) 751-4645",
  email: "info@morrisjunk.com",
  website: "https://morrisjunk.com",
};

const morrisCustomer = {
  id: "cust-m1",
  company_id: MORRIS_ID,
  email: "alex.customer@email.com",
  name: "Alex Johnson",
  role: "customer",
  phone: "(636) 555-8800",
  address: "142 Main St, St. Charles, MO 63301",
};

const morrisEmployees = [
  { id: "user-m-admin", company_id: MORRIS_ID, email: "admin@morrisjunk.com", name: "James Morris", role: "admin", employee_id: "emp-m1" },
  { id: "user-m-planner", company_id: MORRIS_ID, email: "dispatch@morrisjunk.com", name: "Dana Chen", role: "planner", employee_id: "emp-m4" },
  { id: "user-m-emp", company_id: MORRIS_ID, email: "marcus@morrisjunk.com", name: "Marcus Webb", role: "employee", employee_id: "emp-m2" },
];

const jobM1Payload = {
  id: "job-m1",
  companyId: MORRIS_ID,
  customerId: "cust-m1",
  status: "scheduled",
  junkType: "residential",
  items: [{ id: "item-1", name: "Old couch", quantity: 1 }],
  loadSizeTier: "quarter_25",
  accessDetails: { stairs: true, stairFlights: 2, elevator: false, longCarryFt: 30, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
  address: { street: "142 Main St", city: "St. Charles", state: "MO", zip: "63301", location: { lat: 38.79, lng: -90.48 } },
  photos: [],
  estimate: { id: "est-m1", jobId: "job-m1", subtotal: 199, modifiers: [{ id: "stairs", label: "Stairs", amount: 50 }], total: 249, trailerPercent: 25, disclaimerAccepted: true, createdAt: now },
  warnings: ["stairs_access"],
  scheduledDate: today,
  customerNotes: "Gate code 4521. Dog in backyard.",
  createdAt: now,
  updatedAt: now,
};

const jobM2Payload = {
  id: "job-m2",
  companyId: MORRIS_ID,
  customerId: "cust-m1",
  status: "scheduled",
  junkType: "estate",
  items: [],
  loadSizeTier: "half_50",
  accessDetails: { stairs: false, elevator: true, longCarryFt: 80, basement: true, attic: false, tightAccess: true, heavyItems: true, specialDisposal: false },
  address: { street: "88 Oakwood Dr", city: "Warrenton", state: "MO", zip: "63383" },
  photos: [],
  estimate: { id: "est-m2", jobId: "job-m2", subtotal: 349, modifiers: [], total: 614, trailerPercent: 50, disclaimerAccepted: true, createdAt: now },
  warnings: ["heavy_load"],
  scheduledDate: today,
  createdAt: now,
  updatedAt: now,
};

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table} (${rows.length} rows)`);
}

async function main() {
  console.log("Seeding Supabase...\n");

  await upsert("companies", [
    { id: MORRIS_ID, company_name: morrisCompanyConfig.companyName, config: morrisCompanyConfig },
  ]);

  await upsert("profiles", [morrisCustomer, ...morrisEmployees]);

  await upsert("jobs", [
    { id: "job-m1", company_id: MORRIS_ID, customer_id: "cust-m1", status: "scheduled", junk_type: "residential", scheduled_date: today, payload: jobM1Payload },
    { id: "job-m2", company_id: MORRIS_ID, customer_id: "cust-m1", status: "scheduled", junk_type: "estate", scheduled_date: today, payload: jobM2Payload },
  ]);

  await upsert("invoices", [
    {
      id: "inv-m2",
      invoice_number: "MH-2026-0143",
      company_id: MORRIS_ID,
      job_id: "job-m1",
      customer_id: "cust-m1",
      estimate_amount: 249,
      adjustments: [{ id: "adj-s", label: "Stairs", amount: 50 }],
      subtotal: 249,
      fees: 0,
      deposit_amount: 62,
      deposit_paid: 62,
      total: 249,
      amount_paid: 62,
      balance_due: 187,
      status: "partial",
      payment_status: "balance_due",
      due_date: today,
      terms: "25% deposit required to schedule.",
    },
    {
      id: "inv-m3",
      invoice_number: "MH-2026-0144",
      company_id: MORRIS_ID,
      job_id: "job-m2",
      customer_id: "cust-m1",
      estimate_amount: 614,
      adjustments: [],
      subtotal: 614,
      fees: 0,
      deposit_amount: 154,
      deposit_paid: 0,
      total: 614,
      amount_paid: 0,
      balance_due: 614,
      status: "sent",
      payment_status: "financing_requested",
      due_date: today,
    },
  ]);

  await upsert("payments", [
    {
      id: "pay-m2",
      company_id: MORRIS_ID,
      job_id: "job-m1",
      invoice_id: "inv-m2",
      amount: 62,
      method: "card",
      timing: "deposit",
      status: "completed",
      receipt_number: "RCP-10043",
    },
  ]);

  await upsert("financing_requests", [
    {
      id: "fin-m1",
      company_id: MORRIS_ID,
      job_id: "job-m2",
      invoice_id: "inv-m3",
      customer_id: "cust-m1",
      provider: "in_house",
      status: "pending",
      total_amount: 614,
      down_payment: 150,
      number_of_payments: 6,
      payment_frequency: "weekly",
      preferred_first_payment_date: today,
      employment_status: "employed",
      monthly_income: 5200,
      customer_notes: "Need to spread payments over 6 weeks.",
      terms_accepted: true,
      signature_placeholder: "Alex Johnson",
      risk_score: 72,
      payment_schedule: [],
    },
  ]);

  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
