/**
 * Seed Morris Hauling operations demo data.
 * Usage: node scripts/db-seed.mjs
 * Requires: migrations 001 + 002 applied
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
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or key");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const CID = "morris-hauling";
const now = new Date().toISOString();
const today = new Date().toISOString().split("T")[0];

async function upsert(table, rows) {
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table} (${rows.length})`);
}

function jobPayload(base) {
  return {
    ...base,
    companyId: CID,
    createdAt: now,
    updatedAt: now,
  };
}

function jobRow(id, customerId, status, junkType, address, city, zip, lat, lng, loadPct, price, payload, extra = {}) {
  return {
    id,
    company_id: CID,
    customer_id: customerId,
    status,
    junk_type: junkType,
    service_type: junkType,
    scheduled_date: extra.scheduledDate ?? today,
    address,
    city,
    state: "MO",
    zip,
    latitude: lat,
    longitude: lng,
    load_percentage: loadPct,
    estimated_price: price,
    payment_status: extra.paymentStatus ?? "estimate_pending",
    access_details: payload.accessDetails ?? {},
    item_list: payload.items ?? [],
    customer_notes: payload.customerNotes ?? null,
    payload: jobPayload({ ...payload, id, customerId, status, junkType }),
  };
}

async function main() {
  console.log("Seeding Morris operations data...\n");

  const companyConfig = {
    companyId: CID,
    companyName: "Morris Hauling & Junk Removal",
    logo: "/logo.png",
    heroBanner: "/banner.png",
    phone: "(636) 751-4645",
  };

  await upsert("companies", [{ id: CID, company_name: companyConfig.companyName, config: companyConfig }]);

  const profiles = [
    { id: "cust-m1", company_id: CID, email: "alex.customer@email.com", name: "Alex Johnson", role: "customer", phone: "(636) 555-8800", address: "142 Main St, St. Charles, MO 63301" },
    { id: "cust-m2", company_id: CID, email: "maria.garcia@email.com", name: "Maria Garcia", role: "customer", phone: "(636) 555-8801" },
    { id: "user-m-admin", company_id: CID, email: "admin@morrisjunk.com", name: "James Morris", role: "admin", employee_id: "emp-m1" },
    { id: "user-m-planner", company_id: CID, email: "dispatch@morrisjunk.com", name: "Dana Chen", role: "planner", employee_id: "emp-m4" },
    { id: "user-m-emp", company_id: CID, email: "marcus@morrisjunk.com", name: "Marcus Webb", role: "employee", employee_id: "emp-m2" },
  ];
  await upsert("profiles", profiles);

  await upsert("customers", [
    { id: "cust-m1", company_id: CID, profile_id: "cust-m1", first_name: "Alex", last_name: "Johnson", phone: "(636) 555-8800", email: "alex.customer@email.com", address: "142 Main St", city: "St. Charles", state: "MO", zip: "63301", preferred_contact_method: "text", lifetime_value: 611, total_jobs: 4, notes: "Repeat customer", callback_due_at: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), callback_notes: "Confirm appliance disposal pricing", callback_status: "due" },
    { id: "cust-m2", company_id: CID, profile_id: "cust-m2", first_name: "Maria", last_name: "Garcia", phone: "(636) 555-8801", email: "maria.garcia@email.com", address: "55 Lakeview Dr", city: "O'Fallon", state: "MO", zip: "63368", preferred_contact_method: "phone", lifetime_value: 0, total_jobs: 1, callback_status: "none" },
    { id: "cust-m3", company_id: CID, first_name: "Robert", last_name: "Chen", phone: "(636) 555-8802", email: "robert.chen@email.com", address: "12 Farm Rd", city: "Warrenton", state: "MO", zip: "63383", preferred_contact_method: "email", lifetime_value: 249, total_jobs: 1, callback_status: "none" },
  ]);

  await upsert("employees", [
    { id: "emp-m1", company_id: CID, profile_id: "user-m-admin", first_name: "James", last_name: "Morris", phone: "(636) 751-4645", email: "admin@morrisjunk.com", role: "admin", status: "active", pay_type: "salary", driver_license_on_file: true },
    { id: "emp-m2", company_id: CID, profile_id: "user-m-emp", first_name: "Marcus", last_name: "Webb", phone: "(636) 751-4646", email: "marcus@morrisjunk.com", role: "driver", status: "active", pay_type: "hourly", hourly_rate: 22, driver_license_on_file: true },
    { id: "emp-m3", company_id: CID, first_name: "Tyler", last_name: "Brooks", phone: "(636) 751-4647", email: "tyler@morrisjunk.com", role: "helper", status: "active", pay_type: "hourly", hourly_rate: 18, driver_license_on_file: false },
    { id: "emp-m4", company_id: CID, profile_id: "user-m-planner", first_name: "Dana", last_name: "Chen", phone: "(636) 751-4648", email: "dispatch@morrisjunk.com", role: "planner", status: "active", pay_type: "salary", driver_license_on_file: false },
  ]);

  await upsert("trucks", [
    {
      id: "truck-m1",
      company_id: CID,
      name: "Truck 1",
      make: "RAM",
      model: "3500",
      year: 2022,
      license_plate: "MO-JNK01",
      status: "active",
      mileage: 84200,
      odometer_miles: 84200,
      last_service_at: new Date(Date.now() - 120 * 86400000).toISOString().split("T")[0],
      next_service_due_at: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      next_service_due_miles: 85000,
      maintenance_status: "overdue",
      maintenance_notes: "Oil change and brake inspection overdue",
      notes: "Primary haul truck",
    },
    {
      id: "truck-m2",
      company_id: CID,
      name: "Truck 2",
      make: "Ford",
      model: "F-550",
      year: 2021,
      license_plate: "MO-JNK02",
      status: "active",
      mileage: 61500,
      odometer_miles: 61500,
      last_service_at: new Date(Date.now() - 45 * 86400000).toISOString().split("T")[0],
      next_service_due_at: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      next_service_due_miles: 70000,
      maintenance_status: "due_soon",
      maintenance_notes: "Scheduled service in 2 weeks",
    },
  ]);

  await upsert("trailers", [
    { id: "trailer-m1", company_id: CID, name: "Trailer Alpha", trailer_type: "dump", capacity_cubic_yards: 20, max_weight_lbs: 10000, license_plate: "MO-TRL01", status: "active" },
  ]);

  await upsert("dump_sites", [
    {
      id: "dump-m1",
      company_id: CID,
      name: "St. Charles Transfer Station",
      address: "1200 Transfer Rd",
      city: "St. Charles",
      state: "MO",
      zip: "63301",
      latitude: 38.79,
      longitude: -90.52,
      accepted_materials: ["general", "construction"],
      fee_type: "flat",
      base_fee: 45,
      status: "active",
      hours_json: { mon: "7:00 AM – 5:00 PM", tue: "7:00 AM – 5:00 PM", wed: "7:00 AM – 5:00 PM", thu: "7:00 AM – 5:00 PM", fri: "7:00 AM – 5:00 PM", sat: "8:00 AM – 12:00 PM", sun: "Closed" },
      is_closed: false,
    },
    {
      id: "dump-m2",
      company_id: CID,
      name: "Warren County Disposal",
      address: "800 Industrial Dr",
      city: "Warrenton",
      state: "MO",
      zip: "63383",
      latitude: 38.81,
      longitude: -91.14,
      accepted_materials: ["general"],
      fee_type: "weight",
      base_fee: 35,
      per_ton_fee: 42,
      status: "active",
      hours_json: { mon: "7:00 AM – 5:00 PM", tue: "7:00 AM – 5:00 PM", wed: "7:00 AM – 5:00 PM", thu: "7:00 AM – 5:00 PM", fri: "7:00 AM – 5:00 PM", sat: "8:00 AM – 12:00 PM", sun: "Closed" },
      is_closed: true,
      closure_reason: "Paving work — reopening Monday",
      closure_starts_at: new Date(Date.now() - 86400000).toISOString(),
      closure_ends_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    {
      id: "dump-m3",
      company_id: CID,
      name: "Lincoln County Recycling",
      address: "450 County Rd",
      city: "Troy",
      state: "MO",
      zip: "63379",
      latitude: 38.98,
      longitude: -90.98,
      accepted_materials: ["recyclables", "metal"],
      fee_type: "mixed",
      base_fee: 30,
      status: "active",
      hours_json: { mon: "7:00 AM – 5:00 PM", tue: "7:00 AM – 5:00 PM", wed: "7:00 AM – 5:00 PM", thu: "7:00 AM – 5:00 PM", fri: "7:00 AM – 5:00 PM", sat: "8:00 AM – 12:00 PM", sun: "Closed" },
      is_closed: false,
    },
  ]);

  await upsert("service_areas", [
    { id: "sa-warren", company_id: CID, name: "Warren County", county: "Warren", state: "MO", zip_codes: ["63383", "63390"], base_trip_fee: 25, is_active: true },
    { id: "sa-lincoln", company_id: CID, name: "Lincoln County", county: "Lincoln", state: "MO", zip_codes: ["63379"], base_trip_fee: 30, is_active: true },
    { id: "sa-stcharles", company_id: CID, name: "St. Charles County", county: "St. Charles", state: "MO", zip_codes: ["63301", "63303", "63304", "63368", "63376"], base_trip_fee: 0, is_active: true },
    { id: "sa-surrounding", company_id: CID, name: "Surrounding areas", county: "Greater St. Louis", state: "MO", zip_codes: [], base_trip_fee: 45, is_active: true },
  ]);

  const jobs = [
    jobRow("job-m1", "cust-m1", "scheduled", "residential", "142 Main St", "St. Charles", "63301", 38.79, -90.48, 25, 249, {
      items: [{ id: "i1", name: "Old couch", quantity: 1 }],
      loadSizeTier: "quarter_25",
      accessDetails: { stairs: true, stairFlights: 2, elevator: false, longCarryFt: 30, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
      customerNotes: "Gate code 4521. Dog in backyard.",
      assignedEmployeeIds: ["emp-m2", "emp-m3"],
      assignedTruckId: "truck-m1",
      assignedTrailerId: "trailer-m1",
      routeOrder: 1,
      estimate: { id: "est-m1", jobId: "job-m1", subtotal: 199, modifiers: [{ id: "stairs", label: "Stairs", amount: 50 }], total: 249, trailerPercent: 25, disclaimerAccepted: true, createdAt: now },
      warnings: ["stairs_access"],
    }, { paymentStatus: "balance_due" }),
    jobRow("job-m2", "cust-m1", "scheduled", "estate", "88 Oakwood Dr", "Warrenton", "63383", 38.81, -91.13, 50, 614, {
      items: [{ id: "i2", name: "Furniture set", quantity: 1 }],
      loadSizeTier: "half_50",
      accessDetails: { stairs: false, elevator: true, longCarryFt: 80, basement: true, attic: false, tightAccess: true, heavyItems: true, specialDisposal: false },
      routeOrder: 2,
      estimate: { id: "est-m2", jobId: "job-m2", subtotal: 349, modifiers: [], total: 614, trailerPercent: 50, disclaimerAccepted: true, createdAt: now },
      warnings: ["heavy_load", "long_carry"],
    }, { paymentStatus: "financing_requested" }),
    jobRow("job-m3", "cust-m1", "scheduled", "construction", "210 Builder Way", "O'Fallon", "63368", 38.78, -90.7, 75, 499, {
      items: [{ id: "i3", name: "Drywall", quantity: 20 }],
      loadSizeTier: "three_quarter_75",
      routeOrder: 3,
      estimate: { id: "est-m3", jobId: "job-m3", subtotal: 499, modifiers: [], total: 499, trailerPercent: 75, disclaimerAccepted: true, createdAt: now },
      warnings: [],
    }),
    jobRow("job-m4", "cust-m1", "completed", "appliance", "55 Maple St", "Troy", "63379", 38.98, -90.97, 10, 349, {
      items: [{ id: "i4", name: "Refrigerator", quantity: 1 }],
      loadSizeTier: "min_10",
      paymentCollected: true,
      estimate: { id: "est-m4", jobId: "job-m4", subtotal: 99, modifiers: [], total: 349, trailerPercent: 10, disclaimerAccepted: true, createdAt: now },
    }, { paymentStatus: "paid_in_full" }),
    jobRow("job-m5", "cust-m2", "submitted", "residential", "55 Lakeview Dr", "O'Fallon", "63368", 38.78, -90.7, 50, 349, {
      items: [{ id: "i5", name: "Garage cleanout", quantity: 1 }],
      loadSizeTier: "half_50",
      customerNotes: "Need estimate before Saturday",
    }),
    jobRow("job-m6", "cust-m3", "estimated", "yard", "12 Farm Rd", "Warrenton", "63383", 38.81, -91.13, 25, 199, {
      items: [{ id: "i6", name: "Brush pile", quantity: 1 }],
      loadSizeTier: "quarter_25",
    }),
    jobRow("job-m7", "cust-m1", "in_progress", "commercial", "400 Commerce Blvd", "St. Charles", "63301", 38.79, -90.5, 100, 599, {
      items: [{ id: "i7", name: "Office furniture", quantity: 1 }],
      loadSizeTier: "full_100",
      assignedEmployeeIds: ["emp-m2"],
    }),
    jobRow("job-m8", "cust-m2", "scheduled", "appliance", "88 Pine Ct", "Wentzville", "63385", 38.81, -90.85, 10, 149, {
      items: [{ id: "i8", name: "Washer/dryer", quantity: 2 }],
      loadSizeTier: "min_10",
      scheduledDate: today,
    }),
  ];
  await upsert("jobs", jobs);

  await upsert("estimates", [
    { id: "est-m1", company_id: CID, job_id: "job-m1", customer_id: "cust-m1", estimate_number: "EST-2026-0101", status: "accepted", base_amount: 199, adjustments_total: 50, estimated_total: 249, load_percentage: 25, disclaimer_accepted: true, accepted_at: now },
    { id: "est-m2", company_id: CID, job_id: "job-m2", customer_id: "cust-m1", estimate_number: "EST-2026-0102", status: "accepted", base_amount: 349, adjustments_total: 265, estimated_total: 614, load_percentage: 50, disclaimer_accepted: true, accepted_at: now },
    { id: "est-m4", company_id: CID, job_id: "job-m4", customer_id: "cust-m1", estimate_number: "EST-2026-0104", status: "converted", base_amount: 99, adjustments_total: 250, estimated_total: 349, final_amount: 349, load_percentage: 10, disclaimer_accepted: true, accepted_at: now },
  ]);

  await upsert("invoices", [
    { id: "inv-m1", invoice_number: "MH-2026-0142", company_id: CID, job_id: "job-m4", customer_id: "cust-m1", estimate_id: "est-m4", estimate_amount: 349, adjustments: [], adjustments_total: 0, subtotal: 349, fees: 0, tax: 0, deposit_amount: 0, deposit_paid: 0, total: 349, amount_paid: 349, balance_due: 0, status: "paid", payment_status: "paid_in_full", due_date: today, paid_at: now, terms: "Paid upon completion" },
    { id: "inv-m2", invoice_number: "MH-2026-0143", company_id: CID, job_id: "job-m1", customer_id: "cust-m1", estimate_id: "est-m1", estimate_amount: 249, adjustments: [{ id: "adj-s", label: "Stairs", amount: 50 }], adjustments_total: 50, subtotal: 249, fees: 0, tax: 0, deposit_amount: 62, deposit_paid: 62, total: 249, amount_paid: 62, balance_due: 187, status: "partial", payment_status: "balance_due", due_date: today, terms: "25% deposit to schedule" },
    { id: "inv-m3", invoice_number: "MH-2026-0144", company_id: CID, job_id: "job-m2", customer_id: "cust-m1", estimate_id: "est-m2", estimate_amount: 614, adjustments: [], adjustments_total: 0, subtotal: 614, fees: 0, tax: 0, deposit_amount: 154, deposit_paid: 0, total: 614, amount_paid: 0, balance_due: 614, status: "sent", payment_status: "financing_requested", due_date: today },
  ]);

  await upsert("payments", [
    { id: "pay-m1", company_id: CID, customer_id: "cust-m1", job_id: "job-m4", invoice_id: "inv-m1", amount: 349, method: "card", timing: "full", status: "completed", receipt_number: "RCP-10042", transaction_id: "RCP-10042" },
    { id: "pay-m2", company_id: CID, customer_id: "cust-m1", job_id: "job-m1", invoice_id: "inv-m2", amount: 62, method: "card", timing: "deposit", status: "completed", receipt_number: "RCP-10043", transaction_id: "RCP-10043", collected_by_employee_id: "emp-m2" },
  ]);

  await upsert("financing_requests", [{
    id: "fin-m1", company_id: CID, job_id: "job-m2", invoice_id: "inv-m3", customer_id: "cust-m1", provider: "in_house", status: "pending",
    total_amount: 614, requested_amount: 614, down_payment: 150, number_of_payments: 6, payment_count: 6,
    payment_frequency: "weekly", preferred_first_payment_date: today, first_payment_date: today,
    employment_status: "employed", monthly_income: 5200,
    customer_notes: "Need 6 weekly payments after job completion.",
    internal_notes: "", admin_notes: "", terms_accepted: true, signature_placeholder: "Alex Johnson", risk_score: 72, payment_schedule: [],
  }]);

  const perPayment = 77.33;
  await upsert("financing_payments", Array.from({ length: 6 }, (_, i) => ({
    id: `fp-m1-${i + 1}`,
    company_id: CID,
    financing_request_id: "fin-m1",
    customer_id: "cust-m1",
    invoice_id: "inv-m3",
    payment_number: i + 1,
    amount_due: perPayment,
    due_date: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString().split("T")[0],
    amount_paid: 0,
    status: "pending",
  })));

  await upsert("routes", [{
    id: "route-today", company_id: CID, route_date: today, truck_id: "truck-m1", trailer_id: "trailer-m1",
    assigned_driver_id: "emp-m2", status: "planned",
    start_location: { label: "Morris Yard", lat: 38.785, lng: -90.505 },
    end_location: { label: "Morris Yard", lat: 38.785, lng: -90.505 },
    estimated_miles: 68, estimated_hours: 6, notes: "St. Charles → Warrenton → O'Fallon loop",
  }]);

  await upsert("route_stops", [
    { id: "rs-start", company_id: CID, route_id: "route-today", stop_type: "start", stop_order: 0, address: "Morris Yard, St. Charles MO", status: "completed", estimated_load_percentage_after_stop: 0 },
    { id: "rs-1", company_id: CID, route_id: "route-today", job_id: "job-m1", stop_type: "job", stop_order: 1, address: "142 Main St, St. Charles MO", status: "pending", estimated_load_percentage_after_stop: 25 },
    { id: "rs-2", company_id: CID, route_id: "route-today", job_id: "job-m2", stop_type: "job", stop_order: 2, address: "88 Oakwood Dr, Warrenton MO", status: "pending", estimated_load_percentage_after_stop: 75 },
    { id: "rs-3", company_id: CID, route_id: "route-today", job_id: "job-m3", stop_type: "job", stop_order: 3, address: "210 Builder Way, O'Fallon MO", status: "pending", estimated_load_percentage_after_stop: 100 },
    { id: "rs-dump", company_id: CID, route_id: "route-today", dump_site_id: "dump-m1", stop_type: "dump", stop_order: 4, address: "St. Charles Transfer Station", status: "pending", estimated_load_percentage_after_stop: 0 },
    { id: "rs-end", company_id: CID, route_id: "route-today", stop_type: "end", stop_order: 5, address: "Morris Yard", status: "pending" },
  ]);

  await upsert("job_assignments", [
    { id: "ja-m1", company_id: CID, job_id: "job-m1", employee_id: "emp-m2", role: "driver" },
    { id: "ja-m2", company_id: CID, job_id: "job-m1", employee_id: "emp-m3", role: "helper" },
    { id: "ja-m3", company_id: CID, job_id: "job-m2", employee_id: "emp-m2", role: "driver" },
  ]);

  await upsert("job_notes", [
    { id: "jn-1", company_id: CID, job_id: "job-m1", created_by_profile_id: "cust-m1", note_type: "customer", note: "Gate code 4521. Dog friendly.", is_internal: false },
    { id: "jn-2", company_id: CID, job_id: "job-m2", created_by_profile_id: "user-m-planner", note_type: "admin", note: "Financing request pending — hold scheduling until approved.", is_internal: true },
    { id: "jn-3", company_id: CID, job_id: "job-m1", created_by_profile_id: "user-m-emp", note_type: "employee", note: "Stairs confirmed — 2 flights.", is_internal: true },
  ]);

  await upsert("job_photos", [
    { id: "photo-1", company_id: CID, job_id: "job-m2", uploaded_by_profile_id: "cust-m1", photo_url: "/banner.png", photo_type: "customer_upload", notes: "Basement furniture pile" },
    { id: "photo-2", company_id: CID, job_id: "job-m4", photo_url: "https://placehold.co/600x400/9B1B30/white?text=After+Photo", photo_type: "after", notes: "Driveway cleared" },
    { id: "photo-3", company_id: CID, job_id: "job-m1", photo_url: "https://placehold.co/600x400/333/white?text=Before", photo_type: "before" },
  ]);

  await upsert("activity_log", [
    { id: "act-1", company_id: CID, actor_profile_id: "cust-m1", entity_type: "job", entity_id: "job-m1", action: "deposit_paid", message: "Deposit of $62 received for job-m1", metadata: { amount: 62 } },
    { id: "act-2", company_id: CID, actor_profile_id: "cust-m1", entity_type: "financing_request", entity_id: "fin-m1", action: "submitted", message: "Financing request submitted for estate cleanout", metadata: { amount: 614 } },
    { id: "act-3", company_id: CID, entity_type: "job", entity_id: "job-m4", action: "completed", message: "Job completed and paid in full", metadata: { total: 349 } },
    { id: "act-4", company_id: CID, actor_profile_id: "user-m-planner", entity_type: "route", entity_id: "route-today", action: "planned", message: "Today's route planned with 3 jobs", metadata: { stops: 6 } },
  ]);

  await upsert("notifications", [
    { id: "notif-1", company_id: CID, profile_id: "cust-m1", customer_id: "cust-m1", title: "Deposit received", message: "Your $62 deposit for St. Charles pickup was received.", notification_type: "payment", status: "read", read_at: now },
    { id: "notif-2", company_id: CID, profile_id: "cust-m1", customer_id: "cust-m1", title: "Financing under review", message: "Your payment plan request is being reviewed.", notification_type: "financing", status: "unread" },
  ]);

  await upsert("company_settings", [
    { id: "set-deposit", company_id: CID, setting_key: "payment.deposit", setting_value: { percent: 25, minAmount: 50 } },
    { id: "set-service", company_id: CID, setting_key: "service.area_label", setting_value: { label: "Warren, Lincoln & St. Charles Counties" } },
  ]);

  const clockInMorning = (h, m) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  await upsert("employee_timeclock", [
    { id: "tc-m1", company_id: CID, employee_id: "emp-m2", profile_id: "user-m-emp", clock_in_at: clockInMorning(7, 15), shift_date: today, shift_status: "clocked_in", created_at: now, updated_at: now },
    { id: "tc-m2", company_id: CID, employee_id: "emp-m3", clock_in_at: clockInMorning(7, 30), shift_date: today, shift_status: "clocked_in", created_at: now, updated_at: now },
    { id: "tc-m3", company_id: CID, employee_id: "emp-m1", clock_in_at: new Date(Date.now() - 86400000).toISOString(), clock_out_at: new Date(Date.now() - 82800000).toISOString(), shift_date: new Date(Date.now() - 86400000).toISOString().split("T")[0], shift_status: "clocked_out", created_at: now, updated_at: now },
  ]);

  await upsert("truck_maintenance_logs", [
    {
      id: "tml-m1",
      company_id: CID,
      truck_id: "truck-m1",
      service_type: "Oil change & inspection",
      service_date: new Date(Date.now() - 120 * 86400000).toISOString().split("T")[0],
      odometer_miles: 82000,
      cost: 285,
      vendor: "Warrenton Fleet Service",
      notes: "Full synthetic oil, tire rotation",
      next_due_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      next_due_miles: 85000,
      created_at: now,
      updated_at: now,
    },
  ]);

  await upsert("customer_interactions", [
    {
      id: "ci-m1",
      company_id: CID,
      customer_id: "cust-m1",
      profile_id: "user-m-planner",
      interaction_type: "call",
      direction: "outbound",
      subject: "Estimate follow-up",
      body: "Confirmed flexible window pricing for estate cleanout.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: now,
    },
  ]);

  console.log("\n✓ Morris operations seed complete.");
}

main().catch((e) => {
  console.error("\nSeed failed:", e.message);
  console.error("Ensure migrations 001 and 002 are applied in Supabase SQL Editor first.");
  process.exit(1);
});
