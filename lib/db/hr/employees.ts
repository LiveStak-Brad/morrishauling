import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/db/activity";
import { rowToHrEmployee, rowToOnboardingItem, rowToEmployeeDocument, rowToDocumentTemplate } from "@/lib/db/hr-mappers";
import { getApplicationById, updateApplicationStatus } from "./ats";
import type { EmploymentType } from "@/types/hr/ats";
import type { HrEmployee, EmployeeDispatchStats } from "@/types/hr/employee";
import type { OnboardingProgress } from "@/types/hr/onboarding";
import { filterHrEmployees } from "@/lib/data/real-record-filter";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

function nextEmployeeNumber(existing: string[]): string {
  const nums = existing
    .map((n) => parseInt(n.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1001;
  return `EMP-${next}`;
}

export async function getHrEmployees(companyId: string, filters?: {
  lifecycleStatus?: string;
  employmentType?: string;
  search?: string;
}): Promise<HrEmployee[]> {
  const sb = await sbWrite();
  let query = sb
    .from("employees")
    .select("*, departments(id, name), positions(id, title)")
    .eq("company_id", companyId)
    .order("last_name");
  if (filters?.lifecycleStatus) query = query.eq("lifecycle_status", filters.lifecycleStatus);
  if (filters?.employmentType) query = query.eq("employment_type", filters.employmentType);
  const { data, error } = await query;
  if (error) throw error;
  let rows = (data ?? []).map(rowToHrEmployee);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.employeeNumber?.toLowerCase().includes(q)
    );
  }
  return filterHrEmployees(rows);
}

export async function getHrEmployeeById(companyId: string, employeeId: string): Promise<HrEmployee | null> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employees")
    .select("*, departments(id, name), positions(id, title), manager:manager_employee_id(id, first_name, last_name)")
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToHrEmployee(data) : null;
}

export async function hireApplicant(
  companyId: string,
  applicationId: string,
  options: {
    employmentType: EmploymentType;
    role?: string;
    departmentId?: string;
    positionId?: string;
    hourlyRate?: number;
    profileId?: string;
  }
) {
  const sb = await sbWrite();
  const detail = await getApplicationById(companyId, applicationId);
  if (!detail?.application.applicant) throw new Error("Application not found");

  const applicant = detail.application.applicant;
  const employeeId = id("emp");

  const { data: existingNums } = await sb
    .from("employees")
    .select("employee_number")
    .eq("company_id", companyId)
    .not("employee_number", "is", null);
  const employeeNumber = nextEmployeeNumber((existingNums ?? []).map((r) => String(r.employee_number)));

  await sb.from("employees").insert({
    id: employeeId,
    company_id: companyId,
    employee_number: employeeNumber,
    source_application_id: applicationId,
    first_name: applicant.firstName,
    last_name: applicant.lastName,
    email: applicant.email,
    phone: applicant.phone,
    role: options.role ?? "helper",
    status: "active",
    lifecycle_status: "onboarding",
    employment_type: options.employmentType,
    department_id: options.departmentId,
    position_id: options.positionId,
    hire_date: format(new Date(), "yyyy-MM-dd"),
    address_line1: applicant.addressLine1,
    city: applicant.city,
    state: applicant.state,
    zip: applicant.zip,
    hourly_rate: options.hourlyRate,
    pay_type: "hourly",
  });

  await sb.from("applicants").update({
    status: "hired",
    converted_employee_id: employeeId,
    updated_at: new Date().toISOString(),
  }).eq("id", applicant.id);

  await updateApplicationStatus(companyId, applicationId, "hired", options.profileId, "Applicant hired");

  await initializeOnboarding(companyId, employeeId, options.employmentType);
  await assignEmploymentDocuments(companyId, employeeId, options.employmentType);

  await logActivity({
    companyId,
    actorProfileId: options.profileId,
    entityType: "employee",
    entityId: employeeId,
    action: "hired",
    message: `${applicant.firstName} ${applicant.lastName} hired from application ${applicationId}`,
    metadata: { applicationId, sourceApplicationId: applicationId },
  });

  return { employeeId, employeeNumber };
}

