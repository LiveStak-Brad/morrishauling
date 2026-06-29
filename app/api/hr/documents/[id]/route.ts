import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeDocumentDetail } from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  try {
    const { id } = await params;
    const employeeId =
      profile.role === "employee" ? profile.employee_id : undefined;
    if (profile.role === "employee" && !employeeId) {
      return apiError("Employee record required", 403);
    }

    const doc = await getEmployeeDocumentDetail(
      morrisConfig.companyId,
      id,
      employeeId ?? undefined
    );
    if (!doc) return apiError("Document not found", 404);

    if (profile.role === "employee" && doc.employeeId !== profile.employee_id) {
      return apiError("Forbidden", 403);
    }

    return apiOk({ document: doc });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load document", 500);
  }
}
