import type {
  Applicant,
  Application,
  ApplicationCertification,
  ApplicationEducation,
  ApplicationEmploymentHistory,
  ApplicationReference,
  ApplicationStatusHistory,
  InterviewNote,
  JobPosting,
  Department,
  Position,
} from "@/types/hr/ats";
import type { HrEmployee, EmployeeEmergencyContact, EmployeePayRate } from "@/types/hr/employee";
import type { EmployeeOnboardingItem, OnboardingTemplate, OnboardingTemplateItem } from "@/types/hr/onboarding";
import type { DocumentTemplate, EmployeeDocument, DocumentSignature } from "@/types/hr/documents";
import type { TimeclockPunch, TimesheetAdjustment } from "@/types/hr/time";
import type { TimeOffRequest, EmployeeShift } from "@/types/hr/schedule";
import type { PayPeriod, PayrollEntry, PayrollExport, Contractor1099Yearly } from "@/types/hr/payroll";
import type { EmployeeCredential, SafetyIncident } from "@/types/hr/compliance";
import type { EquipmentCatalogItem, EquipmentAssignment, EquipmentAsset, EquipmentCheckoutEvent, EquipmentDamageReport } from "@/types/hr/equipment";
import type { TrainingCourse, TrainingCompletion, TrainingLesson, TrainingQuizQuestion, TrainingCourseAssignment } from "@/types/hr/training";
import type { PerformanceReview, DisciplinaryAction, HrNote, EmployeeKpiSnapshot } from "@/types/hr/performance";

function str(v: unknown): string | undefined {
  return v == null ? undefined : String(v);
}
function num(v: unknown): number | undefined {
  return v == null ? undefined : Number(v);
}
function bool(v: unknown, fallback = false): boolean {
  return v == null ? fallback : Boolean(v);
}

export function rowToDepartment(r: Record<string, unknown>): Department {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    name: String(r.name),
    description: str(r.description),
    isActive: bool(r.is_active, true),
  };
}

export function rowToPosition(r: Record<string, unknown>): Position {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    departmentId: str(r.department_id),
    title: String(r.title),
    description: str(r.description),
    isActive: bool(r.is_active, true),
  };
}

