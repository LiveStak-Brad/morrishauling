import { createAdminClient } from "@/lib/supabase/admin";
import { isDbReady } from "@/lib/db/operations";
import { logActivity } from "@/lib/db/activity";
import {
  billingId,
  createShareToken,
  customerFacingLines,
  diffLineItems,
  estimateNumber,
  hashShareToken,
  invoiceNumber,
  isEmailDeliveryConfigured,
  normalizeLineItem,
  receiptNumber,
  sumCustomerFacingLines,
} from "@/lib/billing/utils";
import type {
  BillingAuditEvent,
  BillingLineItem,
  DeliveryStatus,
  EstimateAdjustmentRecord,
  EstimateRecord,
  EstimateVersionRecord,
  EstimateWorkflowStatus,
  AcceptanceMethod,
} from "@/types/billing";
import type { Invoice, Payment } from "@/types/payment";

async function sb() {
  const client = createAdminClient();
  if (!client) throw new Error("Database unavailable");
  return client;
}

function rowToEstimate(row: Record<string, unknown>): EstimateRecord {
  const rawLines = (row.line_items as BillingLineItem[]) ?? [];
  const pricing = (row.pricing_breakdown as Array<{ id?: string; label?: string; amount?: number }>) ?? [];
  const estimatedTotal = Number(row.estimated_total ?? 0);
  const rawSum = rawLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const usePricingFallback =
    pricing.length > 0 &&
    (rawLines.length === 0 ||
      (Math.abs(rawSum) < 0.01 && estimatedTotal > 0) ||
      (rawLines.length === 1 &&
        /^(custom item|line item)$/i.test(String(rawLines[0]?.label ?? "").trim()) &&
        (Number(rawLines[0]?.amount) || 0) === 0 &&
        estimatedTotal > 0));

  const resolvedLines = usePricingFallback
    ? pricing.map((p, i) =>
        normalizeLineItem(
          {
            id: p.id ?? `legacy-${i}`,
            label: p.label ?? "Line item",
            unitPrice: p.amount ?? 0,
            quantity: 1,
            amount: p.amount ?? 0,
            category: "service",
          },
          i
        )
      )
    : rawLines;

  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: (row.job_id as string) ?? null,
    customerId: (row.customer_id as string) ?? null,
    divisionId: (row.division_id as string) ?? null,
    estimateNumber: row.estimate_number as string,
    status: row.status as EstimateWorkflowStatus,
    currentVersion: Number(row.current_version ?? 1),
    parentEstimateId: (row.parent_estimate_id as string) ?? null,
    serviceAddress: (row.service_address as Record<string, unknown>) ?? {},
    lineItems: resolvedLines,
    subtotal: Number(row.base_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    estimatedTotal,
    internalCostBreakdown: (row.internal_cost_breakdown as unknown[]) ?? [],
    estimatedProfit: row.estimated_profit != null ? Number(row.estimated_profit) : null,
    estimatedMargin: row.estimated_margin != null ? Number(row.estimated_margin) : null,
    customerNotes: (row.customer_notes as string) ?? null,
    internalNotes: (row.internal_notes as string) ?? null,
    photos: (row.photos as unknown[]) ?? [],
    expiresAt: (row.expires_at as string) ?? null,
    scheduledServiceDate: (row.scheduled_service_date as string) ?? null,
    sentAt: (row.sent_at as string) ?? null,
    viewedAt: (row.viewed_at as string) ?? null,
    acceptedAt: (row.accepted_at as string) ?? null,
    declinedAt: (row.declined_at as string) ?? null,
    convertedAt: (row.converted_at as string) ?? null,
    canceledAt: (row.canceled_at as string) ?? null,
    acceptanceMethod: (row.acceptance_method as string) ?? null,
    acceptedBy: (row.accepted_by as string) ?? null,
    acceptanceNote: (row.acceptance_note as string) ?? null,
    customerApprovedAt: (row.customer_approved_at as string) ?? (row.accepted_at as string) ?? null,
    internalApprovedAt: (row.internal_approved_at as string) ?? null,
    internalApprovedBy: (row.internal_approved_by as string) ?? null,
    internalApprovalNote: (row.internal_approval_note as string) ?? null,
    isCurrent: row.is_current !== false,
    requestKey: (row.request_key as string) ?? null,
    deletedAt: (row.deleted_at as string) ?? null,
    deliveryStatus: (row.delivery_status as DeliveryStatus) ?? "not_sent",
    deliveryError: (row.delivery_error as string) ?? null,
    lastResentAt: (row.last_resent_at as string) ?? null,
    shareTokenHash: (row.share_token_hash as string) ?? null,
    shareTokenExpiresAt: (row.share_token_expires_at as string) ?? null,
    revisionReason: (row.revision_reason as string) ?? null,
    active: row.active !== false,
    reviewStatus: (row.review_status as string) ?? null,
    estimateType: (row.estimate_type as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function estimateToRow(e: EstimateRecord): Record<string, unknown> {
  return {
    id: e.id,
    company_id: e.companyId,
    job_id: e.jobId,
    customer_id: e.customerId,
    division_id: e.divisionId ?? null,
    estimate_number: e.estimateNumber,
    status: e.status,
    current_version: e.currentVersion,
    parent_estimate_id: e.parentEstimateId ?? null,
    service_address: e.serviceAddress ?? {},
    line_items: e.lineItems,
    base_amount: e.subtotal,
    discount_amount: e.discountAmount,
    tax_amount: e.taxAmount,
    estimated_total: e.estimatedTotal,
    adjustments_total: e.discountAmount,
    internal_cost_breakdown: e.internalCostBreakdown ?? [],
    estimated_profit: e.estimatedProfit ?? null,
    estimated_margin: e.estimatedMargin ?? null,
    customer_notes: e.customerNotes ?? null,
    internal_notes: e.internalNotes ?? null,
    photos: e.photos ?? [],
    expires_at: e.expiresAt ?? null,
    scheduled_service_date: e.scheduledServiceDate ?? null,
    sent_at: e.sentAt ?? null,
    viewed_at: e.viewedAt ?? null,
    accepted_at: e.acceptedAt ?? null,
    declined_at: e.declinedAt ?? null,
    converted_at: e.convertedAt ?? null,
    canceled_at: e.canceledAt ?? null,
    acceptance_method: e.acceptanceMethod ?? null,
    accepted_by: e.acceptedBy ?? null,
    acceptance_note: e.acceptanceNote ?? null,
    customer_approved_at: e.customerApprovedAt ?? e.acceptedAt ?? null,
    internal_approved_at: e.internalApprovedAt ?? null,
    internal_approved_by: e.internalApprovedBy ?? null,
    internal_approval_note: e.internalApprovalNote ?? null,
    is_current: e.isCurrent !== false,
    request_key: e.requestKey ?? null,
    deleted_at: e.deletedAt ?? null,
    delivery_status: e.deliveryStatus,
    delivery_error: e.deliveryError ?? null,
    last_resent_at: e.lastResentAt ?? null,
    share_token_hash: e.shareTokenHash ?? null,
    share_token_expires_at: e.shareTokenExpiresAt ?? null,
    revision_reason: e.revisionReason ?? null,
    active: e.active,
    review_status: e.reviewStatus ?? null,
    estimate_type: e.estimateType ?? null,
    pricing_breakdown: customerFacingLines(e.lineItems).map((l) => ({
      id: l.id,
      label: l.label,
      amount: l.amount,
    })),
    updated_at: new Date().toISOString(),
  };
}

export async function logBillingAudit(input: {
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
}): Promise<void> {
  const event: BillingAuditEvent = {
    id: billingId("bae"),
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorProfileId: input.actorProfileId,
    actorRole: input.actorRole,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason,
    metadata: input.metadata ?? {},
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    createdAt: new Date().toISOString(),
  };

  await logActivity({
    companyId: input.companyId,
    actorProfileId: input.actorProfileId ?? undefined,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    message: `${input.entityType} ${input.action}`,
    metadata: {
      reason: input.reason,
      ...(input.metadata ?? {}),
      oldValue: input.oldValue,
      newValue: input.newValue,
    },
  });

  if (!(await isDbReady())) return;
  const client = await sb();
  await client.from("billing_audit_events").insert({
    id: event.id,
    company_id: event.companyId,
    entity_type: event.entityType,
    entity_id: event.entityId,
    action: event.action,
    actor_profile_id: event.actorProfileId ?? null,
    actor_role: event.actorRole ?? null,
    old_value: event.oldValue ?? null,
    new_value: event.newValue ?? null,
    reason: event.reason ?? null,
    metadata: event.metadata ?? {},
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
    created_at: event.createdAt,
  });
}

export async function listEstimates(companyId: string): Promise<EstimateRecord[]> {
  if (!(await isDbReady())) return [];
  const client = await sb();
  const { data, error } = await client
    .from("estimates")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map((r) => rowToEstimate(r as Record<string, unknown>));
  const { filterEstimates } = await import("@/lib/data/real-record-filter");
  return filterEstimates(rows);
}

export async function getEstimateById(
  companyId: string,
  estimateId: string
): Promise<EstimateRecord | null> {
  if (!(await isDbReady())) return null;
  const client = await sb();
  const { data, error } = await client
    .from("estimates")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", estimateId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEstimate(data as Record<string, unknown>) : null;
}

export async function getEstimateByShareToken(token: string): Promise<EstimateRecord | null> {
  if (!(await isDbReady())) return null;
  const client = await sb();
  const { data, error } = await client
    .from("estimates")
    .select("*")
    .eq("share_token_hash", hashShareToken(token))
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const estimate = rowToEstimate(data as Record<string, unknown>);
  if (estimate.shareTokenExpiresAt && estimate.shareTokenExpiresAt < new Date().toISOString()) {
    return null;
  }
  return estimate;
}

export async function getBillingAudit(
  companyId: string,
  entityType: string,
  entityId: string
): Promise<BillingAuditEvent[]> {
  if (!(await isDbReady())) return [];
  const client = await sb();
  const { data, error } = await client
    .from("billing_audit_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    entityType: r.entity_type as string,
    entityId: r.entity_id as string,
    action: r.action as string,
    actorProfileId: r.actor_profile_id as string | null,
    actorRole: r.actor_role as string | null,
    oldValue: r.old_value,
    newValue: r.new_value,
    reason: r.reason as string | null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    ipAddress: r.ip_address as string | null,
    userAgent: r.user_agent as string | null,
    createdAt: r.created_at as string,
  }));
}

export async function listEstimateVersions(
  companyId: string,
  estimateId: string
): Promise<EstimateVersionRecord[]> {
  if (!(await isDbReady())) return [];
  const client = await sb();
  const { data, error } = await client
    .from("estimate_versions")
    .select("*")
    .eq("company_id", companyId)
    .eq("estimate_id", estimateId)
    .order("version_number", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    estimateId: r.estimate_id as string,
    versionNumber: Number(r.version_number),
    createdByProfileId: r.created_by_profile_id as string | null,
    previousTotal: Number(r.previous_total),
    newTotal: Number(r.new_total),
    lineItems: (r.line_items as BillingLineItem[]) ?? [],
    changedLineItems: (r.changed_line_items as BillingLineItem[]) ?? [],
    revisionReason: r.revision_reason as string | null,
    customerNotificationStatus: r.customer_notification_status as DeliveryStatus,
    customerAcceptanceStatus: r.customer_acceptance_status as EstimateVersionRecord["customerAcceptanceStatus"],
    snapshot: (r.snapshot as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }));
}

