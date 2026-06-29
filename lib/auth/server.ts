import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Role } from "@/types";
import type { UserProfile } from "./types";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { normalizeStaffRole } from "./staff-allowlist";
import { isAdmin } from "./permissions";

function mapProfile(
  row: Record<string, unknown>,
  customerId?: string | null,
  employeeId?: string | null
): UserProfile {
  const fullName = (row.full_name as string) ?? (row.name as string) ?? "";
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    email: row.email as string,
    full_name: fullName,
    name: fullName,
    role: row.role as Role,
    phone: (row.phone as string) ?? null,
    status: (row.status as UserProfile["status"]) ?? "active",
    employee_id: employeeId ?? (row.employee_id as string) ?? null,
    address: (row.address as string) ?? null,
    customer_id: customerId ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  let customerId: string | null = null;
  let employeeId: string | null = null;

  if (profile.role === "customer") {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    customerId = customer?.id ?? null;
  } else {
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    employeeId = employee?.id ?? null;
  }

  const normalizedRole = normalizeStaffRole(profile.role as Role, profile.email as string);
  return mapProfile({ ...profile, role: normalizedRole }, customerId, employeeId);
}

export async function requireAuth(redirectTo = "/login"): Promise<UserProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(redirectTo);
  return profile;
}

export async function requireRole(
  allowed: Role[],
  redirectTo = "/unauthorized"
): Promise<UserProfile> {
  const profile = await requireAuth();
  if (!allowed.includes(profile.role) && !isAdmin(profile)) {
    redirect(redirectTo);
  }
  return profile;
}

/** Service-role profile lookup for registration / admin scripts */
export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  let customerId: string | null = null;
  let employeeId: string | null = null;

  if (profile.role === "customer") {
    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    customerId = customer?.id ?? null;
  } else {
    const { data: employee } = await admin
      .from("employees")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    employeeId = employee?.id ?? null;
  }

  const normalizedRole = normalizeStaffRole(profile.role as Role, profile.email as string);
  return mapProfile({ ...profile, role: normalizedRole }, customerId, employeeId);
}

export async function createCustomerProfile(params: {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
}) {
  const admin = createAdminClient();
  if (admin) {
    const customerId = `cust-${params.userId.slice(0, 8)}`;
    const [firstName, ...rest] = params.fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "Customer";

    const { error: profileError } = await admin.from("profiles").upsert({
      id: params.userId,
      company_id: MORRIS_COMPANY_ID,
      email: params.email,
      name: params.fullName,
      full_name: params.fullName,
      role: "customer",
      phone: params.phone ?? null,
      status: "active",
    });

    if (profileError) throw profileError;

    const { error: customerError } = await admin.from("customers").upsert({
      id: customerId,
      company_id: MORRIS_COMPANY_ID,
      profile_id: params.userId,
      first_name: firstName,
      last_name: lastName,
      email: params.email,
      phone: params.phone ?? null,
      preferred_contact_method: "email",
    });

    if (customerError) throw customerError;

    return { customerId, profileId: params.userId };
  }

  const { upsertCustomerProfileViaPg } = await import("@/lib/db/pg-admin");
  return upsertCustomerProfileViaPg({
    ...params,
    companyId: MORRIS_COMPANY_ID,
  });
}