export function rowToJobPosting(r: Record<string, unknown>): JobPosting {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    positionId: str(r.position_id),
    departmentId: str(r.department_id),
    title: String(r.title),
    slug: String(r.slug),
    description: String(r.description),
    requirements: str(r.requirements),
    responsibilities: str(r.responsibilities),
    niceToHave: str(r.nice_to_have),
    growthPath: str(r.growth_path),
    employmentType: r.employment_type as JobPosting["employmentType"],
    payRangeMin: num(r.pay_range_min),
    payRangeMax: num(r.pay_range_max),
    payRangeUnit: (r.pay_range_unit as JobPosting["payRangeUnit"]) ?? "hourly",
    payNote: str(r.pay_note),
    location: str(r.location),
    schedule: str(r.schedule),
    category: str(r.category) as JobPosting["category"],
    departmentLabel: str(r.department_label),
    hiringMode: str(r.hiring_mode) as JobPosting["hiringMode"],
    isReferenceTemplate: bool(r.is_reference_template),
    sortOrder: num(r.sort_order) ?? undefined,
    isRemote: bool(r.is_remote),
    status: r.status as JobPosting["status"],
    publishedAt: str(r.published_at),
    closesAt: str(r.closes_at),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToApplicant(r: Record<string, unknown>): Applicant {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    firstName: String(r.first_name),
    lastName: String(r.last_name),
    email: String(r.email),
    phone: str(r.phone),
    status: r.status as Applicant["status"],
    addressLine1: str(r.address_line1),
    city: str(r.city),
    state: str(r.state),
    zip: str(r.zip),
    militaryStatus: str(r.military_status),
    desiredPay: num(r.desired_pay),
    availability: str(r.availability),
    transportation: str(r.transportation),
    canLift100lbs: r.can_lift_100lbs == null ? undefined : bool(r.can_lift_100lbs),
    canDriveTrucks: r.can_drive_trucks == null ? undefined : bool(r.can_drive_trucks),
    hasCdl: r.has_cdl == null ? undefined : bool(r.has_cdl),
    hasDotMedical: r.has_dot_medical == null ? undefined : bool(r.has_dot_medical),
    hasDriversLicense: r.has_drivers_license == null ? undefined : bool(r.has_drivers_license),
    hasReliableTransportation: r.has_reliable_transportation == null ? undefined : bool(r.has_reliable_transportation),
    experienceSummary: str(r.experience_summary),
    whyMorris: str(r.why_morris),
    employmentTypePreference: str(r.employment_type_preference) as Applicant["employmentTypePreference"],
    drugTestConsent: bool(r.drug_test_consent),
    backgroundCheckConsent: bool(r.background_check_consent),
    convertedEmployeeId: str(r.converted_employee_id),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToApplication(r: Record<string, unknown>): Application {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    applicantId: String(r.applicant_id),
    jobPostingId: String(r.job_posting_id),
    status: r.status as Application["status"],
    coverLetter: str(r.cover_letter),
    statusToken: str(r.status_token),
    source: str(r.source),
    applicationType: str(r.application_type) as Application["applicationType"],
    submittedAt: String(r.submitted_at),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToInterviewNote(r: Record<string, unknown>): InterviewNote {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    applicationId: String(r.application_id),
    authorProfileId: str(r.author_profile_id),
    noteType: r.note_type as InterviewNote["noteType"],
    content: String(r.content),
    interviewDate: str(r.interview_date),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function rowToHrEmployee(r: Record<string, unknown>): HrEmployee {
  const dept = r.departments as Record<string, unknown> | null;
  const pos = r.positions as Record<string, unknown> | null;
  const mgr = r.manager as Record<string, unknown> | null;
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    profileId: str(r.profile_id),
    employeeNumber: str(r.employee_number),
    sourceApplicationId: str(r.source_application_id),
    firstName: String(r.first_name),
    lastName: String(r.last_name),
    phone: str(r.phone),
    email: str(r.email),
    role: String(r.role),
    status: String(r.status),
    lifecycleStatus: (r.lifecycle_status as HrEmployee["lifecycleStatus"]) ?? "active",
    employmentType: r.employment_type as HrEmployee["employmentType"],
    departmentId: str(r.department_id),
    positionId: str(r.position_id),
    managerEmployeeId: str(r.manager_employee_id),
    hireDate: str(r.hire_date),
    terminationDate: str(r.termination_date),
    terminationReason: str(r.termination_reason),
    dateOfBirth: str(r.date_of_birth),
    addressLine1: str(r.address_line1),
    addressLine2: str(r.address_line2),
    city: str(r.city),
    state: str(r.state),
    zip: str(r.zip),
    payType: str(r.pay_type),
    hourlyRate: num(r.hourly_rate),
    commissionRate: num(r.commission_rate),
    overtimeEligible: bool(r.overtime_eligible, true),
    primaryTruckId: str(r.primary_truck_id),
    primaryTrailerId: str(r.primary_trailer_id),
    secondaryTruckId: str(r.secondary_truck_id),
    secondaryTrailerId: str(r.secondary_trailer_id),
    driverLicenseOnFile: bool(r.driver_license_on_file),
    notes: str(r.notes),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    department: dept ? { id: String(dept.id), name: String(dept.name) } : undefined,
    position: pos ? { id: String(pos.id), title: String(pos.title) } : undefined,
    manager: mgr
      ? { id: String(mgr.id), firstName: String(mgr.first_name), lastName: String(mgr.last_name) }
      : undefined,
  };
}

export function rowToOnboardingItem(r: Record<string, unknown>): EmployeeOnboardingItem {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    itemKey: String(r.item_key),
    label: String(r.label),
    status: r.status as EmployeeOnboardingItem["status"],
    isRequired: bool(r.is_required, true),
    completedAt: str(r.completed_at),
    completedByProfileId: str(r.completed_by_profile_id),
    waivedReason: str(r.waived_reason),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function rowToEmployeeDocument(r: Record<string, unknown>): EmployeeDocument {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    employeeId: String(r.employee_id),
    templateId: str(r.template_id),
    documentKey: String(r.document_key),
    name: String(r.name),
    version: Number(r.version ?? 1),
    status: r.status as EmployeeDocument["status"],
    storagePath: str(r.storage_path),
    assignedAt: String(r.assigned_at),
    completedAt: str(r.completed_at),
  };
}

export function rowToTimeclockPunch(r: Record<string, unknown>): TimeclockPunch {
  return {
    id: String(r.id),
    timeclockId: String(r.timeclock_id),
    employeeId: String(r.employee_id),
    punchType: r.punch_type as TimeclockPunch["punchType"],
    punchedAt: String(r.punched_at),
    location: r.location as Record<string, unknown> | undefined,
    deviceInfo: r.device_info as Record<string, unknown> | undefined,
    photoPath: str(r.photo_path),
  };
}

export function rowToTimeOffRequest(r: Record<string, unknown>): TimeOffRequest {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    requestType: r.request_type as TimeOffRequest["requestType"],
    startDate: String(r.start_date),
    endDate: String(r.end_date),
    hoursRequested: num(r.hours_requested),
    reason: str(r.reason),
    status: r.status as TimeOffRequest["status"],
    reviewedByProfileId: str(r.reviewed_by_profile_id),
    reviewedAt: str(r.reviewed_at),
    reviewNotes: str(r.review_notes),
    partialDay: bool(r.partial_day),
    managerNotes: str(r.manager_notes),
    createdAt: String(r.created_at),
  };
}

export function rowToEmployeeShift(r: Record<string, unknown>): EmployeeShift {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    shiftDate: String(r.shift_date),
    startTime: String(r.start_time),
    endTime: String(r.end_time),
    role: str(r.role),
    notes: str(r.notes),
    status: r.status as EmployeeShift["status"],
  };
}

export function rowToPayPeriod(r: Record<string, unknown>): PayPeriod {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    startDate: String(r.start_date),
    endDate: String(r.end_date),
    status: r.status as PayPeriod["status"],
    lockedAt: str(r.locked_at),
    lockedByProfileId: str(r.locked_by_profile_id),
    createdAt: String(r.created_at),
  };
}