async function saveVersionSnapshot(
  estimate: EstimateRecord,
  previous: EstimateRecord,
  actorProfileId?: string | null,
  reason?: string
): Promise<EstimateVersionRecord> {
  const version: EstimateVersionRecord = {
    id: billingId("estv"),
    companyId: estimate.companyId,
    estimateId: estimate.id,
    versionNumber: estimate.currentVersion,
    createdByProfileId: actorProfileId,
    previousTotal: previous.estimatedTotal,
    newTotal: estimate.estimatedTotal,
    lineItems: estimate.lineItems,
    changedLineItems: diffLineItems(previous.lineItems, estimate.lineItems),
    revisionReason: reason ?? estimate.revisionReason,
    customerNotificationStatus: "not_sent",
    customerAcceptanceStatus: "pending",
    snapshot: { ...estimate },
    createdAt: new Date().toISOString(),
  };
  const client = await sb();
  await client.from("estimate_versions").insert({
    id: version.id,
    company_id: version.companyId,
    estimate_id: version.estimateId,
    version_number: version.versionNumber,
    created_by_profile_id: version.createdByProfileId ?? null,
    previous_total: version.previousTotal,
    new_total: version.newTotal,
    line_items: version.lineItems,
    changed_line_items: version.changedLineItems,
    revision_reason: version.revisionReason ?? null,
    customer_notification_status: version.customerNotificationStatus,
    customer_acceptance_status: version.customerAcceptanceStatus,
    snapshot: version.snapshot,
    created_at: version.createdAt,
  });
  return version;
}

