/**
 * Create a staff auth user (employee, planner, or admin) with profile + optional employee row.
 *
 * Usage:
 *   npm run auth:create-staff -- --email you@domain.com --password secret123 --name "Brad Morris" --role admin
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY when set; otherwise falls back to direct Postgres (SUPABASE_DB_PASSWORD).
 */
import { createClient } from "@supabase/supabase-js";
import { createAuthUserViaPg, loadEnvLocal, withPgClient } from "./pg-admin.mjs";

const CID = "morris-hauling";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

loadEnvLocal();

const OWNER_EMAILS = (
  process.env.STAFF_OWNER_EMAILS ??
  process.env.ADMIN_SETUP_EMAIL ??
  "wcba.mo@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const email = arg("email") ?? process.env.ADMIN_SETUP_EMAIL;
const password = arg("password") ?? process.env.ADMIN_SETUP_PASSWORD;
const fullName = arg("name") ?? process.env.ADMIN_SETUP_NAME ?? "Brad Morris";
const role = arg("role") ?? process.env.ADMIN_SETUP_ROLE ?? "admin";
const employeeId = arg("employee-id");
const phone = arg("phone");

const validRoles = ["employee", "planner", "admin", "hr", "office_admin"];
if (!email || !password) {
  console.error(
    "Set ADMIN_SETUP_EMAIL and ADMIN_SETUP_PASSWORD in .env.local, or pass --email and --password.\n" +
      'Usage: node scripts/create-staff-user.mjs [--name "Brad Morris"] [--role admin]'
  );
  process.exit(1);
}
if (!validRoles.includes(role)) {
  console.error("Invalid role. Use admin, planner, employee, hr, or office_admin.");
  process.exit(1);
}

const privilegedRoles = ["admin", "hr", "office_admin"];
if (privilegedRoles.includes(role) && !OWNER_EMAILS.includes(email.toLowerCase())) {
  console.error(
    `Only owner staff emails may receive ${privilegedRoles.join("/")} roles.\n` +
      `Allowed: ${OWNER_EMAILS.join(", ")}`
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let userId;
let created = true;

if (url && serviceKey) {
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error("Auth error:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Created auth user (service role):", userId);
} else {
  console.log("SUPABASE_SERVICE_ROLE_KEY not set — using direct Postgres...");
  const result = await withPgClient((client) =>
    createAuthUserViaPg(client, { email, password, fullName })
  );
  userId = result.userId;
  created = result.created;
  console.log(created ? "Created auth user (postgres):" : "Auth user synced (postgres):", userId);
}

await withPgClient(async (client) => {
  await client.query(
    `
    insert into public.profiles (id, company_id, email, name, full_name, role, phone, status)
    values ($1, $2, $3, $4, $4, $5, $6, 'active')
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      full_name = excluded.full_name,
      role = excluded.role,
      phone = excluded.phone,
      status = 'active'
    `,
    [userId, CID, email, fullName, role, phone ?? null]
  );
  console.log("Profile upserted with role:", role);

  if (role === "employee") {
    const eid = employeeId ?? `emp-${userId.slice(0, 8)}`;
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "Staff";
    await client.query(
      `
      insert into public.employees (
        id, company_id, profile_id, first_name, last_name, email, phone, role, status, driver_license_on_file
      ) values ($1, $2, $3, $4, $5, $6, $7, 'driver', 'active', false)
      on conflict (id) do update set profile_id = excluded.profile_id, email = excluded.email
      `,
      [eid, CID, userId, firstName, lastName, email, phone ?? null]
    );
    console.log("Employee record:", eid);
  }
});

console.log("\nDone. Sign in at /login with the credentials provided.");
