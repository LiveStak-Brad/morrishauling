import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/db/activity";
import {
  rowToApplicant,
  rowToApplication,
  rowToInterviewNote,
  rowToJobPosting,
  rowToApplicationStatusHistory,
  rowToApplicationEmploymentHistory,
  rowToApplicationReference,
  rowToApplicationEducation,
  rowToApplicationCertification,
} from "@/lib/db/hr-mappers";
import type {
  ApplicantStatus,
  Application,
  ApplicationSubmitPayload,
  InterviewNote,
  JobPosting,
} from "@/types/hr/ats";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function token() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getCareersPostings(companyId: string): Promise<JobPosting[]> {
  const { resolveCareersPostings, getReferenceCareerPostings } = await import("@/lib/careers/resolve-postings");

  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("job_postings")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "published")
      .neq("hiring_mode", "hidden")
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(rowToJobPosting);
    }

    if (error) {
      const legacy = await sb
        .from("job_postings")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (!legacy.error && legacy.data && legacy.data.length > 0) {
        return legacy.data.map(rowToJobPosting);
      }
    }
  } catch {
    // DB unavailable or schema not migrated — use reference templates
  }

  return getReferenceCareerPostings();
}

export async function getPublishedJobPostings(companyId: string): Promise<JobPosting[]> {
  return getCareersPostings(companyId);
}

export async function getJobPostingBySlug(companyId: string, slug: string): Promise<JobPosting | null> {
  const { findCareerPosting, getReferenceCareerPostings } = await import("@/lib/careers/resolve-postings");

  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("job_postings")
      .select("*")
      .eq("company_id", companyId)
      .eq("slug", slug)
      .eq("status", "published")
      .neq("hiring_mode", "hidden")
      .maybeSingle();
    if (!error && data) return rowToJobPosting(data);

    if (!error || error.code !== "42703") {
      const legacy = await sb
        .from("job_postings")
        .select("*")
        .eq("company_id", companyId)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!legacy.error && legacy.data) return rowToJobPosting(legacy.data);
    }
  } catch {
    // fall through to reference
  }

  return findCareerPosting(getReferenceCareerPostings(), { slug }) ?? null;
}

export async function getJobPostingById(companyId: string, postingId: string): Promise<JobPosting | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("job_postings")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", postingId)
    .maybeSingle();
  if (error) throw error;
  if (data) return rowToJobPosting(data);

  const { ALL_REFERENCE_POSITIONS, referenceToJobPosting } = await import("@/lib/careers/reference-positions");
  const seed = ALL_REFERENCE_POSITIONS.find((p) => p.id === postingId);
  return seed ? referenceToJobPosting(seed) : null;
}

export async function getJobPostings(companyId: string): Promise<JobPosting[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("job_postings")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToJobPosting);
}

export async function getApplications(companyId: string, filters?: { status?: string }): Promise<Application[]> {
  const sb = await sbWrite();
  let query = sb
    .from("applications")
    .select("*, applicants(*), job_postings(*)")
    .eq("company_id", companyId)
    .order("submitted_at", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const app = rowToApplication(row);
    const applicantRow = row.applicants as Record<string, unknown> | null;
    const postingRow = row.job_postings as Record<string, unknown> | null;
    if (applicantRow) app.applicant = rowToApplicant(applicantRow);
    if (postingRow) app.jobPosting = rowToJobPosting(postingRow);
    return app;
  });
}

export async function getApplicationById(companyId: string, applicationId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("applications")
    .select("*, applicants(*), job_postings(*)")
    .eq("company_id", companyId)
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [history, notes, employment, references, education, certifications] = await Promise.all([
    sb.from("application_status_history").select("*").eq("application_id", applicationId).order("created_at"),
    sb.from("interview_notes").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
    sb.from("application_employment_history").select("*").eq("application_id", applicationId).order("sort_order"),
    sb.from("application_references").select("*").eq("application_id", applicationId).order("sort_order"),
    sb.from("application_education").select("*").eq("application_id", applicationId).order("sort_order"),
    sb.from("application_certifications").select("*").eq("application_id", applicationId).order("sort_order"),
  ]);

  const app = rowToApplication(data);
  const applicantRow = data.applicants as Record<string, unknown> | null;
  const postingRow = data.job_postings as Record<string, unknown> | null;
  if (applicantRow) app.applicant = rowToApplicant(applicantRow);
  if (postingRow) app.jobPosting = rowToJobPosting(postingRow);

  return {
    application: app,
    statusHistory: (history.data ?? []).map(rowToApplicationStatusHistory),
    interviewNotes: (notes.data ?? []).map(rowToInterviewNote),
    employmentHistory: (employment.data ?? []).map(rowToApplicationEmploymentHistory),
    references: (references.data ?? []).map(rowToApplicationReference),
    education: (education.data ?? []).map(rowToApplicationEducation),
    certifications: (certifications.data ?? []).map(rowToApplicationCertification),
  };
}