export async function createEstimate(
  companyId: string,
  input: {
    customerId: string;
    jobId?: string | null;
    divisionId?: string | null;
    serviceAddress?: Record<string, unknown>;
    lineItems: Array<Partial<BillingLineItem> & { label: string; unitPrice: number }>;
    discountAmount?: number;
    taxAmount?: number;
    customerNotes?: string;
    internalNotes?: string;
    expiresAt?: string;
    scheduledServiceDate?: string;
    estimateType?: string;
    status?: EstimateWorkflowStatus;
  },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<EstimateRecord> {
  if (!(await isDbReady())) throw new Error("Database unavailable");
  const lines = input.lineItems.map((l, i) => normalizeLineItem(l, i));
  const subtotal = sumCustomerFacingLines(lines);
  const discountAmount = input.discountAmount ?? 0;
  const taxAmount = input.taxAmount ?? 0;
  const estimatedTotal = Math.max(0, subtotal - discountAmount + taxAmount);
  const now = new Date().toISOString();

  const estimate: EstimateRecord = {
    id: billingId("est"),
    companyId,
    jobId: input.jobId ?? null,
    customerId: input.customerId,
    divisionId: input.divisionId ?? "junk_removal",
    estimateNumber: estimateNumber(),
    status: input.status ?? "draft",
    currentVersion: 1,
    serviceAddress: input.serviceAddress ?? {},
    lineItems: lines,
    subtotal,
    discountAmount,
    taxAmount,
    estimatedTotal,
    customerNotes: input.customerNotes ?? null,
    internalNotes: input.internalNotes ?? null,
    photos: [],
    expiresAt: input.expiresAt ?? null,
    scheduledServiceDate: input.scheduledServiceDate ?? null,
    deliveryStatus: "not_sent",
    active: true,
    estimateType: input.estimateType ?? "junk_removal",
    createdAt: now,
    updatedAt: now,
  };

  const client = await sb();
  const { error } = await client.from("estimates").insert({
    ...estimateToRow(estimate),
    created_at: now,
  });
  if (error) throw error;

  await saveVersionSnapshot(estimate, { ...estimate, estimatedTotal: 0, lineItems: [] }, options?.actorProfileId, "Initial draft");
  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimate.id,
    action: "estimate_created",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    newValue: { total: estimate.estimatedTotal, status: estimate.status },
  });

  return estimate;
}

export async function updateEstimate(
  companyId: string,
  estimateId: string,
  updates: Partial<{
    lineItems: BillingLineItem[];
    discountAmount: number;
    taxAmount: number;
    customerNotes: string | null;
    internalNotes: string | null;
    expiresAt: string | null;
    scheduledServiceDate: string | null;
    serviceAddress: Record<string, unknown>;
    status: EstimateWorkflowStatus;
    revisionReason: string;
    photos: unknown[];
  }>,
  options?: { actorProfileId?: string; actorRole?: string; forceRevision?: boolean }
): Promise<EstimateRecord> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  if (existing.deletedAt) throw new Error("Estimate was deleted");
  if (["converted", "canceled"].includes(existing.status) && !updates.status) {
    throw new Error("Cannot edit a final agreed estimate. Create an authorized correction if needed.");
  }

  const lines = updates.lineItems
    ? updates.lineItems.map((l, i) => normalizeLineItem(l, i))
    : existing.lineItems;
  const discountAmount = updates.discountAmount ?? existing.discountAmount;
  const taxAmount = updates.taxAmount ?? existing.taxAmount;
  const subtotal = sumCustomerFacingLines(lines);
  const estimatedTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // One visible estimate: edit in place. Audit history only — do not spawn duplicate records.
  // Optional internal version snapshot when owner explicitly forces a revision after send.
  const shouldSnapshot =
    options?.forceRevision === true &&
    ["sent", "viewed", "revised"].includes(existing.status) &&
    estimatedTotal !== existing.estimatedTotal;

  let nextStatus = updates.status ?? existing.status;
  // Keep customer-facing status simple: after send, stay "sent"/"viewed" until decision
  if (!updates.status && nextStatus === "revised") nextStatus = "sent";

  const next: EstimateRecord = {
    ...existing,
    lineItems: lines,
    discountAmount,
    taxAmount,
    subtotal,
    estimatedTotal,
    customerNotes: updates.customerNotes !== undefined ? updates.customerNotes : existing.customerNotes,
    internalNotes: updates.internalNotes !== undefined ? updates.internalNotes : existing.internalNotes,
    expiresAt: updates.expiresAt !== undefined ? updates.expiresAt : existing.expiresAt,
    scheduledServiceDate:
      updates.scheduledServiceDate !== undefined
        ? updates.scheduledServiceDate
        : existing.scheduledServiceDate,
    serviceAddress: updates.serviceAddress ?? existing.serviceAddress,
    photos: updates.photos ?? existing.photos,
    revisionReason: updates.revisionReason ?? existing.revisionReason,
    status: nextStatus,
    currentVersion: shouldSnapshot ? existing.currentVersion + 1 : existing.currentVersion,
    isCurrent: true,
    updatedAt: new Date().toISOString(),
  };

  const client = await sb();
  const { error } = await client.from("estimates").upsert(estimateToRow(next));
  if (error) throw error;

  if (shouldSnapshot) {
    await saveVersionSnapshot(next, existing, options?.actorProfileId, updates.revisionReason);
  }

  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: "estimate_edited",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    oldValue: { total: existing.estimatedTotal, status: existing.status },
    newValue: { total: next.estimatedTotal, status: next.status },
    reason: updates.revisionReason,
  });

  return next;
}

