import { morrisConfig } from "@/lib/morris-config";
import { signEmployeeDocumentWithStorage } from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!profile.employee_id) return apiError("Employee access required", 403);

  try {
    const { id: documentId } = await params;
    const body = await parseJson<{ signerName: string; signatureDataUrl?: string }>(request);
    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const result = await signEmployeeDocumentWithStorage(morrisConfig.companyId, documentId, {
      signerName: body.signerName,
      signerProfileId: profile.id,
      employeeId: profile.employee_id,
      ipAddress,
      userAgent,
      signatureDataUrl: body.signatureDataUrl,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to sign document", 500);
  }
}
