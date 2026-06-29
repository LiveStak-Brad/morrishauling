import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeJob } from "@/lib/db/hr/employee-portal";
import { getInvoiceByJob } from "@/lib/db/operations";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;

  try {
    const { id } = await params;
    const job = await getEmployeeJob(
      morrisConfig.companyId,
      ctx.employeeId,
      id
    );
    if (!job) return apiError("Job not found or not assigned to you", 404);

    const invoice = await getInvoiceByJob(morrisConfig.companyId, id);
    return apiOk({ job, invoice });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load job", 500);
  }
}
