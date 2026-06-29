import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { withPgClient, createAuthUserViaPg } from "@/lib/db/pg-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeOnboarding, assignEmploymentDocuments } from "./employees";
import type { EmploymentType } from "@/types/hr/ats";
import { format } from "date-fns";

const TEST_EMAIL = "bradmorrismma@gmail.com";
const TEST_PASSWORD = "Test123!";
const TEST_NAME = "Brad Test Employee";
const TEST_EMPLOYEE_ID = "emp-brad-test";

async function createAuthUser(email: string, password: string, fullName: string) {
  const admin = createAdminClient();
  if (admin) {
    const { data: listed } = await admin.auth.admin.listUsers();
    const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      return { userId: existing.id, created: false };
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw new Error(error.message);
    return { userId: data.user.id, created: true };
  }

  return createAuthUserViaPg({ email, password, fullName });
}

export async function createBradTestEmployee(employmentType: EmploymentType = "w2_full_time") {
  const companyId = MORRIS_COMPANY_ID;
  const { userId, created } = await createAuthUser(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
  const employeeId = TEST_EMPLOYEE_ID;
  const [firstName, ...rest] = TEST_NAME.split(/\s+/);
  const lastName = rest.join(" ");

  const resolvedEmployeeId = await withPgClient(async (client) => {
    await client.query(
      `
      insert into public.profiles (id, company_id, email, name, full_name, role, status)
      values ($1, $2, $3, $4, $4, 'employee', 'active')
      on conflict (id) do update set
        email = excluded.email, name = excluded.name, full_name = excluded.full_name,
        role = 'employee', status = 'active'
      `,
      [userId, companyId, TEST_EMAIL, TEST_NAME]
    );

    const existingEmp = await client.query(
      `select id, profile_id from public.employees where id = $1 or email = any($2::text[]) limit 1`,
      [employeeId, [TEST_EMAIL, "brad.test@morrisjunk.com"]]
    );
    const empId = existingEmp.rowCount ? (existingEmp.rows[0].id as string) : employeeId;

    await client.query(
      `
      insert into public.employees (
        id, company_id, profile_id, employee_number, first_name, last_name, email,
        role, status, lifecycle_status, employment_type, hire_date, pay_type, hourly_rate, driver_license_on_file
      ) values ($1, $2, $3, $4, $5, $6, $7, 'helper', 'active', 'onboarding', $8, $9, 'hourly', 18.00, false)
      on conflict (id) do update set
        profile_id = excluded.profile_id,
        email = excluded.email,
        lifecycle_status = 'onboarding',
        employment_type = excluded.employment_type,
        updated_at = now()
      `,
      [empId, companyId, userId, "EMP-TEST-BRAD", firstName, lastName, TEST_EMAIL, employmentType, format(new Date(), "yyyy-MM-dd")]
    );

    // Re-link if employee was found by legacy test email with a different profile
    if (existingEmp.rowCount && existingEmp.rows[0].profile_id !== userId) {
      await client.query(`update public.employees set profile_id = $1, email = $2 where id = $3`, [
        userId,
        TEST_EMAIL,
        empId,
      ]);
    }
    return empId;
  });

  const admin = createAdminClient();
  let hasOnboarding = false;
  if (admin) {
    const { data: existingItems } = await admin
      .from("employee_onboarding_items")
      .select("id")
      .eq("employee_id", resolvedEmployeeId)
      .limit(1);
    hasOnboarding = (existingItems?.length ?? 0) > 0;
  } else {
    const existingItems = await withPgClient(async (client) => {
      const res = await client.query(
        `select id from public.employee_onboarding_items where employee_id = $1 limit 1`,
        [resolvedEmployeeId]
      );
      return res.rows;
    });
    hasOnboarding = existingItems.length > 0;
  }

  if (!hasOnboarding) {
    await initializeOnboarding(companyId, resolvedEmployeeId, employmentType);
    await assignEmploymentDocuments(companyId, resolvedEmployeeId, employmentType);
  }

  return {
    employeeId: resolvedEmployeeId,
    profileId: userId,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    loginUrl: "/login",
    employeePortalUrl: "/employee",
    created,
    employmentType,
  };
}

export { TEST_EMAIL, TEST_PASSWORD, TEST_NAME };