export async function submitApplication(companyId: string, payload: ApplicationSubmitPayload) {
  const sb = await sbWrite();
  const applicantId = id("applicant");
  const applicationId = id("application");
  const statusToken = token();

  const posting = await getJobPostingById(companyId, payload.jobPostingId);
  const hiringMode = posting?.hiringMode;
  let applicationType: "standard" | "talent_pool" | "general_interest" = "standard";
  if (payload.jobPostingId === "posting-general-interest" || posting?.slug === "general-interest") {
    applicationType = "general_interest";
  } else if (hiringMode && hiringMode !== "active_hiring") {
    applicationType = "talent_pool";
  }

  await sb.from("applicants").insert({
    id: applicantId,
    company_id: companyId,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    status: "applied",
    address_line1: payload.addressLine1,
    city: payload.city,
    state: payload.state,
    zip: payload.zip,
    military_status: payload.militaryStatus,
    desired_pay: payload.desiredPay,
    availability: payload.availability,
    transportation: payload.transportation,
    can_lift_100lbs: payload.canLift100lbs,
    can_drive_trucks: payload.canDriveTrucks,
    has_cdl: payload.hasCdl,
    has_dot_medical: payload.hasDotMedical,
    has_drivers_license: payload.hasDriversLicense,
    has_reliable_transportation: payload.hasReliableTransportation,
    experience_summary: payload.experienceSummary,
    why_morris: payload.whyMorris,
    employment_type_preference: payload.employmentTypePreference,
    drug_test_consent: payload.drugTestConsent,
    background_check_consent: payload.backgroundCheckConsent,
  });

  await sb.from("applications").insert({
    id: applicationId,
    company_id: companyId,
    applicant_id: applicantId,
    job_posting_id: payload.jobPostingId,
    status: "applied",
    cover_letter: payload.coverLetter ?? payload.whyMorris,
    status_token: statusToken,
    source: payload.source ?? "careers_page",
    application_type: applicationType,
  });

  await sb.from("application_status_history").insert({
    id: id("ash"),
    company_id: companyId,
    application_id: applicationId,
    to_status: "applied",
    notes:
      applicationType === "talent_pool"
        ? "Talent pool application submitted for future opening"
        : applicationType === "general_interest"
          ? "General interest application submitted"
          : "Application submitted online",
  });

  for (const [i, emp] of (payload.employmentHistory ?? []).entries()) {
    await sb.from("application_employment_history").insert({
      id: id("aeh"),
      company_id: companyId,
      application_id: applicationId,
      employer_name: emp.employerName,
      job_title: emp.jobTitle,
      start_date: emp.startDate,
      end_date: emp.endDate,
      is_current: emp.isCurrent,
      reason_for_leaving: emp.reasonForLeaving,
      sort_order: i,
    });
  }

  for (const [i, ref] of (payload.references ?? []).entries()) {
    await sb.from("application_references").insert({
      id: id("aref"),
      company_id: companyId,
      application_id: applicationId,
      name: ref.name,
      relationship: ref.relationship,
      phone: ref.phone,
      email: ref.email,
      sort_order: i,
    });
  }

  for (const [i, edu] of (payload.education ?? []).entries()) {
    await sb.from("application_education").insert({
      id: id("aedu"),
      company_id: companyId,
      application_id: applicationId,
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.fieldOfStudy,
      graduation_year: edu.graduationYear,
      sort_order: i,
    });
  }

  for (const [i, cert] of (payload.certifications ?? []).entries()) {
    await sb.from("application_certifications").insert({
      id: id("acert"),
      company_id: companyId,
      application_id: applicationId,
      name: cert.name,
      issuing_body: cert.issuingBody,
      issued_at: cert.issuedAt,
      expires_at: cert.expiresAt,
      sort_order: i,
    });
  }

  await logActivity({
    companyId,
    entityType: "applicant",
    entityId: applicationId,
    action: "application_submitted",
    message: `${payload.firstName} ${payload.lastName} applied online`,
  });

  return { applicationId, applicantId, statusToken };
}

/** Admin manual applicant entry (phone/text/referral). */
export async function createAdminApplicant(
  companyId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    jobPostingId?: string;
    source?: string;
    notes?: string;
  },
  options?: { actorProfileId?: string }
) {
  const sb = await sbWrite();
  const applicantId = id("applicant");
  const applicationId = id("application");

  await sb.from("applicants").insert({
    id: applicantId,
    company_id: companyId,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email?.trim() || `noreply+${applicantId}@morrisjunk.local`,
    phone: input.phone,
    status: "applied",
  });

  if (!input.jobPostingId) {
    throw new Error("jobPostingId required — select a job posting or create one first");
  }

  await sb.from("applications").insert({
    id: applicationId,
    company_id: companyId,
    applicant_id: applicantId,
    job_posting_id: input.jobPostingId,
    status: "applied",
    cover_letter: input.notes,
    status_token: token(),
  });

  await sb.from("application_status_history").insert({
    id: id("ash"),
    company_id: companyId,
    application_id: applicationId,
    to_status: "applied",
    changed_by_profile_id: options?.actorProfileId,
    notes: input.source ? `Entered by admin — ${input.source}` : "Entered by admin",
  });

  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "applicant",
    entityId: applicationId,
    action: "application_created",
    message: `${input.firstName} ${input.lastName} added manually`,
  });

  return { applicationId, applicantId };
}

