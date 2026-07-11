import { apiError, apiOk } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, getProfileDivisionScope, canAccessDivision } from "@/lib/auth/permissions";
import { getJobs, getPayments } from "@/lib/db";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import type { DivisionId } from "@/lib/divisions";
import { serviceTypeToDivision } from "@/lib/divisions";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && profile.role !== "planner") {
      return apiError("Forbidden", 403);
    }

    const url = new URL(request.url);
    const divisionFilter = url.searchParams.get("division") as DivisionId | "all" | null;
    const companyId = MORRIS_COMPANY_ID;
    const [jobs, payments] = await Promise.all([getJobs(companyId), getPayments(companyId)]);
    const scope = getProfileDivisionScope(profile);

    const filtered = jobs.filter((j) => {
      const d = j.divisionId ?? serviceTypeToDivision(j.serviceType);
      if (!canAccessDivision(profile, d)) return false;
      if (divisionFilter && divisionFilter !== "all" && d !== divisionFilter) return false;
      if (scope.scope === "limited" && !scope.divisions.includes(d)) return false;
      return true;
    });

    const jobDivision = new Map(
      filtered.map((j) => [j.id, j.divisionId ?? serviceTypeToDivision(j.serviceType)] as const)
    );

    const completedPayments = payments.filter((p) => p.status === "completed" && !p.reversedAt);

    const paymentRevenueFor = (divisionId?: DivisionId) =>
      completedPayments
        .filter((p) => {
          const d = jobDivision.get(p.jobId);
          if (!d) return false;
          return divisionId ? d === divisionId : true;
        })
        .reduce((s, p) => s + p.amount, 0);

    const byDivision = (id: DivisionId) =>
      filtered.filter((j) => (j.divisionId ?? serviceTypeToDivision(j.serviceType)) === id);

    const summarize = (list: typeof filtered, divisionId?: DivisionId) => {
      const open = list.filter((j) => !["completed", "cancelled", "canceled", "paid"].includes(j.status));
      const completed = list.filter((j) => ["completed", "paid", "invoiced"].includes(j.status));
      const revenue = paymentRevenueFor(divisionId);
      const paidCount = completedPayments.filter((p) => {
        const d = jobDivision.get(p.jobId);
        return divisionId ? d === divisionId : Boolean(d);
      }).length;
      const avgTicket = paidCount ? revenue / paidCount : 0;
      const unassigned = list.filter(
        (j) => j.status === "scheduled" && (!j.assignedEmployeeIds || j.assignedEmployeeIds.length === 0)
      );
      const missingProof = list.filter((j) => {
        const st = j.status as string;
        if (st !== "needs_dump" && st !== "disposal_required" && st !== "in_progress") {
          return false;
        }
        return (j.photos?.length ?? 0) < 2;
      });
      return {
        jobCount: list.length,
        openJobs: open.length,
        completedJobs: completed.length,
        revenue,
        averageTicket: Math.round(avgTicket * 100) / 100,
        unassigned: unassigned.length,
        missingProof: missingProof.length,
      };
    };

    const junk = byDivision("junk_removal");
    const hauling = byDivision("hauling");

    return apiOk({
      scope,
      combined: summarize(filtered),
      divisions: {
        junk_removal: { ...summarize(junk, "junk_removal"), name: "Morris Junk Removal" },
        hauling: { ...summarize(hauling, "hauling"), name: "Morris Hauling" },
      },
      recentJobs: filtered
        .slice()
        .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
        .slice(0, 25)
        .map((j) => ({
          id: j.id,
          divisionId: j.divisionId ?? serviceTypeToDivision(j.serviceType),
          status: j.status,
          address: `${j.address.city}, ${j.address.state}`,
          total: j.estimate?.total ?? null,
          updatedAt: j.updatedAt,
        })),
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load division report");
  }
}
