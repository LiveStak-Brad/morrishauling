import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { addPerformanceReview } from "@/lib/db/hr/compliance-performance";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { billingId } from "@/lib/billing/utils";

export async function GET(request: NextRequest) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  const companyId = request.nextUrl.searchParams.get("companyId") || MORRIS_COMPANY_ID;
  try {
    const sb = createAdminClient();
    if (!sb) return apiError("Database unavailable", 503);

    const { data: reviews } = await sb
      .from("performance_reviews")
      .select("*, employees(first_name, last_name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: disciplinary } = await sb
      .from("disciplinary_actions")
      .select("*")
      .eq("company_id", companyId)
      .order("action_date", { ascending: false })
      .limit(50);

    return apiOk({
      reviews: (reviews ?? []).map((r) => {
        const emp = r.employees as { first_name?: string; last_name?: string } | null;
        return {
          id: r.id,
          employeeId: r.employee_id,
          employeeName: emp
            ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim()
            : r.employee_id,
          reviewPeriodStart: r.review_period_start,
          reviewPeriodEnd: r.review_period_end,
          overallRating: r.overall_rating,
          strengths: r.strengths,
          improvements: r.improvements,
          goals: r.goals,
          status: r.status,
        };
      }),
      disciplinary: (disciplinary ?? []).map((d) => ({
        id: d.id,
        employeeId: d.employee_id,
        actionType: d.action_type,
        description: d.description,
        actionDate: d.action_date,
      })),
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load performance", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const body = await parseJson<{
      action: "create_review" | "create_disciplinary";
      companyId?: string;
      employeeId: string;
      reviewPeriodStart?: string;
      reviewPeriodEnd?: string;
      overallRating?: number;
      strengths?: string;
      improvements?: string;
      goals?: string;
      actionType?: string;
      description?: string;
      actionDate?: string;
    }>(request);

    const companyId = body.companyId || MORRIS_COMPANY_ID;

    if (body.action === "create_review") {
      if (!body.reviewPeriodStart || !body.reviewPeriodEnd) {
        return apiError("Review period required", 400);
      }
      const id = await addPerformanceReview(
        companyId,
        {
          employeeId: body.employeeId,
          reviewPeriodStart: body.reviewPeriodStart,
          reviewPeriodEnd: body.reviewPeriodEnd,
          overallRating: body.overallRating,
          strengths: body.strengths,
          improvements: body.improvements,
          goals: body.goals,
        },
        profile.id
      );
      return apiOk({ id });
    }

    if (body.action === "create_disciplinary") {
      const sb = createAdminClient();
      if (!sb) return apiError("Database unavailable", 503);
      const id = billingId("disc");
      const { error } = await sb.from("disciplinary_actions").insert({
        id,
        company_id: companyId,
        employee_id: body.employeeId,
        action_type: body.actionType || "coaching",
        description: body.description,
        action_date: body.actionDate || new Date().toISOString().slice(0, 10),
        issued_by_profile_id: profile.id,
      });
      if (error) throw error;
      return apiOk({ id });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Action failed", 500);
  }
}