export async function updateApplicationStatus(
  companyId: string,
  applicationId: string,
  toStatus: ApplicantStatus,
  profileId?: string,
  notes?: string
) {
  const sb = await sbWrite();
  const detail = await getApplicationById(companyId, applicationId);
  if (!detail) throw new Error("Application not found");

  const fromStatus = detail.application.status;

  await sb.from("applications").update({ status: toStatus, updated_at: new Date().toISOString() }).eq("id", applicationId);
  await sb.from("applicants").update({ status: toStatus, updated_at: new Date().toISOString() }).eq("id", detail.application.applicantId);

  await sb.from("application_status_history").insert({
    id: id("ash"),
    company_id: companyId,
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by_profile_id: profileId,
    notes,
  });

  await logActivity({
    companyId,
    actorProfileId: profileId,
    entityType: "applicant",
    entityId: applicationId,
    action: "status_changed",
    message: `Application status: ${fromStatus} → ${toStatus}`,
  });

  return { fromStatus, toStatus };
}

export async function addInterviewNote(
  companyId: string,
  applicationId: string,
  note: Pick<InterviewNote, "noteType" | "content" | "interviewDate">,
  authorProfileId?: string
) {
  const sb = await sbWrite();
  const noteId = id("inote");
  await sb.from("interview_notes").insert({
    id: noteId,
    company_id: companyId,
    application_id: applicationId,
    author_profile_id: authorProfileId,
    note_type: note.noteType,
    content: note.content,
    interview_date: note.interviewDate,
  });
  return noteId;
}

export async function createJobPosting(
  companyId: string,
  data: Partial<JobPosting> & { title: string; slug: string; description: string; employmentType: JobPosting["employmentType"] }
) {
  const sb = await sbWrite();
  const postingId = id("posting");
  await sb.from("job_postings").insert({
    id: postingId,
    company_id: companyId,
    position_id: data.positionId,
    department_id: data.departmentId,
    title: data.title,
    slug: data.slug,
    description: data.description,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    nice_to_have: data.niceToHave,
    growth_path: data.growthPath,
    employment_type: data.employmentType,
    pay_range_min: data.payRangeMin,
    pay_range_max: data.payRangeMax,
    pay_range_unit: data.payRangeUnit ?? "hourly",
    pay_note: data.payNote,
    location: data.location,
    schedule: data.schedule,
    category: data.category,
    department_label: data.departmentLabel,
    hiring_mode: data.hiringMode ?? "future_opening",
    is_reference_template: data.isReferenceTemplate ?? false,
    sort_order: data.sortOrder ?? 0,
    is_remote: data.isRemote ?? false,
    status: data.status ?? "draft",
    published_at: data.status === "published" ? new Date().toISOString() : null,
  });
  return postingId;
}

export async function updateJobPosting(companyId: string, postingId: string, updates: Partial<JobPosting>) {
  const sb = await sbWrite();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title) row.title = updates.title;
  if (updates.slug) row.slug = updates.slug;
  if (updates.description) row.description = updates.description;
  if (updates.requirements !== undefined) row.requirements = updates.requirements;
  if (updates.responsibilities !== undefined) row.responsibilities = updates.responsibilities;
  if (updates.niceToHave !== undefined) row.nice_to_have = updates.niceToHave;
  if (updates.growthPath !== undefined) row.growth_path = updates.growthPath;
  if (updates.schedule !== undefined) row.schedule = updates.schedule;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.departmentLabel !== undefined) row.department_label = updates.departmentLabel;
  if (updates.hiringMode !== undefined) row.hiring_mode = updates.hiringMode;
  if (updates.employmentType) row.employment_type = updates.employmentType;
  if (updates.location !== undefined) row.location = updates.location;
  if (updates.payNote !== undefined) row.pay_note = updates.payNote;
  if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
  if (updates.status) {
    row.status = updates.status;
    if (updates.status === "published") row.published_at = new Date().toISOString();
  }
  if (updates.payRangeMin !== undefined) row.pay_range_min = updates.payRangeMin;
  if (updates.payRangeMax !== undefined) row.pay_range_max = updates.payRangeMax;
  if (updates.payRangeUnit) row.pay_range_unit = updates.payRangeUnit;
  await sb.from("job_postings").update(row).eq("id", postingId).eq("company_id", companyId);
}