export function rowToPayrollEntry(r: Record<string, unknown>): PayrollEntry {
  const emp = r.employees as Record<string, unknown> | null;
  return {
    id: String(r.id),
    payPeriodId: String(r.pay_period_id),
    employeeId: String(r.employee_id),
    regularHours: Number(r.regular_hours ?? 0),
    overtimeHours: Number(r.overtime_hours ?? 0),
    holidayHours: Number(r.holiday_hours ?? 0),
    bonusAmount: Number(r.bonus_amount ?? 0),
    tipsAmount: Number(r.tips_amount ?? 0),
    commissionAmount: Number(r.commission_amount ?? 0),
    perJobIncentive: Number(r.per_job_incentive ?? 0),
    mileageAmount: Number(r.mileage_amount ?? 0),
    reimbursementAmount: Number(r.reimbursement_amount ?? 0),
    grossPay: Number(r.gross_pay ?? 0),
    federalWithholding: Number(r.federal_withholding ?? 0),
    stateWithholding: Number(r.state_withholding ?? 0),
    otherDeductions: Number(r.other_deductions ?? 0),
    netPay: Number(r.net_pay ?? 0),
    notes: str(r.notes),
    employee: emp
      ? {
          id: String(emp.id),
          firstName: String(emp.first_name),
          lastName: String(emp.last_name),
          employeeNumber: str(emp.employee_number),
        }
      : undefined,
  };
}

export function rowToEmployeeCredential(r: Record<string, unknown>): EmployeeCredential {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    credentialType: r.credential_type as EmployeeCredential["credentialType"],
    credentialNumberMasked: str(r.credential_number_masked),
    issuingState: str(r.issuing_state),
    issuedAt: str(r.issued_at),
    expiresAt: str(r.expires_at),
    status: r.status as EmployeeCredential["status"],
    notes: str(r.notes),
  };
}

export function rowToEquipmentAssignment(r: Record<string, unknown>): EquipmentAssignment {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    catalogItemId: str(r.catalog_item_id),
    itemType: String(r.item_type),
    itemName: String(r.item_name),
    serialNumber: str(r.serial_number),
    assignedAt: String(r.assigned_at),
    returnedAt: str(r.returned_at),
    conditionOnAssign: str(r.condition_on_assign),
    conditionOnReturn: str(r.condition_on_return),
    status: r.status as EquipmentAssignment["status"],
    replacementCost: num(r.replacement_cost),
    notes: str(r.notes),
  };
}

