import { morrisConfig } from "@/lib/morris-config";
import { reportDamage } from "@/lib/db/hr/equipment";
import { reportEquipmentIssue } from "@/lib/db/hr/employee-portal";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const body = await parseJson<{
      assignmentId?: string;
      assetId?: string;
      checkoutEventId?: string;
      issueType?: "damaged" | "lost" | "needs_replacement";
      severity?: "minor" | "moderate" | "major" | "total_loss";
      notes?: string;
      photoPaths?: string[];
    }>(request);

    if (body.assetId) {
      const severity =
        body.severity ??
        (body.issueType === "lost" ? "total_loss" : body.issueType === "needs_replacement" ? "major" : "moderate");
      const reportId = await reportDamage(morrisConfig.companyId, ctx.employeeId, {
        assetId: body.assetId,
        checkoutEventId: body.checkoutEventId,
        severity,
        description: body.notes ?? body.issueType ?? "Damage reported",
        photoPaths: body.photoPaths,
      });
      return apiOk({ reportId });
    }

    if (!body.assignmentId || !body.issueType) {
      return apiError("assignmentId and issueType required (or assetId)", 400);
    }
    await reportEquipmentIssue(
      morrisConfig.companyId,
      ctx.employeeId,
      body.assignmentId,
      body.issueType,
      body.notes
    );
    return apiOk({ reported: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to report issue", 500);
  }
}