export async function recordInternalApproval(
  companyId: string,
  estimateId: string,
  input: { approvedBy: string; note?: string },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<{ estimate: EstimateRecord; jobId?: string; finalized: boolean }> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  if (!existing.customerId) throw new Error("Estimate must belong to a customer");

  // Idempotent: already converted — do not rewrite status or create another job.
  if (existing.status === "converted" && existing.jobId) {
    return { estimate: existing, jobId: existing.jobId, finalized: true };
  }
  if (["canceled", "expired"].includes(existing.status)) {
    throw new Error(`Cannot approve a ${existing.status} estimate`);
  }

  // Already internally approved — just try finalize (customer may have accepted since).
  if (existing.internalApprovedAt) {
    return tryFinalizeEstimate(companyId, estimateId, options);
  }

  const now = new Date().toISOString();
  const next: EstimateRecord = {
    ...existing,
    internalApprovedAt: now,
    internalApprovedBy: input.approvedBy,
    internalApprovalNote: input.note ?? null,
    status:
      existing.status === "draft" || existing.status === "internal_review"
        ? "ready_to_send"
        : existing.status,
    updatedAt: now,
  };
  const client = await sb();
  await client.from("estimates").upsert(estimateToRow(next));
  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: "estimate_internal_approved",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    reason: input.note,
    newValue: { approvedBy: input.approvedBy },
  });

  return tryFinalizeEstimate(companyId, estimateId, options);
}

export async function deleteEstimate(
  companyId: string,
  estimateId: string,
  input: { reason?: string; isOwner?: boolean },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<void> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");

  let jobStatus: string | null = null;
  if (existing.jobId) {
    const { getJobById } = await import("@/lib/db/operations");
    const job = await getJobById(companyId, existing.jobId);
    jobStatus = job?.status ?? null;
  }

  const { canDeleteEstimate } = await import("@/lib/billing/workflow");
  const gate = canDeleteEstimate({
    status: existing.status,
    jobId: existing.jobId,
    jobStatus,
    isOwner: input.isOwner,
  });
  if (!gate.ok) throw new Error(gate.reason);
  if (existing.status === "converted" && input.isOwner && !input.reason?.trim()) {
    throw new Error("Owner correction requires a deletion reason");
  }

  const now = new Date().toISOString();
  const client = await sb();
  await client
    .from("estimates")
    .update({
      deleted_at: now,
      deleted_by_profile_id: options?.actorProfileId ?? null,
      deletion_reason: input.reason ?? null,
      active: false,
      is_current: false,
      updated_at: now,
    })
    .eq("id", estimateId)
    .eq("company_id", companyId);

  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: "estimate_deleted",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    reason: input.reason,
  });
}

/** When customer + internal approvals both exist, lock terms and create the job. */
export async function tryFinalizeEstimate(
  companyId: string,
  estimateId: string,
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<{ estimate: EstimateRecord; jobId?: string; finalized: boolean }> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");

  const { bothApprovalsPresent } = await import("@/lib/billing/workflow");
  if (
    !bothApprovalsPresent({
      customerApprovedAt: existing.customerApprovedAt,
      acceptedAt: existing.acceptedAt,
      internalApprovedAt: existing.internalApprovedAt,
    })
  ) {
    return { estimate: existing, finalized: false };
  }

  if (existing.jobId) {
    if (existing.status !== "converted") {
      // Heal status if job already linked
      const healed = { ...existing, status: "converted" as const, convertedAt: existing.convertedAt ?? new Date().toISOString() };
      const client = await sb();
      await client.from("estimates").upsert(estimateToRow(healed));
      return { estimate: healed, jobId: existing.jobId, finalized: true };
    }
    return { estimate: existing, jobId: existing.jobId, finalized: true };
  }

  const result = await convertEstimateToJob(companyId, estimateId, undefined, options);
  return { estimate: result.estimate, jobId: result.jobId, finalized: true };
}

export async function duplicateEstimate(
  companyId: string,
  estimateId: string,
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<EstimateRecord> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  return createEstimate(
    companyId,
    {
      customerId: existing.customerId!,
      jobId: null,
      divisionId: existing.divisionId,
      serviceAddress: existing.serviceAddress,
      lineItems: existing.lineItems.map(({ id: _id, ...rest }) => rest),
      discountAmount: existing.discountAmount,
      taxAmount: existing.taxAmount,
      customerNotes: existing.customerNotes ?? undefined,
      internalNotes: `Duplicated from ${existing.estimateNumber}`,
      estimateType: existing.estimateType ?? undefined,
      status: "draft",
    },
    options
  );
}

async function ensureShareToken(estimate: EstimateRecord): Promise<{ estimate: EstimateRecord; token: string }> {
  const created = createShareToken();
  const next = {
    ...estimate,
    shareTokenHash: created.hash,
    shareTokenExpiresAt: created.expiresAt,
    updatedAt: new Date().toISOString(),
  };
  const client = await sb();
  await client.from("estimates").upsert(estimateToRow(next));
  return { estimate: next, token: created.token };
}

