import { format, addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  rowToEmployeeCredential,
  rowToEquipmentAssignment,
  rowToEquipmentCatalogItem,
  rowToTrainingCourse,
  rowToTrainingCompletion,
  rowToDisciplinaryAction,
  rowToHrNote,
  rowToEmployeeKpiSnapshot,
  rowToPerformanceReview,
  rowToSafetyIncident,
} from "@/lib/db/hr-mappers";
import type { HrDashboardStats } from "@/types/hr/dashboard";
import type { LeaderboardEntry } from "@/types/hr/performance";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getHrDashboardStats(companyId: string): Promise<HrDashboardStats> {
  const sb = await sbWrite();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(addDays(new Date(), -7), "yyyy-MM-dd");
  const thirtyDays = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const [
    applicants,
    employees,
    credentials,
    onboarding,
    timeclock,
    timeOff,
    training,
    incidents,
    equipment,
    discipline,
    payPeriods,
  ] = await Promise.all([
    sb.from("applications").select("status, submitted_at").eq("company_id", companyId),
    sb.from("employees").select("lifecycle_status, hire_date, date_of_birth").eq("company_id", companyId),
    sb.from("employee_credentials").select("expires_at").eq("company_id", companyId).eq("status", "active"),
    sb.from("employees").select("id").eq("company_id", companyId).eq("lifecycle_status", "onboarding"),
    sb.from("employee_timeclock").select("id").eq("company_id", companyId).eq("shift_date", today).is("clock_out_at", null),
    sb.from("time_off_requests").select("id").eq("company_id", companyId).eq("status", "approved").lte("start_date", today).gte("end_date", today),
    sb.from("training_completions").select("expires_at").eq("company_id", companyId).lte("expires_at", thirtyDays).gte("expires_at", today),
    sb.from("safety_incidents").select("id").eq("company_id", companyId).eq("claim_status", "open"),
    sb.from("equipment_assignments").select("id").eq("company_id", companyId).eq("status", "assigned"),
    sb.from("disciplinary_actions").select("id").eq("company_id", companyId).eq("status", "active"),
    sb.from("pay_periods").select("status, end_date").eq("company_id", companyId).eq("status", "open"),
  ]);

  const apps = applicants.data ?? [];
  const byStatus: Record<string, number> = {};
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  const emps = employees.data ?? [];
  const expiringLicenses = (credentials.data ?? []).filter((c) => c.expires_at && c.expires_at <= thirtyDays).length;

  const birthdays = emps.filter((e) => {
    if (!e.date_of_birth) return false;
    const dob = new Date(e.date_of_birth);
    const now = new Date();
    return dob.getMonth() === now.getMonth() && Math.abs(dob.getDate() - now.getDate()) <= 14;
  }).length;

  const anniversaries = emps.filter((e) => {
    if (!e.hire_date) return false;
    const hire = new Date(e.hire_date);
    const now = new Date();
    return hire.getMonth() === now.getMonth() && Math.abs(hire.getDate() - now.getDate()) <= 14;
  }).length;

  return {
    applicants: {
      total: apps.length,
      newThisWeek: apps.filter((a) => a.submitted_at >= weekAgo).length,
      byStatus,
    },
    employees: {
      total: emps.length,
      active: emps.filter((e) => e.lifecycle_status === "active").length,
      onboarding: emps.filter((e) => e.lifecycle_status === "onboarding").length,
      onLeave: emps.filter((e) => e.lifecycle_status === "on_leave").length,
    },
    alerts: {
      expiringLicenses,
      missingOnboarding: (onboarding.data ?? []).length,
      clockedIn: (timeclock.data ?? []).length,
      lateArrivals: 0,
      openShifts: 0,
      upcomingBirthdays: birthdays,
      upcomingAnniversaries: anniversaries,
      payrollDue: (payPeriods.data ?? []).length > 0,
      onVacation: (timeOff.data ?? []).length,
      trainingExpiring: (training.data ?? []).length,
      workersCompAlerts: (incidents.data ?? []).length,
      safetyIncidents: (incidents.data ?? []).length,
      equipmentNotReturned: (equipment.data ?? []).length,
      outstandingWriteUps: (discipline.data ?? []).length,
    },
  };
}

export async function getEmployeeCredentials(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employee_credentials")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId);
  if (error) throw error;
  return (data ?? []).map(rowToEmployeeCredential);
}

export async function upsertEmployeeCredential(companyId: string, employeeId: string, data: {
  credentialType: string;
  credentialNumberMasked?: string;
  issuingState?: string;
  issuedAt?: string;
  expiresAt?: string;
}) {
  const sb = await sbWrite();
  const credId = id("cred");
  await sb.from("employee_credentials").insert({
    id: credId,
    company_id: companyId,
    employee_id: employeeId,
    credential_type: data.credentialType,
    credential_number_masked: data.credentialNumberMasked,
    issuing_state: data.issuingState,
    issued_at: data.issuedAt,
    expires_at: data.expiresAt,
    status: "active",
  });
  return credId;
}

export async function getEquipmentCatalog(companyId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb.from("equipment_catalog").select("*").eq("company_id", companyId).eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(rowToEquipmentCatalogItem);
}