export async function createEmployeeDirectly(
  companyId: string,
  input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    employmentType: EmploymentType;
    role?: string;
    departmentId?: string;
    positionId?: string;
    payType?: string;
    hourlyRate?: number;
    hireDate?: string;
    onboardingTemplateId?: string;
  },
  options?: { actorProfileId?: string }
) {
  const sb = await sbWrite();
  const employeeId = id("emp");

  const { data: existingNums } = await sb
    .from("employees")
    .select("employee_number")
    .eq("company_id", companyId)
    .not("employee_number", "is", null);
  const employeeNumber = nextEmployeeNumber((existingNums ?? []).map((r) => String(r.employee_number)));

  await sb.from("employees").insert({
    id: employeeId,
    company_id: companyId,
    employee_number: employeeNumber,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    role: input.role ?? "helper",
    status: "active",
    lifecycle_status: "onboarding",
    employment_type: input.employmentType,
    department_id: input.departmentId,
    position_id: input.positionId,
    hire_date: input.hireDate ?? format(new Date(), "yyyy-MM-dd"),
    pay_type: input.payType ?? "hourly",
    hourly_rate: input.hourlyRate,
  });

  await initializeOnboarding(companyId, employeeId, input.employmentType);
  await assignEmploymentDocuments(companyId, employeeId, input.employmentType);

  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "employee",
    entityId: employeeId,
    action: "created",
    message: `${input.firstName} ${input.lastName} created by admin`,
  });

  return { employeeId, employeeNumber };
}

export async function initializeOnboarding(companyId: string, employeeId: string, employmentType: EmploymentType) {
  const sb = await sbWrite();
  const { data: template } = await sb
    .from("onboarding_templates")
    .select("id")
    .eq("company_id", companyId)
    .eq("employment_type", employmentType)
    .eq("is_active", true)
    .maybeSingle();
  if (!template) return;

  const { data: items } = await sb
    .from("onboarding_template_items")
    .select("*")
    .eq("template_id", template.id)
    .order("sort_order");

  for (const item of items ?? []) {
    await sb.from("employee_onboarding_items").insert({
      id: id("onbi"),
      company_id: companyId,
      employee_id: employeeId,
      template_item_id: item.id,
      item_key: item.item_key,
      label: item.label,
      is_required: item.is_required,
      sort_order: item.sort_order,
      status: "pending",
    });
  }
}

export async function assignEmploymentDocuments(companyId: string, employeeId: string, employmentType: EmploymentType) {
  const sb = await sbWrite();

  const W2_KEYS = ["i9", "w4", "handbook", "safety_agreement"];
  const CONTRACTOR_KEYS = ["w9", "contractor_agreement", "safety_agreement"];
  const keys = employmentType === "1099_contractor" ? CONTRACTOR_KEYS : W2_KEYS;

  const { data: templates } = await sb
    .from("document_templates")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .in("document_key", keys);

  for (const tmpl of templates ?? []) {
    const types = (tmpl.employment_types as string[]) ?? [];
    if (types.length && !types.includes(employmentType)) continue;

    const { data: existing } = await sb
      .from("employee_documents")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("document_key", tmpl.document_key)
      .maybeSingle();
    if (existing) continue;

    await sb.from("employee_documents").insert({
      id: id("edoc"),
      company_id: companyId,
      employee_id: employeeId,
      template_id: tmpl.id,
      document_key: tmpl.document_key,
      name: tmpl.name,
      version: tmpl.version,
      status: "pending",
    });
  }
}

export async function getOnboardingProgress(companyId: string, employeeId: string): Promise<OnboardingProgress> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employee_onboarding_items")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("sort_order");
  if (error) throw error;
  const items = (data ?? []).map(rowToOnboardingItem);
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === "complete" || i.status === "waived").length;
  const requiredItems = items.filter((i) => i.isRequired).length;
  const requiredComplete = items.filter(
    (i) => i.isRequired && (i.status === "complete" || i.status === "waived")
  ).length;
  return {
    employeeId,
    totalItems,
    completedItems,
    requiredItems,
    requiredComplete,
    percentComplete: totalItems ? Math.round((completedItems / totalItems) * 100) : 100,
    canActivate: requiredItems === 0 || requiredComplete >= requiredItems,
    items,
  };
}

export async function updateOnboardingItem(
  companyId: string,
  itemId: string,
  status: "complete" | "waived" | "pending",
  profileId?: string,
  waivedReason?: string
) {
  const sb = await sbWrite();
  await sb.from("employee_onboarding_items").update({
    status,
    completed_at: status === "complete" ? new Date().toISOString() : null,
    completed_by_profile_id: profileId,
    waived_reason: waivedReason,
    updated_at: new Date().toISOString(),
  }).eq("id", itemId).eq("company_id", companyId);
}

export async function activateEmployee(companyId: string, employeeId: string, profileId?: string) {
  const progress = await getOnboardingProgress(companyId, employeeId);
  if (!progress.canActivate) throw new Error("Required onboarding items incomplete");

  const sb = await sbWrite();
  await sb.from("employees").update({
    lifecycle_status: "active",
    updated_at: new Date().toISOString(),
  }).eq("id", employeeId).eq("company_id", companyId);

  await logActivity({
    companyId,
    actorProfileId: profileId,
    entityType: "employee",
    entityId: employeeId,
    action: "activated",
    message: "Employee activated after onboarding completion",
  });
}