export async function sendEstimate(
  companyId: string,
  estimateId: string,
  options?: { actorProfileId?: string; actorRole?: string; resend?: boolean }
): Promise<{ estimate: EstimateRecord; customerUrl: string; deliveryStatus: DeliveryStatus; deliveryMessage: string }> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  if (["canceled", "converted"].includes(existing.status)) {
    throw new Error(`Cannot send a ${existing.status} estimate`);
  }

  const { estimate: withToken, token } = await ensureShareToken(existing);
  const emailConfigured = isEmailDeliveryConfigured();
  const deliveryStatus: DeliveryStatus = emailConfigured ? "pending" : "skipped";
  const deliveryError = emailConfigured
    ? null
    : "Email delivery is not configured. Copy the customer link to share manually.";

  const now = new Date().toISOString();
  const next: EstimateRecord = {
    ...withToken,
    status: existing.status === "accepted" ? existing.status : "sent",
    sentAt: existing.sentAt ?? now,
    lastResentAt: options?.resend ? now : existing.lastResentAt,
    deliveryStatus,
    deliveryError,
    updatedAt: now,
  };

  const client = await sb();
  await client.from("estimates").upsert(estimateToRow(next));

  const { enqueueNotification } = await import("@/lib/notifications/enqueue");
  await enqueueNotification({
    companyId,
    divisionId: (next.divisionId as "junk_removal" | "hauling") ?? "junk_removal",
    jobId: next.jobId ?? undefined,
    customerId: next.customerId,
    profileId: options?.actorProfileId,
    eventType: options?.resend || existing.status === "revised" ? "estimate_revised" : "estimate_ready",
    payload: { estimateId: next.id, deliveryStatus },
    channel: emailConfigured ? "email" : "in_app",
  });

  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: options?.resend ? "estimate_resent" : "estimate_sent",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    newValue: { status: next.status, deliveryStatus },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return {
    estimate: next,
    customerUrl: `${base}/e/${token}`,
    deliveryStatus,
    deliveryMessage: deliveryError ?? "Estimate queued for delivery.",
  };
}

