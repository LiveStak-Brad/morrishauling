import { apiError, apiOk } from "@/lib/api/route-utils";
import { getCurrentProfile } from "@/lib/auth/server";
import { requireDevToolsApi } from "@/lib/env/dev-tools";
import { morrisConfig } from "@/lib/morris-config";
import { buildSeedCleanupSql } from "@/lib/data/seed-cleanup-sql";
import { buildOperationsDebugReport } from "@/lib/data/operations-debug-report";
import { filterFinancing, isFilteringActive } from "@/lib/data/real-record-filter";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import {
  fetchJobsUnfiltered,
  fetchInvoicesUnfiltered,
  fetchPaymentsUnfiltered,
  fetchCustomersUnfiltered,
  fetchFinancingUnfiltered,
  fetchActivityUnfiltered,
} from "@/lib/db/admin-unfiltered";
import { getOperationsDepthSnapshot, getOperationalTrailers } from "@/lib/db/operations-depth";
import { getHrEmployees } from "@/lib/db/hr/employees";

export const ADMIN_MODULE_LINKS: Record<string, string> = {
  jobs: "/admin/jobs",
  invoices: "/admin/invoices",
  payments: "/admin/payments",
  customers: "/admin/customers",
  employees: "/admin/hr/employees",
  financing: "/admin/financing",
  activity: "/admin",
  trucks: "/admin/fleet",
  trailers: "/admin/fleet",
};

function countRow(total: number, afterFilter: number) {
  return { total, hidden: total - afterFilter, visible: afterFilter };
}

export async function GET() {
  const blocked = requireDevToolsApi();
  if (blocked) return blocked;

  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "admin" && profile.role !== "planner")) {
      return apiError("Admin access required", 403);
    }

    const companyId = morrisConfig.companyId;
    const [jobs, invoices, payments, customers, financing, activity, depth, trailers, hrEmployees] =
      await Promise.all([
        fetchJobsUnfiltered(companyId),
        fetchInvoicesUnfiltered(companyId),
        fetchPaymentsUnfiltered(companyId),
        fetchCustomersUnfiltered(companyId),
        fetchFinancingUnfiltered(companyId),
        fetchActivityUnfiltered(companyId, 100),
        getOperationsDepthSnapshot(companyId),
        getOperationalTrailers(companyId).catch(() => []),
        getHrEmployees(companyId).catch(() => []),
      ]);

    const hrRows = hrEmployees.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
    }));

    const debug = buildOperationsDebugReport({
      jobs,
      invoices,
      payments,
      financing,
      customers,
      hrEmployees: hrRows,
      depth,
      trailers,
      activityLog: activity,
    });

    const financingVisible = filterFinancing(financing);
    const excludedCount =
      debug.summary.jobs.excluded +
      debug.summary.invoices.excluded +
      debug.summary.payments.excluded +
      debug.summary.customers.excluded +
      debug.summary.employees.excluded +
      (financing.length - financingVisible.length) +
      debug.summary.activity.excluded +
      debug.summary.trucks.excluded +
      debug.summary.trailers.excluded;

    return apiOk({
      filteringActive: isFilteringActive(),
      demoDataEnabled: isDemoDataEnabled(),
      excludedCount,
      hasHiddenRecords: excludedCount > 0,
      message:
        excludedCount > 0
          ? "Seed/demo/test records were detected and hidden from normal dashboards."
          : null,
      counts: {
        jobs: countRow(debug.summary.jobs.total, debug.summary.jobs.afterFilter),
        invoices: countRow(debug.summary.invoices.total, debug.summary.invoices.afterFilter),
        payments: countRow(debug.summary.payments.total, debug.summary.payments.afterFilter),
        customers: countRow(debug.summary.customers.total, debug.summary.customers.afterFilter),
        employees: countRow(debug.summary.employees.total, debug.summary.employees.afterFilter),
        financing: countRow(financing.length, financingVisible.length),
        activity: countRow(debug.summary.activity.total, debug.summary.activity.afterFilter),
        trucks: countRow(debug.summary.trucks.total, debug.summary.trucks.afterFilter),
        trailers: countRow(debug.summary.trailers.total, debug.summary.trailers.afterFilter),
      },
      moduleLinks: ADMIN_MODULE_LINKS,
      excludedSamples: debug.samples,
      cleanupRecommendations: [
        ...debug.origins.notes,
        debug.origins.seedDataInDatabase,
        "Run cleanup SQL in Supabase SQL editor after review — see below.",
      ],
      cleanupSql: buildSeedCleanupSql(companyId),
      debug,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to check test data", 500);
  }
}