export async function assignEquipment(companyId: string, data: {
  employeeId: string;
  catalogItemId?: string;
  itemType: string;
  itemName: string;
  serialNumber?: string;
  replacementCost?: number;
}, profileId?: string) {
  const sb = await sbWrite();
  const assignId = id("eqas");
  await sb.from("equipment_assignments").insert({
    id: assignId,
    company_id: companyId,
    employee_id: data.employeeId,
    catalog_item_id: data.catalogItemId,
    item_type: data.itemType,
    item_name: data.itemName,
    serial_number: data.serialNumber,
    replacement_cost: data.replacementCost,
    assigned_by_profile_id: profileId,
    status: "assigned",
  });
  return assignId;
}

export async function getEquipmentAssignments(companyId: string, employeeId?: string) {
  const sb = await sbWrite();
  let query = sb.from("equipment_assignments").select("*").eq("company_id", companyId).order("assigned_at", { ascending: false });
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToEquipmentAssignment);
}

export async function returnEquipment(companyId: string, assignmentId: string, condition?: string) {
  const sb = await sbWrite();
  await sb.from("equipment_assignments").update({
    status: "returned",
    returned_at: new Date().toISOString(),
    condition_on_return: condition,
    updated_at: new Date().toISOString(),
  }).eq("id", assignmentId).eq("company_id", companyId);
}


export async function addDisciplinaryAction(companyId: string, data: {
  employeeId: string;
  actionType: string;
  incidentDate: string;
  description: string;
  correctiveAction?: string;
  visibleToSupervisor?: boolean;
}, profileId?: string) {
  const sb = await sbWrite();
  const actionId = id("disc");
  await sb.from("disciplinary_actions").insert({
    id: actionId,
    company_id: companyId,
    employee_id: data.employeeId,
    action_type: data.actionType,
    incident_date: data.incidentDate,
    description: data.description,
    corrective_action: data.correctiveAction,
    visible_to_supervisor: data.visibleToSupervisor ?? false,
    issued_by_profile_id: profileId,
    status: "active",
  });
  return actionId;
}

export async function getDisciplinaryActions(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("disciplinary_actions")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("incident_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToDisciplinaryAction);
}

export async function addHrNote(companyId: string, data: {
  employeeId: string;
  content: string;
  noteType?: string;
  isPrivate?: boolean;
  visibleToSupervisor?: boolean;
}, profileId?: string) {
  const sb = await sbWrite();
  const noteId = id("hrnote");
  await sb.from("hr_notes").insert({
    id: noteId,
    company_id: companyId,
    employee_id: data.employeeId,
    author_profile_id: profileId,
    note_type: data.noteType ?? "general",
    content: data.content,
    is_private: data.isPrivate ?? false,
    visible_to_supervisor: data.visibleToSupervisor ?? false,
  });
  return noteId;
}

export async function getHrNotes(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("hr_notes")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToHrNote);
}

export async function getLeaderboard(companyId: string): Promise<LeaderboardEntry[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employee_kpi_snapshots")
    .select("*, employees(first_name, last_name)")
    .eq("company_id", companyId)
    .eq("period_type", "lifetime")
    .order("revenue_generated", { ascending: false })
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((row, i) => {
    const emp = row.employees as Record<string, unknown> | null;
    return {
      employeeId: String(row.employee_id),
      employeeName: emp ? `${emp.first_name} ${emp.last_name}` : String(row.employee_id),
      jobsCompleted: Number(row.jobs_completed ?? 0),
      revenueGenerated: Number(row.revenue_generated ?? 0),
      profitGenerated: Number(row.profit_generated ?? 0),
      rank: i + 1,
    };
  });
}

export async function refreshEmployeeKpi(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data: assignments } = await sb
    .from("job_assignments")
    .select("jobs(total_amount, status)")
    .eq("employee_id", employeeId);

  const jobs = (assignments ?? [])
    .map((a) => {
      const j = a.jobs as unknown;
      return Array.isArray(j) ? j[0] : j;
    })
    .filter((j): j is Record<string, unknown> => !!j && typeof j === "object" && (j as Record<string, unknown>).status === "completed");
  const revenue = jobs.reduce((s, j) => s + Number(j.total_amount ?? 0), 0);

  const snapId = id("kpi");
  const today = format(new Date(), "yyyy-MM-dd");
  await sb.from("employee_kpi_snapshots").upsert({
    id: snapId,
    company_id: companyId,
    employee_id: employeeId,
    snapshot_date: today,
    period_type: "lifetime",
    jobs_completed: jobs.length,
    revenue_generated: revenue,
    profit_generated: revenue * 0.35,
  }, { onConflict: "company_id,employee_id,snapshot_date,period_type" });
}

export async function getSafetyIncidents(companyId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("safety_incidents")
    .select("*")
    .eq("company_id", companyId)
    .order("incident_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToSafetyIncident);
}

export async function addPerformanceReview(companyId: string, data: {
  employeeId: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  overallRating?: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
}, profileId?: string) {
  const sb = await sbWrite();
  const reviewId = id("review");
  await sb.from("performance_reviews").insert({
    id: reviewId,
    company_id: companyId,
    employee_id: data.employeeId,
    reviewer_profile_id: profileId,
    review_period_start: data.reviewPeriodStart,
    review_period_end: data.reviewPeriodEnd,
    overall_rating: data.overallRating,
    strengths: data.strengths,
    improvements: data.improvements,
    goals: data.goals,
    status: "draft",
  });
  return reviewId;
}

export async function getPerformanceReviews(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("performance_reviews")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("review_period_end", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPerformanceReview);
}