export function rowToEquipmentAsset(r: Record<string, unknown>): EquipmentAsset {
  const location = str(r.location);
  const trailerFromLocation =
    location?.startsWith("trailer:") ? location.slice("trailer:".length) : undefined;
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    name: String(r.name),
    category: String(r.category),
    serialNumber: str(r.serial_number),
    purchaseDate: str(r.purchase_date),
    purchasePrice: num(r.purchase_price),
    warrantyExpires: str(r.warranty_expires),
    condition: r.condition as EquipmentAsset["condition"],
    location: trailerFromLocation ? undefined : location,
    assignedEmployeeId: str(r.assigned_employee_id),
    assignedTruckId: str(r.assigned_truck_id),
    assignedTrailerId: trailerFromLocation,
    notes: str(r.notes),
    photoPaths: Array.isArray(r.photo_paths) ? (r.photo_paths as string[]) : [],
    expectedLifeMonths: num(r.expected_life_months),
    barcode: str(r.barcode),
    status: r.status as EquipmentAsset["status"],
  };
}

export function rowToEquipmentCheckoutEvent(r: Record<string, unknown>): EquipmentCheckoutEvent {
  const asset = r.equipment_assets as Record<string, unknown> | null;
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    employeeId: String(r.employee_id),
    checkoutAt: String(r.checkout_at),
    returnRequestedAt: str(r.return_requested_at),
    returnedAt: str(r.returned_at),
    conditionOut: String(r.condition_out),
    conditionIn: str(r.condition_in),
    employeeAcknowledgedAt: str(r.employee_acknowledged_at),
    signatureName: str(r.signature_name),
    notes: str(r.notes),
    asset: asset ? rowToEquipmentAsset(asset) : undefined,
  };
}

export function rowToEquipmentDamageReport(r: Record<string, unknown>): EquipmentDamageReport {
  const asset = r.equipment_assets as Record<string, unknown> | null;
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    reportedByEmployeeId: String(r.reported_by_employee_id),
    checkoutEventId: str(r.checkout_event_id),
    severity: r.severity as EquipmentDamageReport["severity"],
    description: String(r.description),
    photoPaths: Array.isArray(r.photo_paths) ? (r.photo_paths as string[]) : [],
    resolution: str(r.resolution),
    status: r.status as EquipmentDamageReport["status"],
    createdAt: String(r.created_at),
    asset: asset ? rowToEquipmentAsset(asset) : undefined,
  };
}

export function rowToTrainingCourse(r: Record<string, unknown>): TrainingCourse {
  return {
    id: String(r.id),
    companyId: str(r.company_id),
    name: String(r.name),
    description: str(r.description),
    courseType: r.course_type as TrainingCourse["courseType"],
    category: str(r.category),
    contentUrl: str(r.content_url),
    contentHtml: str(r.content_html),
    expirationMonths: num(r.expiration_months),
    isRequired: bool(r.is_required),
    isActive: bool(r.is_active, true),
    sortOrder: num(r.sort_order),
    passingScorePercent: num(r.passing_score_percent) ?? 80,
    maxQuizAttempts: num(r.max_quiz_attempts) ?? 3,
    requiresLessonCompletion: bool(r.requires_lesson_completion, true),
    certificateTemplateHtml: str(r.certificate_template_html),
  };
}

export function rowToTrainingLesson(r: Record<string, unknown>): TrainingLesson {
  return {
    id: String(r.id),
    courseId: String(r.course_id),
    title: String(r.title),
    overview: str(r.overview),
    objectives: Array.isArray(r.objectives) ? (r.objectives as string[]) : [],
    contentHtml: String(r.content_html ?? ""),
    imagePaths: Array.isArray(r.image_paths) ? (r.image_paths as string[]) : [],
    sortOrder: num(r.sort_order) ?? 0,
    minReadSeconds: num(r.min_read_seconds) ?? 30,
    completedAt: str(r.completed_at),
    completed: r.completed_at != null,
  };
}

export function rowToTrainingQuizQuestion(r: Record<string, unknown>): TrainingQuizQuestion {
  return {
    id: String(r.id),
    courseId: String(r.course_id),
    question: String(r.question),
    options: Array.isArray(r.options) ? (r.options as string[]) : [],
    correctIndex: Number(r.correct_index),
    explanation: str(r.explanation),
    sortOrder: num(r.sort_order) ?? 0,
  };
}

export function rowToTrainingCourseAssignment(r: Record<string, unknown>): TrainingCourseAssignment {
  return {
    id: String(r.id),
    courseId: String(r.course_id),
    employeeId: str(r.employee_id),
    employmentType: str(r.employment_type),
    employeeRole: str(r.employee_role),
    positionId: str(r.position_id),
    isRequired: bool(r.is_required, true),
    dueDate: str(r.due_date),
    renewalMonths: num(r.renewal_months),
  };
}

