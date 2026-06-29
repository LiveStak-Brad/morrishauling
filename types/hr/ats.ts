export type ApplicantStatus =
  | "applied"
  | "phone_screen"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined"
  | "rejected"
  | "hired";

export type EmploymentType =
  | "w2_full_time"
  | "w2_part_time"
  | "1099_contractor"
  | "seasonal"
  | "temporary"
  | "office_staff";

export type JobPostingStatus = "draft" | "published" | "closed" | "archived";

export type HiringMode =
  | "active_hiring"
  | "accepting_interest"
  | "future_opening"
  | "hiring_soon"
  | "hidden";

export type CareerCategory =
  | "field_operations"
  | "dispatch_office"
  | "business_growth"
  | "future_specialty";

export type ApplicationType = "standard" | "talent_pool" | "general_interest";

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Position {
  id: string;
  companyId: string;
  departmentId?: string;
  title: string;
  description?: string;
  isActive: boolean;
}

export interface JobPosting {
  id: string;
  companyId: string;
  positionId?: string;
  departmentId?: string;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  niceToHave?: string;
  growthPath?: string;
  employmentType: EmploymentType;
  payRangeMin?: number;
  payRangeMax?: number;
  payRangeUnit: "hourly" | "salary" | "annual";
  payNote?: string;
  location?: string;
  schedule?: string;
  category?: CareerCategory;
  departmentLabel?: string;
  hiringMode?: HiringMode;
  isReferenceTemplate?: boolean;
  sortOrder?: number;
  isRemote: boolean;
  status: JobPostingStatus;
  publishedAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: ApplicantStatus;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  militaryStatus?: string;
  desiredPay?: number;
  availability?: string;
  transportation?: string;
  canLift100lbs?: boolean;
  canDriveTrucks?: boolean;
  hasCdl?: boolean;
  hasDotMedical?: boolean;
  hasDriversLicense?: boolean;
  hasReliableTransportation?: boolean;
  experienceSummary?: string;
  whyMorris?: string;
  employmentTypePreference?: EmploymentType;
  drugTestConsent: boolean;
  backgroundCheckConsent: boolean;
  convertedEmployeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  companyId: string;
  applicantId: string;
  jobPostingId: string;
  status: ApplicantStatus;
  coverLetter?: string;
  statusToken?: string;
  source?: string;
  applicationType?: ApplicationType;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  applicant?: Applicant;
  jobPosting?: JobPosting;
}

export interface ApplicationEmploymentHistory {
  id: string;
  applicationId: string;
  employerName: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  reasonForLeaving?: string;
}

export interface ApplicationReference {
  id: string;
  applicationId: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export interface ApplicationEducation {
  id: string;
  applicationId: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

export interface ApplicationCertification {
  id: string;
  applicationId: string;
  name: string;
  issuingBody?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface InterviewNote {
  id: string;
  companyId: string;
  applicationId: string;
  authorProfileId?: string;
  noteType: "phone_screen" | "interview" | "reference_check" | "offer" | "general";
  content: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  fromStatus?: string;
  toStatus: string;
  changedByProfileId?: string;
  notes?: string;
  createdAt: string;
}

export interface ApplicationDetail {
  application: Application;
  statusHistory: ApplicationStatusHistory[];
  interviewNotes: InterviewNote[];
  employmentHistory?: ApplicationEmploymentHistory[];
  references?: ApplicationReference[];
  education?: ApplicationEducation[];
  certifications?: ApplicationCertification[];
}

export interface ApplicationSubmitPayload {
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  militaryStatus?: string;
  desiredPay?: number;
  availability?: string;
  transportation?: string;
  canLift100lbs?: boolean;
  canDriveTrucks?: boolean;
  hasCdl?: boolean;
  hasDotMedical?: boolean;
  hasDriversLicense?: boolean;
  hasReliableTransportation?: boolean;
  experienceSummary?: string;
  whyMorris?: string;
  employmentTypePreference?: EmploymentType;
  drugTestConsent: boolean;
  backgroundCheckConsent: boolean;
  coverLetter?: string;
  source?: string;
  employmentHistory?: Omit<ApplicationEmploymentHistory, "id" | "applicationId">[];
  references?: Omit<ApplicationReference, "id" | "applicationId">[];
  education?: Omit<ApplicationEducation, "id" | "applicationId">[];
  certifications?: Omit<ApplicationCertification, "id" | "applicationId">[];
}
