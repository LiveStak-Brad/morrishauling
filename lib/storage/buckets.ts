export const STORAGE_BUCKETS = {
  jobPhotos: "job-photos",
  employeeDocuments: "employee-documents",
  applicantDocuments: "applicant-documents",
  hrDocuments: "hr-documents",
  invoicePdfs: "invoice-pdfs",
  disposalReceipts: "disposal-receipts",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
