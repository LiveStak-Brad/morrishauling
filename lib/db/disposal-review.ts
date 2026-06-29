import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDbReady, getJobById } from "@/lib/db/operations";
import { buildDisposalFlags } from "@/lib/disposal/disposal-alerts";
import type { DisposalReviewStatus } from "@/lib/disposal/disposal-requirements";
import type { Job } from "@/types/job";

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export interface DisposalReviewRow {
  jobId: string;
  customerName?: string;
  address?: string;
  status: Job["status"];
  actualSiteName?: string;
  estimatedDisposalCost?: number;
  actualDisposalCost?: number;
  disposalOverrideReason?: string;
  disposalSkipReason?: string;
  noDisposalCostReason?: string;
  disposalReviewStatus: DisposalReviewStatus;
  disposalReviewNotes?: string;
  disposalCompletedAt?: string;
  hasReceipt: boolean;
  hasWeightTicket: boolean;
  waitMinutes?: number;
  actualProfitMargin?: number;
  flags: string[];
}

function buildFlags(job: Job): string[] {
  return buildDisposalFlags(job);
}

export async function listDisposalReviewQueue(companyId: string): Promise<DisposalReviewRow[]> {
  if (!(await isDbReady())) return [];

  const sb = await createClient();
  const { data: jobs } = await sb
    .from("jobs")
    .select("id, status, customer_id, address_json")
    .eq("company_id", companyId)
    .eq("service_type", "junk_removal")
    .in("status", ["needs_dump", "in_progress", "completed"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!jobs?.length) return [];

  const jobIds = jobs.map((j) => j.id as string);
  const { data: details } = await sb
    .from("junk_removal_details")
    .select("*")
    .in("job_id", jobIds);

  const detailMap = new Map((details ?? []).map((d) => [d.job_id as string, d]));
  const rows: DisposalReviewRow[] = [];

  for (const row of jobs) {
    const jobId = row.id as string;
    const d = detailMap.get(jobId);
    if (!d) continue;

    const job = await getJobById(companyId, jobId);
    if (!job) continue;

    const flags = buildFlags(job);
    const needsReview =
      flags.length > 0 ||
      d.disposal_review_status === "flagged" ||
      d.disposal_review_status === "correction_requested" ||
      (d.disposal_completed_at && d.disposal_review_status === "pending");

    if (!needsReview && job.status !== "needs_dump") continue;

    const addr = row.address_json as { street?: string; city?: string } | null;

    rows.push({
      jobId,
      status: row.status as Job["status"],
      address: addr ? `${addr.street ?? ""}, ${addr.city ?? ""}`.trim() : undefined,
      actualSiteName: (d.actual_disposal_site_name as string) ?? undefined,
      estimatedDisposalCost: d.estimated_disposal_cost != null ? Number(d.estimated_disposal_cost) : d.dump_fee_estimate != null ? Number(d.dump_fee_estimate) : undefined,
      actualDisposalCost: d.actual_disposal_cost != null ? Number(d.actual_disposal_cost) : undefined,
      disposalOverrideReason: (d.disposal_override_reason as string) ?? undefined,
      disposalSkipReason: (d.disposal_skip_reason as string) ?? undefined,
      noDisposalCostReason: (d.no_disposal_cost_reason as string) ?? undefined,
      disposalReviewStatus: (d.disposal_review_status as DisposalReviewStatus) ?? "pending",
      disposalReviewNotes: (d.disposal_review_notes as string) ?? undefined,
      disposalCompletedAt: (d.disposal_completed_at as string) ?? undefined,
      hasReceipt: Boolean(d.disposal_receipt_url),
      hasWeightTicket: Boolean(d.disposal_weight_ticket_url),
      waitMinutes: d.actual_disposal_wait_minutes != null ? Number(d.actual_disposal_wait_minutes) : undefined,
      actualProfitMargin: d.actual_profit_margin != null ? Number(d.actual_profit_margin) : undefined,
      flags,
    });
  }

  return rows.sort((a, b) => b.flags.length - a.flags.length);
}

export async function updateDisposalReview(
  companyId: string,
  jobId: string,
  input: { status: DisposalReviewStatus; notes?: string; actorProfileId?: string }
) {
  const now = new Date().toISOString();
  const { error } = await (await sbWrite())
    .from("junk_removal_details")
    .update({
      disposal_review_status: input.status,
      disposal_review_notes: input.notes ?? null,
      updated_at: now,
    })
    .eq("job_id", jobId);

  if (error) throw error;

  const { logActivity } = await import("@/lib/db/activity");
  await logActivity({
    companyId,
    actorProfileId: input.actorProfileId,
    entityType: "job",
    entityId: jobId,
    action: "disposal_review",
    message: `Disposal review: ${input.status}`,
  });
}

export async function skipJobDisposal(
  companyId: string,
  jobId: string,
  input: { skipReason: string; skipNotes?: string; actorProfileId?: string; markJobCompleted?: boolean }
) {
  const now = new Date().toISOString();
  const sb = await sbWrite();

  const { error } = await sb
    .from("junk_removal_details")
    .update({
      disposal_skip_reason: input.skipReason,
      disposal_skip_notes: input.skipNotes ?? null,
      disposal_skipped_at: now,
      disposal_skipped_by: input.actorProfileId ?? null,
      disposal_review_status: "approved",
      updated_at: now,
    })
    .eq("job_id", jobId);

  if (error) throw error;

  if (input.markJobCompleted) {
    await sb
      .from("jobs")
      .update({ status: "completed", updated_at: now })
      .eq("company_id", companyId)
      .eq("id", jobId);
  }

  const { logActivity } = await import("@/lib/db/activity");
  await logActivity({
    companyId,
    actorProfileId: input.actorProfileId,
    entityType: "job",
    entityId: jobId,
    action: "disposal_skipped",
    message: `Disposal skipped: ${input.skipReason}`,
  });
}
