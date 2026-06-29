export type DocumentStatus = "pending" | "signed" | "declined" | "expired";

export type EmployeeUploadType = "drivers_license" | "certification" | "other";
export type EmployeeUploadStatus = "pending_review" | "approved" | "rejected" | "superseded";
export type ApplicantDocumentType = "resume" | "drivers_license" | "certification" | "supporting";

export interface DocumentTemplate {
  id: string;
  companyId: string;
  documentKey: string;
  name: string;
  description?: string;
  version: number;
  employmentTypes: string[];
  contentHtml?: string;
  storagePath?: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface EmployeeDocument {
  id: string;
  companyId: string;
  employeeId: string;
  templateId?: string;
  documentKey: string;
  name: string;
  version: number;
  status: DocumentStatus;
  storagePath?: string;
  assignedAt: string;
  completedAt?: string;
  contentHtml?: string;
  signedUrl?: string;
  signatures?: DocumentSignature[];
}

export interface EmployeeDocumentUpload {
  id: string;
  companyId: string;
  employeeId: string;
  documentType: EmployeeUploadType;
  label: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  status: EmployeeUploadStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  version: number;
  createdAt: string;
  signedUrl?: string;
}

export interface ApplicantDocument {
  id: string;
  companyId: string;
  applicantId: string;
  applicationId?: string;
  documentType: ApplicantDocumentType;
  originalFilename?: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  createdAt: string;
  signedUrl?: string;
}

export interface DocumentAuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  notes?: string;
  actorProfileId?: string;
  createdAt: string;
}

export interface DocumentSignature {
  id: string;
  employeeDocumentId: string;
  signerProfileId?: string;
  signerName: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  signatureImagePath?: string;
  pdfStoragePath?: string;
}

export interface SignDocumentPayload {
  signerName: string;
  signatureDataUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}