export function rowToTrainingCompletion(r: Record<string, unknown>): TrainingCompletion {
  const course = r.training_courses as Record<string, unknown> | null;
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    courseId: String(r.course_id),
    completedAt: String(r.completed_at),
    expiresAt: str(r.expires_at),
    score: num(r.score),
    passed: bool(r.passed, true),
    certificatePath: str(r.certificate_path),
    course: course ? rowToTrainingCourse(course) : undefined,
  };
}

export function rowToDisciplinaryAction(r: Record<string, unknown>): DisciplinaryAction {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    actionType: String(r.action_type),
    incidentDate: String(r.incident_date),
    description: String(r.description),
    correctiveAction: str(r.corrective_action),
    suspensionStart: str(r.suspension_start),
    suspensionEnd: str(r.suspension_end),
    visibleToSupervisor: bool(r.visible_to_supervisor),
    status: r.status as DisciplinaryAction["status"],
  };
}

export function rowToHrNote(r: Record<string, unknown>): HrNote {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    authorProfileId: str(r.author_profile_id),
    noteType: r.note_type as HrNote["noteType"],
    content: String(r.content),
    isPrivate: bool(r.is_private),
    visibleToSupervisor: bool(r.visible_to_supervisor),
    createdAt: String(r.created_at),
  };
}

export function rowToEmployeeKpiSnapshot(r: Record<string, unknown>): EmployeeKpiSnapshot {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    snapshotDate: String(r.snapshot_date),
    periodType: r.period_type as EmployeeKpiSnapshot["periodType"],
    jobsCompleted: Number(r.jobs_completed ?? 0),
    revenueGenerated: Number(r.revenue_generated ?? 0),
    profitGenerated: Number(r.profit_generated ?? 0),
    upsells: Number(r.upsells ?? 0),
    lateArrivals: Number(r.late_arrivals ?? 0),
    callOffs: Number(r.call_offs ?? 0),
    customerRating: num(r.customer_rating),
  };
}

export function rowToApplicationStatusHistory(r: Record<string, unknown>): ApplicationStatusHistory {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    fromStatus: str(r.from_status),
    toStatus: String(r.to_status),
    changedByProfileId: str(r.changed_by_profile_id),
    notes: str(r.notes),
    createdAt: String(r.created_at),
  };
}

export function rowToApplicationEmploymentHistory(r: Record<string, unknown>): ApplicationEmploymentHistory {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    employerName: String(r.employer_name),
    jobTitle: str(r.job_title),
    startDate: str(r.start_date),
    endDate: str(r.end_date),
    isCurrent: bool(r.is_current),
    reasonForLeaving: str(r.reason_for_leaving),
  };
}

export function rowToApplicationReference(r: Record<string, unknown>): ApplicationReference {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    name: String(r.name),
    relationship: str(r.relationship),
    phone: str(r.phone),
    email: str(r.email),
  };
}

export function rowToApplicationEducation(r: Record<string, unknown>): ApplicationEducation {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    institution: String(r.institution),
    degree: str(r.degree),
    fieldOfStudy: str(r.field_of_study),
    graduationYear: num(r.graduation_year),
  };
}

export function rowToApplicationCertification(r: Record<string, unknown>): ApplicationCertification {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    name: String(r.name),
    issuingBody: str(r.issuing_body),
    issuedAt: str(r.issued_at),
    expiresAt: str(r.expires_at),
  };
}

export function rowToDocumentTemplate(r: Record<string, unknown>): DocumentTemplate {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    documentKey: String(r.document_key),
    name: String(r.name),
    description: str(r.description),
    version: Number(r.version ?? 1),
    employmentTypes: (r.employment_types as string[]) ?? [],
    contentHtml: str(r.content_html),
    storagePath: str(r.storage_path),
    isRequired: bool(r.is_required, true),
    isActive: bool(r.is_active, true),
  };
}

export function rowToOnboardingTemplate(r: Record<string, unknown>): OnboardingTemplate {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    name: String(r.name),
    employmentType: String(r.employment_type),
    isActive: bool(r.is_active, true),
  };
}

