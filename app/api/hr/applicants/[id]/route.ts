import { morrisConfig } from "@/lib/morris-config";
import { getApplicationById, updateApplicationStatus, addInterviewNote } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { ApplicantStatus } from "@/types/hr/ats";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.applicants.read");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const detail = await getApplicationById(morrisConfig.companyId, id);
    if (!detail) return apiError("Application not found", 404);
    return apiOk(detail);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load application", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.applicants.write");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const body = await parseJson<{ status?: ApplicantStatus; notes?: string; interviewNote?: { noteType: string; content: string; interviewDate?: string } }>(request);
    if (body.status) {
      await updateApplicationStatus(morrisConfig.companyId, id, body.status, profile.id, body.notes);
    }
    if (body.interviewNote) {
      await addInterviewNote(morrisConfig.companyId, id, {
        noteType: body.interviewNote.noteType as "general",
        content: body.interviewNote.content,
        interviewDate: body.interviewNote.interviewDate,
      }, profile.id);
    }
    const detail = await getApplicationById(morrisConfig.companyId, id);
    if (!detail) return apiError("Application not found", 404);
    return apiOk({ ...detail });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update application", 500);
  }
}