export async function recordEstimateDecision(
  companyId: string,
  estimateId: string,
  input: {
    decision: "accepted" | "declined" | "clarification";
    method: AcceptanceMethod | string;
    acceptedBy: string;
    note?: string;
  },
  options?: { actorProfileId?: string; actorRole?: string; ipAddress?: string; userAgent?: string }
): Promise<EstimateRecord> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  if (!existing.customerId) throw new Error("Estimate must belong to a customer");

  // Idempotent: already converted — never downgrade status or spawn another job.
  if (existing.status === "converted" && existing.jobId) {
    return existing;
  }
  if (["canceled", "expired"].includes(existing.status)) {
    throw new Error(`Cannot record a decision on a ${existing.status} estimate`);
  }

  // Already accepted — just ensure finalize runs once.
  if (
    input.decision === "accepted" &&
    (existing.customerApprovedAt || existing.acceptedAt) &&
    existing.status === "accepted"
  ) {
    const finalized = await tryFinalizeEstimate(companyId, estimateId, options);
    return finalized.estimate;
  }

  const now = new Date().toISOString();

  if (input.decision === "clarification") {
    const client = await sb();
    await client
      .from("estimates")
      .update({ status: "internal_review", updated_at: now })
      .eq("id", estimateId);
    await logBillingAudit({
      companyId,
      entityType: "estimate",
      entityId: estimateId,
      action: "clarification_requested",
      actorProfileId: options?.actorProfileId,
      actorRole: options?.actorRole,
      reason: input.note,
      metadata: { method: input.method, by: input.acceptedBy },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
    return { ...existing, status: "internal_review", updatedAt: now };
  }

  if (input.decision === "declined") {
    const next: EstimateRecord = {
      ...existing,
      status: "declined",
      declinedAt: now,
      acceptanceMethod: input.method,
      acceptedBy: input.acceptedBy,
      acceptanceNote: input.note ?? null,
      updatedAt: now,
    };
    const client = await sb();
    await client.from("estimates").upsert(estimateToRow(next));
    await logBillingAudit({
      companyId,
      entityType: "estimate",
      entityId: estimateId,
      action: "estimate_declined",
      actorProfileId: options?.actorProfileId,
      actorRole: options?.actorRole,
      reason: input.note,
      newValue: { method: input.method, by: input.acceptedBy },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
    return next;
  }

  // Customer acceptance
  const next: EstimateRecord = {
    ...existing,
    status: "accepted",
    acceptedAt: now,
    customerApprovedAt: now,
    acceptanceMethod: input.method,
    acceptedBy: input.acceptedBy,
    acceptanceNote: input.note ?? null,
    updatedAt: now,
  };
  const client = await sb();
  await client.from("estimates").upsert(estimateToRow(next));

  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: "estimate_accepted",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    reason: input.note,
    newValue: { method: input.method, by: input.acceptedBy, status: next.status },
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });

  const { enqueueNotification } = await import("@/lib/notifications/enqueue");
  await enqueueNotification({
    companyId,
    jobId: next.jobId ?? undefined,
    customerId: next.customerId,
    eventType: "estimate_approved",
  });

  const finalized = await tryFinalizeEstimate(companyId, estimateId, options);
  return finalized.estimate;
}

export async function convertEstimateToJob(
  companyId: string,
  estimateId: string,
  input?: { scheduledDate?: string; notes?: string; ownerOverride?: boolean },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<{ estimate: EstimateRecord; jobId: string }> {
  const existing = await getEstimateById(companyId, estimateId);
  if (!existing) throw new Error("Estimate not found");
  if (!existing.customerId) throw new Error("Estimate must belong to a customer");

  // Idempotent: already linked to a job.
  if (existing.jobId && existing.status === "converted") {
    return { estimate: existing, jobId: existing.jobId };
  }

  const { bothApprovalsPresent } = await import("@/lib/billing/workflow");
  const dualOk = bothApprovalsPresent({
    customerApprovedAt: existing.customerApprovedAt,
    acceptedAt: existing.acceptedAt,
    internalApprovedAt: existing.internalApprovedAt,
  });
  if (!dualOk && !input?.ownerOverride) {
    throw new Error(
      "Job creation requires customer acceptance and internal (owner/manager) approval, or an owner override."
    );
  }

  let jobId = existing.jobId;
  const { createAdminJobManual, updateJob } = await import("@/lib/db/operations");
  const client = await sb();
  const now = new Date().toISOString();

  if (!jobId) {
    const addr = existing.serviceAddress as {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    const job = await createAdminJobManual(
      companyId,
      {
        customerId: existing.customerId,
        serviceType: existing.divisionId === "hauling" ? "hauling_transport" : "junk_removal",
        street: addr.street ?? "Service address TBD",
        city: addr.city ?? "Warrenton",
        state: addr.state ?? "MO",
        zip: addr.zip ?? "63383",
        notes: input?.notes ?? `Agreed estimate ${existing.estimateNumber}`,
        scheduledDate: input?.scheduledDate,
        estimatedTotal: existing.estimatedTotal,
      },
      { actorProfileId: options?.actorProfileId }
    );

    // Atomic claim: only one concurrent finalize wins the job_id write.
    const { data: claimed, error: claimError } = await client
      .from("estimates")
      .update({
        job_id: job.id,
        status: "converted",
        converted_at: now,
        updated_at: now,
      })
      .eq("id", estimateId)
      .eq("company_id", companyId)
      .is("job_id", null)
      .select("*")
      .maybeSingle();
    if (claimError) throw claimError;

    if (!claimed) {
      // Lost the race — another request already linked a job.
      const refreshed = await getEstimateById(companyId, estimateId);
      if (refreshed?.jobId) {
        return { estimate: refreshed, jobId: refreshed.jobId };
      }
      throw new Error("Failed to link job to estimate");
    }

    jobId = job.id;
    const next = rowToEstimate(claimed as Record<string, unknown>);
    await logBillingAudit({
      companyId,
      entityType: "estimate",
      entityId: estimateId,
      action: "estimate_converted",
      actorProfileId: options?.actorProfileId,
      actorRole: options?.actorRole,
      newValue: { jobId, dualApproval: dualOk, ownerOverride: Boolean(input?.ownerOverride) },
    });
    return { estimate: next, jobId };
  }

  if (input?.scheduledDate) {
    await updateJob(companyId, jobId, {
      status: "scheduled",
      scheduledDate: input.scheduledDate,
    });
  } else {
    // Do not mark scheduled without a date — keeps "Needs Scheduling" queue accurate.
    await updateJob(companyId, jobId, { status: "estimated" });
  }

  const next: EstimateRecord = {
    ...existing,
    jobId,
    status: "converted",
    convertedAt: now,
    updatedAt: now,
  };
  await client.from("estimates").upsert(estimateToRow(next));

  await logBillingAudit({
    companyId,
    entityType: "estimate",
    entityId: estimateId,
    action: "estimate_converted",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    newValue: { jobId, dualApproval: dualOk, ownerOverride: Boolean(input?.ownerOverride) },
  });

  return { estimate: next, jobId };
}

export async function createOnSiteAdjustment(
  companyId: string,
  estimateId: string,
  input: {
    reason: string;
    addedLineItems: Array<Partial<BillingLineItem> & { label: string; unitPrice: number }>;
    removedLineItemIds?: string[];
  },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<EstimateAdjustmentRecord> {
  const estimate = await getEstimateById(companyId, estimateId);
  if (!estimate) throw new Error("Estimate not found");
  const added = input.addedLineItems.map((l, i) => normalizeLineItem({ ...l, category: "adjustment" }, i));
  const adjustmentTotal = sumCustomerFacingLines(added);
  const removed = new Set(input.removedLineItemIds ?? []);
  const removedAmount = estimate.lineItems
    .filter((l) => removed.has(l.id))
    .reduce((s, l) => s + l.amount, 0);
  const record: EstimateAdjustmentRecord = {
    id: billingId("eadj"),
    companyId,
    estimateId,
    jobId: estimate.jobId,
    status: "pending_approval",
    originalTotal: estimate.estimatedTotal,
    adjustmentTotal: adjustmentTotal - removedAmount,
    newTotal: estimate.estimatedTotal + adjustmentTotal - removedAmount,
    addedLineItems: added,
    removedLineItemIds: [...removed],
    reason: input.reason,
    createdByProfileId: options?.actorProfileId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const client = await sb();
  await client.from("estimate_adjustments").insert({
    id: record.id,
    company_id: companyId,
    estimate_id: estimateId,
    job_id: estimate.jobId,
    status: record.status,
    original_total: record.originalTotal,
    adjustment_total: record.adjustmentTotal,
    new_total: record.newTotal,
    added_line_items: record.addedLineItems,
    removed_line_item_ids: record.removedLineItemIds,
    reason: record.reason,
    created_by_profile_id: options?.actorProfileId ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  });

  await logBillingAudit({
    companyId,
    entityType: "estimate_adjustment",
    entityId: record.id,
    action: "adjustment_created",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    reason: input.reason,
    newValue: { originalTotal: record.originalTotal, newTotal: record.newTotal },
  });

  return record;
}

export async function approveOnSiteAdjustment(
  companyId: string,
  adjustmentId: string,
  input: {
    decision: "approved" | "declined";
    method: AcceptanceMethod | string;
    approvedBy: string;
    note?: string;
  },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<{ adjustment: EstimateAdjustmentRecord; estimate?: EstimateRecord }> {
  const client = await sb();
  const { data, error } = await client
    .from("estimate_adjustments")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", adjustmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Adjustment not found");

  const now = new Date().toISOString();
  await client
    .from("estimate_adjustments")
    .update({
      status: input.decision === "approved" ? "approved" : "declined",
      approved_at: now,
      approval_method: input.method,
      approved_by: input.approvedBy,
      approval_note: input.note ?? null,
      updated_at: now,
    })
    .eq("id", adjustmentId);

  let estimate: EstimateRecord | undefined;
  if (input.decision === "approved") {
    const existing = await getEstimateById(companyId, data.estimate_id as string);
    if (existing) {
      const removed = new Set((data.removed_line_item_ids as string[]) ?? []);
      const kept = existing.lineItems.filter((l) => !removed.has(l.id));
      const added = (data.added_line_items as BillingLineItem[]) ?? [];
      estimate = await updateEstimate(
        companyId,
        existing.id,
        {
          lineItems: [...kept, ...added],
          revisionReason: `On-site adjustment approved: ${data.reason}`,
        },
        { ...options, forceRevision: true }
      );
    }
  }

  await logBillingAudit({
    companyId,
    entityType: "estimate_adjustment",
    entityId: adjustmentId,
    action: input.decision === "approved" ? "adjustment_approved" : "adjustment_declined",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    reason: input.note,
    newValue: { method: input.method, by: input.approvedBy },
  });

  return {
    adjustment: {
      id: data.id as string,
      companyId,
      estimateId: data.estimate_id as string,
      jobId: data.job_id as string | null,
      status: input.decision === "approved" ? "approved" : "declined",
      originalTotal: Number(data.original_total),
      adjustmentTotal: Number(data.adjustment_total),
      newTotal: Number(data.new_total),
      addedLineItems: (data.added_line_items as BillingLineItem[]) ?? [],
      removedLineItemIds: (data.removed_line_item_ids as string[]) ?? [],
      reason: data.reason as string,
      createdByProfileId: data.created_by_profile_id as string | null,
      approvedAt: now,
      approvalMethod: input.method,
      approvedBy: input.approvedBy,
      approvalNote: input.note ?? null,
      createdAt: data.created_at as string,
      updatedAt: now,
    },
    estimate,
  };
}

export async function listAdjustmentsForEstimate(
  companyId: string,
  estimateId: string
): Promise<EstimateAdjustmentRecord[]> {
  if (!(await isDbReady())) return [];
  const client = await sb();
  const { data, error } = await client
    .from("estimate_adjustments")
    .select("*")
    .eq("company_id", companyId)
    .eq("estimate_id", estimateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    estimateId: r.estimate_id as string,
    jobId: r.job_id as string | null,
    status: r.status as EstimateAdjustmentRecord["status"],
    originalTotal: Number(r.original_total),
    adjustmentTotal: Number(r.adjustment_total),
    newTotal: Number(r.new_total),
    addedLineItems: (r.added_line_items as BillingLineItem[]) ?? [],
    removedLineItemIds: (r.removed_line_item_ids as string[]) ?? [],
    reason: r.reason as string,
    createdByProfileId: r.created_by_profile_id as string | null,
    approvedAt: r.approved_at as string | null,
    approvalMethod: r.approval_method as string | null,
    approvedBy: r.approved_by as string | null,
    approvalNote: r.approval_note as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function createInvoiceFromEstimate(
  companyId: string,
  estimateId: string,
  options?: { actorProfileId?: string; actorRole?: string; dueDate?: string }
): Promise<Invoice> {
  const estimate = await getEstimateById(companyId, estimateId);
  if (!estimate) throw new Error("Estimate not found");
  if (!estimate.customerId) throw new Error("Estimate has no customer");
  if (!estimate.jobId) throw new Error("Agreed estimate must be linked to a job before invoicing");

  const { getJobById, getInvoices } = await import("@/lib/db/operations");
  const job = await getJobById(companyId, estimate.jobId);
  if (!job) throw new Error("Linked job not found");
  const { assertJobCompletableForInvoice } = await import("@/lib/billing/workflow");
  assertJobCompletableForInvoice(job);

  const existingInvoices = await getInvoices(companyId);
  const already = existingInvoices.find(
    (i) => i.jobId === estimate.jobId && i.status !== "void"
  );
  if (already) {
    return already;
  }

  const adjustments = await listAdjustmentsForEstimate(companyId, estimateId);
  const approvedAdjTotal = adjustments
    .filter((a) => a.status === "approved")
    .reduce((s, a) => s + a.adjustmentTotal, 0);

  const lines = customerFacingLines(estimate.lineItems);
  const subtotal = sumCustomerFacingLines(lines);
  const total = Math.max(0, subtotal - estimate.discountAmount + estimate.taxAmount);
  const now = new Date().toISOString();

  const invoice: Invoice = {
    id: billingId("inv"),
    invoiceNumber: invoiceNumber(),
    companyId,
    jobId: estimate.jobId,
    customerId: estimate.customerId,
    estimateAmount: estimate.estimatedTotal,
    adjustments: lines.map((l) => ({ id: l.id, label: l.label, amount: l.amount })),
    subtotal,
    fees: estimate.taxAmount,
    depositAmount: 0,
    depositPaid: 0,
    total,
    amountPaid: 0,
    balanceDue: total,
    status: "draft",
    paymentStatus: "balance_due",
    dueDate: options?.dueDate,
    terms: "Payment due upon receipt unless otherwise arranged.",
    finalPriceNotes:
      approvedAdjTotal !== 0
        ? `Original estimate: $${estimate.estimatedTotal.toFixed(0)}. Approved adjustments: ${approvedAdjTotal >= 0 ? "+" : ""}$${approvedAdjTotal.toFixed(0)}. Final invoice: $${total.toFixed(0)}.`
        : undefined,
    createdAt: now,
  };

  const { invoiceToRow } = await import("@/lib/db/mappers");
  const client = await sb();
  await client.from("invoices").insert({
    ...invoiceToRow(invoice),
    estimate_id: estimateId,
    original_estimate_total: estimate.estimatedTotal,
    approved_adjustments_total: approvedAdjTotal,
    line_items: lines,
    tax_amount: estimate.taxAmount,
    discount_amount: estimate.discountAmount,
    customer_notes: estimate.customerNotes,
    issue_date: now.slice(0, 10),
    delivery_status: "not_sent",
  });

  await logBillingAudit({
    companyId,
    entityType: "invoice",
    entityId: invoice.id,
    action: "invoice_created",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    newValue: {
      fromEstimate: estimateId,
      total,
      originalEstimateTotal: estimate.estimatedTotal,
      approvedAdjustments: approvedAdjTotal,
    },
  });

  return invoice;
}

export async function getInvoiceByShareToken(token: string) {
  if (!(await isDbReady())) return null;
  const client = await sb();
  const { data, error } = await client
    .from("invoices")
    .select("*")
    .eq("share_token_hash", hashShareToken(token))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { rowToInvoice } = await import("@/lib/db/mappers");
  return rowToInvoice(data as Record<string, unknown>);
}

export async function issuePaymentReceipt(
  companyId: string,
  paymentId: string,
  options?: { actorProfileId?: string }
): Promise<{ receiptNumber: string; payment: Payment }> {
  const client = await sb();
  const { data, error } = await client
    .from("payments")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Payment not found");

  const number = (data.receipt_number as string) || receiptNumber();
  const now = new Date().toISOString();
  await client
    .from("payments")
    .update({
      receipt_number: number,
      receipt_issued_at: now,
    })
    .eq("id", paymentId);

  await logBillingAudit({
    companyId,
    entityType: "payment",
    entityId: paymentId,
    action: "receipt_issued",
    actorProfileId: options?.actorProfileId,
    newValue: { receiptNumber: number },
  });

  const { rowToPayment } = await import("@/lib/db/mappers");
  return {
    receiptNumber: number,
    payment: rowToPayment({ ...data, receipt_number: number, receipt_issued_at: now } as Record<string, unknown>),
  };
}

/**
 * Record one payment and allocate amounts across one or more invoices.
 * Allocations must not exceed each invoice balance; total allocations must equal payment amount.
 */
export async function allocatePaymentAcrossInvoices(
  companyId: string,
  input: {
    customerId: string;
    amount: number;
    method: Payment["method"];
    allocations: Array<{ invoiceId: string; amount: number }>;
    notes?: string;
    timing?: Payment["timing"];
  },
  options?: { actorProfileId?: string; actorRole?: string }
): Promise<{ payment: Payment; allocations: Array<{ invoiceId: string; amount: number }> }> {
  if (!input.customerId) throw new Error("customerId required");
  if (!input.allocations.length) throw new Error("At least one invoice allocation is required");
  const allocSum = Math.round(input.allocations.reduce((s, a) => s + a.amount, 0) * 100) / 100;
  if (Math.abs(allocSum - input.amount) > 0.01) {
    throw new Error("Payment amount must equal the sum of invoice allocations");
  }

  const { getInvoiceById, updateInvoice } = await import("@/lib/db/operations");
  const prepared: Array<{ inv: Invoice; amount: number }> = [];
  for (const a of input.allocations) {
    if (a.amount <= 0) throw new Error("Allocation amounts must be positive");
    const inv = await getInvoiceById(companyId, a.invoiceId);
    if (!inv) throw new Error(`Invoice ${a.invoiceId} not found`);
    if (inv.customerId !== input.customerId) {
      throw new Error("All invoices must belong to the same customer");
    }
    if (inv.status === "void") throw new Error(`Invoice ${inv.invoiceNumber} is void`);
    if (a.amount > inv.balanceDue + 0.01) {
      throw new Error(
        `Allocation $${a.amount} exceeds balance $${inv.balanceDue} on ${inv.invoiceNumber}`
      );
    }
    prepared.push({ inv, amount: a.amount });
  }

  const primary = prepared[0].inv;
  const paymentId = billingId("pay");
  const now = new Date().toISOString();
  const payment: Payment = {
    id: paymentId,
    companyId,
    customerId: input.customerId,
    jobId: primary.jobId,
    invoiceId: primary.id,
    amount: input.amount,
    method: input.method,
    timing: input.timing ?? "full",
    status: "completed",
    notes: input.notes,
    receiptNumber: receiptNumber(),
    createdAt: now,
  };

  const client = await sb();
  await client.from("payments").insert({
    id: payment.id,
    company_id: companyId,
    customer_id: input.customerId,
    job_id: payment.jobId,
    invoice_id: payment.invoiceId,
    amount: payment.amount,
    method: payment.method,
    timing: payment.timing,
    status: payment.status,
    receipt_number: payment.receiptNumber,
    notes: payment.notes ?? null,
    created_at: now,
  });

  for (const { inv, amount } of prepared) {
    await client.from("payment_allocations").insert({
      id: billingId("palloc"),
      company_id: companyId,
      payment_id: payment.id,
      invoice_id: inv.id,
      amount,
      created_at: now,
    });

    const amountPaid = inv.amountPaid + amount;
    const balanceDue = Math.max(0, inv.total - amountPaid);
    await updateInvoice(
      companyId,
      inv.id,
      {
        amountPaid,
        balanceDue,
        status: balanceDue <= 0 ? "paid" : "partially_paid",
        paymentStatus: balanceDue <= 0 ? "paid_in_full" : "balance_due",
      },
      { actorProfileId: options?.actorProfileId }
    );
  }

  await logBillingAudit({
    companyId,
    entityType: "payment",
    entityId: payment.id,
    action: "payment_allocated",
    actorProfileId: options?.actorProfileId,
    actorRole: options?.actorRole,
    newValue: { amount: input.amount, allocations: input.allocations },
  });

  return { payment, allocations: input.allocations };
}