export function rowToOnboardingTemplateItem(r: Record<string, unknown>): OnboardingTemplateItem {
  return {
    id: String(r.id),
    templateId: String(r.template_id),
    itemKey: String(r.item_key),
    label: String(r.label),
    description: str(r.description),
    isRequired: bool(r.is_required, true),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function rowToTimesheetAdjustment(r: Record<string, unknown>): TimesheetAdjustment {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    punchId: str(r.punch_id),
    originalPunchedAt: str(r.original_punched_at),
    proposedPunchedAt: String(r.proposed_punched_at),
    reason: String(r.reason),
    status: r.status as TimesheetAdjustment["status"],
    requestedByProfileId: str(r.requested_by_profile_id),
    reviewedByProfileId: str(r.reviewed_by_profile_id),
    reviewedAt: str(r.reviewed_at),
    reviewNotes: str(r.review_notes),
    createdAt: String(r.created_at),
  };
}

export function rowToEquipmentCatalogItem(r: Record<string, unknown>): EquipmentCatalogItem {
  return {
    id: String(r.id),
    itemType: String(r.item_type),
    name: String(r.name),
    sku: str(r.sku),
    description: str(r.description),
    replacementCost: num(r.replacement_cost),
    isTrackable: bool(r.is_trackable, true),
    isActive: bool(r.is_active, true),
  };
}

export function rowToSafetyIncident(r: Record<string, unknown>): SafetyIncident {
  return {
    id: String(r.id),
    employeeId: str(r.employee_id),
    truckId: str(r.truck_id),
    incidentType: String(r.incident_type),
    incidentDate: String(r.incident_date),
    location: str(r.location),
    description: String(r.description),
    severity: str(r.severity),
    workersCompClaimNumber: str(r.workers_comp_claim_number),
    claimStatus: str(r.claim_status),
    estimatedCost: num(r.estimated_cost),
  };
}

export function rowToContractor1099Yearly(r: Record<string, unknown>): Contractor1099Yearly {
  const emp = r.employees as Record<string, unknown> | null;
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    taxYear: Number(r.tax_year),
    totalCompensation: Number(r.total_compensation ?? 0),
    otherIncome: Number(r.other_income ?? 0),
    notes: str(r.notes),
    employee: emp
      ? { firstName: String(emp.first_name), lastName: String(emp.last_name) }
      : undefined,
  };
}

export function rowToPayrollExport(r: Record<string, unknown>): PayrollExport {
  return {
    id: String(r.id),
    payPeriodId: String(r.pay_period_id),
    exportFormat: r.export_format as PayrollExport["exportFormat"],
    filePath: str(r.file_path),
    fileName: str(r.file_name),
    rowCount: num(r.row_count),
    exportedByProfileId: str(r.exported_by_profile_id),
    exportedAt: String(r.exported_at),
  };
}

export function rowToPerformanceReview(r: Record<string, unknown>): PerformanceReview {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    reviewPeriodStart: String(r.review_period_start),
    reviewPeriodEnd: String(r.review_period_end),
    overallRating: num(r.overall_rating),
    managerRating: num(r.manager_rating),
    customerRating: num(r.customer_rating),
    strengths: str(r.strengths),
    improvements: str(r.improvements),
    goals: str(r.goals),
    status: r.status as PerformanceReview["status"],
  };
}

export function rowToEmployeeEmergencyContact(r: Record<string, unknown>): EmployeeEmergencyContact {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    name: String(r.name),
    relationship: str(r.relationship),
    phone: String(r.phone),
    email: str(r.email),
    isPrimary: bool(r.is_primary),
  };
}

export function rowToEmployeePayRate(r: Record<string, unknown>): EmployeePayRate {
  return {
    id: String(r.id),
    employeeId: String(r.employee_id),
    payType: String(r.pay_type),
    amount: Number(r.amount),
    commissionRate: num(r.commission_rate),
    effectiveFrom: String(r.effective_from),
    effectiveTo: str(r.effective_to),
    reason: str(r.reason),
  };
}

export function rowToDocumentSignature(r: Record<string, unknown>): DocumentSignature {
  return {
    id: String(r.id),
    employeeDocumentId: String(r.employee_document_id),
    signerProfileId: str(r.signer_profile_id),
    signerName: String(r.signer_name),
    signedAt: String(r.signed_at),
    ipAddress: str(r.ip_address),
    userAgent: str(r.user_agent),
    signatureImagePath: str(r.signature_image_path),
    pdfStoragePath: str(r.pdf_storage_path),
  };
}
