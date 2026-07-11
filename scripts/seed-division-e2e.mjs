/**
 * Seed clearly labeled E2E test records for both divisions.
 * Labels all customer notes / junk_type with [TEST DATA].
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const projectRef = "wfdfyhrdqpozyavxxgob";
const password = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";
const CID = "morris-hauling";
const TAG = "[TEST DATA]";

const client = new pg.Client({
  host,
  port: 6543,
  user: `postgres.${projectRef}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

function jobRow(j) {
  return {
    id: j.id,
    company_id: CID,
    customer_id: j.customerId,
    status: j.status,
    junk_type: j.junkType,
    service_type: j.serviceType,
    division_id: j.divisionId,
    scheduled_date: j.scheduledDate ?? null,
    address: j.street,
    city: j.city,
    state: "MO",
    zip: j.zip,
    estimated_price: j.total,
    customer_notes: `${TAG} ${j.notes}`,
    payload: JSON.stringify({
      id: j.id,
      companyId: CID,
      customerId: j.customerId,
      divisionId: j.divisionId,
      serviceType: j.serviceType,
      status: j.status,
      junkType: j.junkType,
      photos: j.photos ?? [],
      estimate: {
        id: `est-${j.id}`,
        jobId: j.id,
        subtotal: j.total,
        modifiers: [],
        total: j.total,
        trailerPercent: j.loadPct ?? 50,
        disclaimerAccepted: true,
        createdAt: new Date().toISOString(),
      },
      assignedEmployeeIds: j.assignedEmployeeIds ?? [],
      assignedTruckId: j.truckId ?? null,
      assignedTrailerId: j.trailerId ?? null,
      completionOverrideReason: j.overrideReason ?? null,
      warnings: [],
      items: j.items ?? [],
      accessDetails: j.access ?? {
        stairs: false,
        elevator: false,
        longCarryFt: 0,
        basement: false,
        attic: false,
        tightAccess: false,
        heavyItems: false,
        specialDisposal: false,
      },
      address: {
        street: j.street,
        city: j.city,
        state: "MO",
        zip: j.zip,
      },
      customerNotes: `${TAG} ${j.notes}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  };
}

async function upsertJob(j) {
  const r = jobRow(j);
  await client.query(
    `insert into public.jobs (
      id, company_id, customer_id, status, junk_type, service_type, division_id,
      scheduled_date, address, city, state, zip, estimated_price, customer_notes, payload, updated_at
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb, now()
    )
    on conflict (id) do update set
      status = excluded.status,
      division_id = excluded.division_id,
      scheduled_date = excluded.scheduled_date,
      estimated_price = excluded.estimated_price,
      customer_notes = excluded.customer_notes,
      payload = excluded.payload,
      updated_at = now()`,
    [
      r.id,
      r.company_id,
      r.customer_id,
      r.status,
      r.junk_type,
      r.service_type,
      r.division_id,
      r.scheduled_date,
      r.address,
      r.city,
      r.state,
      r.zip,
      r.estimated_price,
      r.customer_notes,
      r.payload,
    ]
  );

  await client.query(
    `insert into public.estimates (
      id, company_id, job_id, customer_id, division_id, estimate_number, status,
      base_amount, adjustments_total, estimated_total, estimate_type, review_status, disclaimer_accepted
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,0,$8,$9,$10,true
    )
    on conflict (id) do update set
      status = excluded.status,
      division_id = excluded.division_id,
      estimated_total = excluded.estimated_total,
      review_status = excluded.review_status`,
    [
      `est-${j.id}`,
      CID,
      j.id,
      j.customerId,
      j.divisionId,
      `TEST-${j.id.slice(-6).toUpperCase()}`,
      j.estimateStatus ?? "sent",
      j.total,
      j.serviceType,
      j.reviewStatus ?? "auto_ready",
    ]
  );

  if (j.invoice) {
    await client.query(
      `insert into public.invoices (
        id, invoice_number, company_id, job_id, customer_id, division_id,
        estimate_amount, subtotal, total, balance_due, status, payment_status
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$7,$7,$8,$9,$10
      )
      on conflict (id) do update set
        status = excluded.status,
        payment_status = excluded.payment_status,
        balance_due = excluded.balance_due,
        division_id = excluded.division_id`,
      [
        `inv-${j.id}`,
        `TEST-INV-${j.id.slice(-4).toUpperCase()}`,
        CID,
        j.id,
        j.customerId,
        j.divisionId,
        j.total,
        j.invoice.balance,
        j.invoice.status,
        j.invoice.paymentStatus,
      ]
    );
  }

  await client.query(
    `insert into public.notification_events (
      id, company_id, division_id, job_id, customer_id, event_type, channel, title, body, status, sent_at
    ) values (
      $1,$2,$3,$4,$5,'request_received','in_app',$6,$7,'sent', now()
    )
    on conflict (id) do nothing`,
    [
      `ne-${j.id}`,
      CID,
      j.divisionId,
      j.id,
      j.customerId,
      `${TAG} Request recorded`,
      `${TAG} Seeded notification for ${j.id}`,
    ]
  );
}

async function main() {
  await client.connect();
  console.log("Seeding labeled E2E test records...");

  // Ensure test customer exists
  const custId = "cust-test-e2e-divisions";
  await client.query(
    `insert into public.customers (id, company_id, first_name, last_name, email, phone, address, city, state, zip, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     on conflict (id) do update set
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       notes = excluded.notes,
       updated_at = now()`,
    [
      custId,
      CID,
      "TEST",
      "E2E Customer",
      "test-e2e-divisions@example.com",
      "(636) 555-0199",
      "100 Test Lane",
      "Warrenton",
      "MO",
      "63383",
      `${TAG} Seeded customer for division E2E verification`,
    ]
  );

  const jobs = [
    {
      id: "job-test-junk-completed",
      customerId: custId,
      divisionId: "junk_removal",
      serviceType: "junk_removal",
      status: "completed",
      junkType: `${TAG} garage_cleanout`,
      street: "101 Completed Junk St",
      city: "Warrenton",
      zip: "63383",
      total: 349,
      loadPct: 50,
      notes: "Completed Junk Removal garage cleanout with stairs and disposal.",
      photos: [
        { id: "p1", url: "/logo.png", photoStage: "arrival" },
        { id: "p2", url: "/logo.png", photoStage: "before" },
        { id: "p3", url: "/logo.png", photoStage: "loaded_trailer" },
        { id: "p4", url: "/logo.png", photoStage: "after" },
      ],
      access: {
        stairs: true,
        stairFlights: 1,
        elevator: false,
        longCarryFt: 40,
        basement: false,
        attic: false,
        tightAccess: false,
        heavyItems: true,
        specialDisposal: false,
      },
      estimateStatus: "accepted",
      invoice: { status: "paid", paymentStatus: "paid", balance: 0 },
    },
    {
      id: "job-test-hauling-completed",
      customerId: custId,
      divisionId: "hauling",
      serviceType: "hauling_transport",
      status: "completed",
      junkType: `${TAG} equipment`,
      street: "200 Completed Haul Rd",
      city: "St Charles",
      zip: "63301",
      total: 425,
      notes: "Completed Hauling equipment transport with delivery proof.",
      photos: [
        { id: "p1", url: "/haulinglogo.png", photoStage: "pickup_condition" },
        { id: "p2", url: "/haulinglogo.png", photoStage: "securement" },
        { id: "p3", url: "/haulinglogo.png", photoStage: "loaded" },
        { id: "p4", url: "/haulinglogo.png", photoStage: "delivery" },
      ],
      estimateStatus: "accepted",
      invoice: { status: "paid", paymentStatus: "paid", balance: 0 },
    },
    {
      id: "job-test-junk-pending-estimate",
      customerId: custId,
      divisionId: "junk_removal",
      serviceType: "junk_removal",
      status: "submitted",
      junkType: `${TAG} estate_cleanout`,
      street: "301 Pending Junk Ave",
      city: "Troy",
      zip: "63379",
      total: 599,
      loadPct: 100,
      notes: "Pending Junk Removal estimate — estate cleanout, flexible window preferred.",
      estimateStatus: "draft",
      reviewStatus: "needs_review",
    },
    {
      id: "job-test-hauling-pending-estimate",
      customerId: custId,
      divisionId: "hauling",
      serviceType: "hauling_transport",
      status: "submitted",
      junkType: `${TAG} machinery`,
      street: "401 Pending Haul Blvd",
      city: "OFallon",
      zip: "63366",
      total: 780,
      notes: "Pending Hauling estimate — weight unknown, safety review required.",
      estimateStatus: "draft",
      reviewStatus: "needs_review",
    },
    {
      id: "job-test-junk-scheduled",
      customerId: custId,
      divisionId: "junk_removal",
      serviceType: "junk_removal",
      status: "scheduled",
      junkType: `${TAG} furniture`,
      street: "501 Scheduled Junk Ct",
      city: "Wentzville",
      zip: "63385",
      total: 199,
      loadPct: 25,
      scheduledDate: "2026-07-18",
      notes: "Scheduled Junk Removal furniture pickup — morning preference.",
      estimateStatus: "accepted",
    },
    {
      id: "job-test-hauling-scheduled",
      customerId: custId,
      divisionId: "hauling",
      serviceType: "hauling_transport",
      status: "scheduled",
      junkType: `${TAG} building_materials`,
      street: "601 Scheduled Haul Dr",
      city: "St Peters",
      zip: "63376",
      total: 310,
      scheduledDate: "2026-07-19",
      notes: "Scheduled Hauling materials delivery.",
      estimateStatus: "accepted",
    },
    {
      id: "job-test-junk-manager-review",
      customerId: custId,
      divisionId: "junk_removal",
      serviceType: "junk_removal",
      status: "needs_dump",
      junkType: `${TAG} construction`,
      street: "701 Review Junk Way",
      city: "Warrenton",
      zip: "63383",
      total: 899,
      loadPct: 150,
      notes: "Manager review — missing disposal proof; override may be required.",
      photos: [{ id: "p1", url: "/logo.png", photoStage: "before" }],
      estimateStatus: "accepted",
      reviewStatus: "needs_review",
    },
  ];

  for (const j of jobs) {
    await upsertJob(j);
    console.log(`  ✓ ${j.id} (${j.divisionId} / ${j.status})`);
  }

  // Ensure launch status
  await client.query(
    `update public.divisions set launch_status='accepting_estimate_requests', updated_at=now()
     where id in ('junk_removal','hauling')`
  );

  const { rows } = await client.query(
    `select id, division_id, status from public.jobs where id like 'job-test-%' order by id`
  );
  console.log("Seeded jobs:", rows.length);
  console.table(rows);
  await client.end();
  console.log("SEED_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
