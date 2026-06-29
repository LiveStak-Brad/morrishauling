import { morrisConfig } from "@/lib/morris-config";
import { getPlannerDashboard } from "@/lib/db/operations";
import { getOperationsDepthSnapshot, getOperationalTrucks, getOperationalTrailers } from "@/lib/db/operations-depth";
import { getHrEmployees } from "@/lib/db/hr/employees";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Planner access required", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const [planner, depth, employees, trucks, trailers] = await Promise.all([
      getPlannerDashboard(morrisConfig.companyId),
      getOperationsDepthSnapshot(morrisConfig.companyId),
      getHrEmployees(morrisConfig.companyId),
      getOperationalTrucks(morrisConfig.companyId),
      getOperationalTrailers(morrisConfig.companyId),
    ]);

    const scheduledJobs = planner.jobs.filter(
      (j) => j.scheduledDate === date && j.status === "scheduled"
    );

    return apiOk({
      date,
      jobs: scheduledJobs,
      allJobs: planner.jobs,
      scheduleSlots: planner.scheduleSlots,
      dumpSites: depth.dumpSites,
      trucks,
      trailers,
      employees: employees.filter((e) => e.status === "active"),
      routes: planner.routes,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load planner data", 500);
  }
}
