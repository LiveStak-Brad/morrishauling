import { format, addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HrNavStats } from "@/types/hr/nav";

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getHrNavStats(companyId: string): Promise<HrNavStats> {
  const sb = await sbWrite();
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDays = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const [apps, onboarding, payPeriods, pendingDocs, credentials] = await Promise.all([
    sb.from("applications").select("id, status").eq("company_id", companyId),
    sb.from("employees").select("id").eq("company_id", companyId).eq("lifecycle_status", "onboarding"),
    sb.from("pay_periods").select("id").eq("company_id", companyId).eq("status", "open"),
    sb.from("employee_documents").select("id").eq("company_id", companyId).eq("status", "pending"),
    sb.from("employee_credentials").select("id").eq("company_id", companyId).eq("status", "active").lte("expires_at", thirtyDays),
  ]);

  const activeApplicants = (apps.data ?? []).filter(
    (a) => !["hired", "rejected", "offer_declined"].includes(a.status)
  ).length;

  return {
    activeApplicants,
    onboardingIncomplete: onboarding.data?.length ?? 0,
    payrollPending: (payPeriods.data?.length ?? 0) > 0 ? 1 : 0,
    expiringDocuments: (pendingDocs.data?.length ?? 0) + (credentials.data?.length ?? 0),
  };
}
