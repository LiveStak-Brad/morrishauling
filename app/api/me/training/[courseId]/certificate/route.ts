import { morrisConfig } from "@/lib/morris-config";
import { getCertificate } from "@/lib/db/hr/training";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { courseId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  try {
    const cert = await getCertificate(morrisConfig.companyId, ctx.employeeId, courseId);
    if (!cert) return apiError("Certificate not available", 404);
    if (format === "html") {
      return new NextResponse(cert.html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return apiOk(cert);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load certificate", 500);
  }
}
