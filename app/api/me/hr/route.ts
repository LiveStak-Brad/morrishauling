import { morrisConfig } from "@/lib/morris-config";
import {
  getOnboardingProgress,
  getEmployeeDocuments,
  getEmployeeUploads,
  getEmployeeDocumentDetail,
  getPunchesForEmployee,
  getTimeOffRequests,
  getEmployeeShifts,
  getTrainingCompletions,
  getEquipmentAssignments,
} from "@/lib/db/hr";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { profile, employeeId } = ctx;
  try {
    const [onboarding, documents, uploads, punches, timeOff, shifts, training, equipment] =
      await Promise.all([
        getOnboardingProgress(morrisConfig.companyId, employeeId),
        getEmployeeDocuments(morrisConfig.companyId, employeeId),
        getEmployeeUploads(morrisConfig.companyId, employeeId),
        getPunchesForEmployee(morrisConfig.companyId, employeeId),
        getTimeOffRequests(morrisConfig.companyId, employeeId),
        getEmployeeShifts(morrisConfig.companyId, { employeeId }),
        getTrainingCompletions(morrisConfig.companyId, employeeId),
        getEquipmentAssignments(morrisConfig.companyId, employeeId),
      ]);
    const enrichedDocs = await Promise.all(
      documents.map(async (d) => {
        const detail = await getEmployeeDocumentDetail(morrisConfig.companyId, d.id, employeeId);
        return detail ?? d;
      })
    );

    return apiOk({
      onboarding,
      documents: enrichedDocs,
      uploads,
      punches,
      timeOff,
      shifts,
      training,
      equipment,
      profile,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load HR data", 500);
  }
}
