// First-class estimate / invoice / payment workflow types

export type EstimateWorkflowStatus =
  | "draft"
  | "internal_review"
  | "ready_to_send"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired"
  | "revised"
  | "converted"
  | "canceled";

export type DeliveryStatus = "not_sent" | "pending" | "delivered" | "failed" | "skipped";

export type InvoiceWorkflowStatus =
  | "draft"
  | "ready_to_send"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void"
  | "refunded"
  | "disputed"
  | "written_off"
  | "partial"; // legacy

export type AcceptanceMethod =
  | "customer_portal"
  | "phone"
  | "email"
  | "in_person"
  | "text"
  | "other";

export interface BillingLineItem {
  id: string;
  label: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?:
    | "service"
    | "travel"
    | "labor"
    | "disposal"
    | "equipment"
    | "access"
    | "discount"
    | "tax"
    | "custom"
    | "adjustment";
  taxable?: boolean;
  internal?: boolean;
  sortOrder?: number;
}

export interface EstimateRecord {
  id: string;
  companyId: string;
  jobId: string | null;
  customerId: string | null;
  divisionId?: string | null;
  estimateNumber: string;
  status: EstimateWorkflowStatus;
  currentVersion: number;
  parentEstimateId?: string | null;
  serviceAddress: Record<string, unknown>;
  lineItems: BillingLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  estimatedTotal: number;
  internalCostBreakdown?: unknown[];
  estimatedProfit?: number | null;
  estimatedMargin?: number | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  photos?: unknown[];
  expiresAt?: string | null;
  scheduledServiceDate?: string | null;
  sentAt?: string | null;
  viewedAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  convertedAt?: string | null;
  canceledAt?: string | null;
  acceptanceMethod?: AcceptanceMethod | string | null;
  acceptedBy?: string | null;
  acceptanceNote?: string | null;
  customerApprovedAt?: string | null;
  internalApprovedAt?: string | null;
  internalApprovedBy?: string | null;
  internalApprovalNote?: string | null;
  isCurrent?: boolean;
  requestKey?: string | null;
  deletedAt?: string | null;
  deliveryStatus: DeliveryStatus;
  deliveryError?: string | null;
  lastResentAt?: string | null;
  shareTokenHash?: string | null;
  shareTokenExpiresAt?: string | null;
  revisionReason?: string | null;
  active: boolean;
  reviewStatus?: string | null;
  estimateType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateVersionRecord {
  id: string;
  companyId: string;
  estimateId: string;
  versionNumber: number;
  createdByProfileId?: string | null;
  previousTotal: number;
  newTotal: number;
  lineItems: BillingLineItem[];
  changedLineItems: BillingLineItem[];
  revisionReason?: string | null;
  customerNotificationStatus: DeliveryStatus;
  customerAcceptanceStatus: "pending" | "accepted" | "declined" | "superseded";
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface EstimateAdjustmentRecord {
  id: string;
  companyId: string;
  estimateId: string;
  jobId?: string | null;
  status: "draft" | "pending_approval" | "approved" | "declined" | "canceled";
  originalTotal: number;
  adjustmentTotal: number;
  newTotal: number;
  addedLineItems: BillingLineItem[];
  removedLineItemIds: string[];
  reason: string;
  createdByProfileId?: string | null;
  approvedAt?: string | null;
  approvalMethod?: AcceptanceMethod | string | null;
  approvedBy?: string | null;
  approvalNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAuditEvent {
  id: string;
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorProfileId?: string | null;
  actorRole?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const ESTIMATE_STATUS_LABELS: Record<EstimateWorkflowStatus, string> = {
  draft: "Draft",
  internal_review: "Needs Approval",
  ready_to_send: "Needs Approval",
  sent: "Waiting on Customer",
  viewed: "Waiting on Customer",
  accepted: "Agreed",
  declined: "Declined",
  expired: "Expired",
  revised: "Needs Approval",
  converted: "Agreed",
  canceled: "Canceled",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceWorkflowStatus, string> = {
  draft: "Draft",
  ready_to_send: "Ready to Send",
  sent: "Sent",
  viewed: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  refunded: "Refunded",
  disputed: "Disputed",
  written_off: "Written Off",
  partial: "Partially Paid",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  not_sent: "Not sent",
  pending: "Pending delivery",
  delivered: "Delivered",
  failed: "Delivery failed",
  skipped: "Delivery unavailable",
};