export async function terminateEmployee(
  companyId: string,
  employeeId: string,
  reason: string,
  profileId?: string
) {
  const sb = await sbWrite();
  await sb.from("employees").update({
    lifecycle_status: "terminated",
    status: "inactive",
    termination_date: format(new Date(), "yyyy-MM-dd"),
    termination_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", employeeId).eq("company_id", companyId);

  await logActivity({
    companyId,
    actorProfileId: profileId,
    entityType: "employee",
    entityId: employeeId,
    action: "terminated",
    message: `Employee terminated: ${reason}`,
  });
}

export async function updateHrEmployee(companyId: string, employeeId: string, updates: Partial<HrEmployee>) {
  const sb = await sbWrite();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.firstName) row.first_name = updates.firstName;
  if (updates.lastName) row.last_name = updates.lastName;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.employmentType) row.employment_type = updates.employmentType;
  if (updates.departmentId !== undefined) row.department_id = updates.departmentId;
  if (updates.positionId !== undefined) row.position_id = updates.positionId;
  if (updates.managerEmployeeId !== undefined) row.manager_employee_id = updates.managerEmployeeId;
  if (updates.hourlyRate !== undefined) row.hourly_rate = updates.hourlyRate;
  if (updates.lifecycleStatus) row.lifecycle_status = updates.lifecycleStatus;
  await sb.from("employees").update(row).eq("id", employeeId).eq("company_id", companyId);
}

export async function getEmployeeDocuments(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employee_documents")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEmployeeDocument);
}

export async function signEmployeeDocument(
  companyId: string,
  documentId: string,
  payload: { signerName: string; signerProfileId?: string; ipAddress?: string; userAgent?: string; signatureDataUrl?: string }
) {
  const sb = await sbWrite();
  const { data: doc } = await sb
    .from("employee_documents")
    .select("employee_id, template_id, document_templates(version)")
    .eq("id", documentId)
    .eq("company_id", companyId)
    .single();
  if (!doc) throw new Error("Document not found");

  const rawTpl = doc.document_templates as unknown;
  const template = (Array.isArray(rawTpl) ? rawTpl[0] : rawTpl) as { version?: number } | null;
  const sigId = id("dsig");
  await sb.from("document_signatures").insert({
    id: sigId,
    company_id: companyId,
    employee_document_id: documentId,
    signer_profile_id: payload.signerProfileId,
    signer_name: payload.signerName,
    ip_address: payload.ipAddress,
    user_agent: payload.userAgent,
    signature_image_path: payload.signatureDataUrl ? `signatures/${sigId}.png` : null,
    template_version: template?.version ?? 1,
  });
  await sb.from("employee_documents").update({
    status: "signed",
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", documentId);
  return sigId;
}

export async function getEmployeeDispatchStats(companyId: string, employeeId: string): Promise<EmployeeDispatchStats> {
  const sb = await sbWrite();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: assignments } = await sb
    .from("job_assignments")
    .select("job_id, jobs(id, scheduled_date, total_amount, status)")
    .eq("employee_id", employeeId);

  const jobs = (assignments ?? [])
    .map((a) => {
      const j = a.jobs as unknown;
      return (Array.isArray(j) ? j[0] : j) as Record<string, unknown> | null;
    })
    .filter(Boolean) as Record<string, unknown>[];

  const todayJobs = jobs.filter((j) => j.scheduled_date === today).length;
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const lifetimeJobs = completedJobs.length;
  const revenues = completedJobs.map((j) => Number(j.total_amount ?? 0));
  const revenueProduced = revenues.reduce((s, v) => s + v, 0);
  const avgJobValue = lifetimeJobs ? revenueProduced / lifetimeJobs : 0;

  const { data: emp } = await sb.from("employees").select("hourly_rate").eq("id", employeeId).maybeSingle();
  const hourlyRate = Number(emp?.hourly_rate ?? 18);
  const laborCost = lifetimeJobs * 4 * hourlyRate;
  const profitProduced = revenueProduced * 0.35 - laborCost;

  return {
    employeeId,
    todayJobs,
    lifetimeJobs,
    avgJobValue: Math.round(avgJobValue * 100) / 100,
    revenueProduced: Math.round(revenueProduced * 100) / 100,
    profitProduced: Math.round(profitProduced * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
  };
}

export async function getDocumentTemplates(companyId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("document_templates")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map(rowToDocumentTemplate);
}
