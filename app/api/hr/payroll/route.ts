import { morrisConfig } from "@/lib/morris-config";
import {
  getPayPeriods,
  getOrCreateCurrentPayPeriod,
  getPayrollEntries,
  aggregatePayrollForPeriod,
  lockPayPeriod,
  exportPayrollCsv,
} from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiPermission("hr.payroll.read");
  if (profile instanceof Response) return profile;
  try {
    const periods = await getPayPeriods(morrisConfig.companyId);
    const current = await getOrCreateCurrentPayPeriod(morrisConfig.companyId);
    const entries = await getPayrollEntries(morrisConfig.companyId, current.id);
    return apiOk({ periods, current, entries });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load payroll", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("hr.payroll.export");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{ action: string; payPeriodId: string; format?: string }>(request);
    if (body.action === "aggregate") {
      await aggregatePayrollForPeriod(morrisConfig.companyId, body.payPeriodId, profile.id);
      const entries = await getPayrollEntries(morrisConfig.companyId, body.payPeriodId);
      return apiOk({ entries });
    }
    if (body.action === "lock") {
      await lockPayPeriod(morrisConfig.companyId, body.payPeriodId, profile.id);
      return apiOk({ locked: true });
    }
    if (body.action === "export") {
      const result = await exportPayrollCsv(
        morrisConfig.companyId,
        body.payPeriodId,
        (body.format as "csv" | "quickbooks") ?? "csv",
        profile.id
      );
      return apiOk(result);
    }
    return apiError("Unknown action", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Payroll action failed", 500);
  }
}
