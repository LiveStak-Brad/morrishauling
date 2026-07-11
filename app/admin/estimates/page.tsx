"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import type { EstimateRecord } from "@/types/billing";
import { ESTIMATE_STATUS_LABELS } from "@/types/billing";
import { estimateQueueGroup } from "@/lib/billing/workflow";
import { FileSpreadsheet, Plus } from "lucide-react";

type Tab = "to_approve" | "final_agreed" | "completed";

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; status: string }>>([]);
  const [invoiceJobIds, setInvoiceJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("to_approve");
  const [queues, setQueues] = useState<{ toApprove: number; finalAgreed: number; completed: number }>({
    toApprove: 0,
    finalAgreed: 0,
    completed: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/estimates").then((r) => r.json()),
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/workflow-queues").then((r) => r.json()),
    ])
      .then(([est, jobsRes, inv, q]) => {
        if (est.ok) setEstimates(est.estimates ?? []);
        if (jobsRes.ok) setJobs((jobsRes.jobs ?? []).map((j: { id: string; status: string }) => ({ id: j.id, status: j.status })));
        if (inv.ok) {
          setInvoiceJobIds(new Set((inv.invoices ?? []).map((i: { jobId: string }) => i.jobId)));
        }
        if (q.ok) {
          setQueues({
            toApprove: q.estimates?.toApprove ?? 0,
            finalAgreed: q.estimates?.finalAgreed ?? 0,
            completed: q.estimates?.completed ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const jobStatus = useMemo(() => new Map(jobs.map((j) => [j.id, j.status])), [jobs]);

  const grouped = useMemo(() => {
    const buckets: Record<Tab, EstimateRecord[]> = {
      to_approve: [],
      final_agreed: [],
      completed: [],
    };
    for (const e of estimates) {
      const g = estimateQueueGroup({
        status: e.status,
        jobStatus: e.jobId ? jobStatus.get(e.jobId) : null,
        hasInvoice: e.jobId ? invoiceJobIds.has(e.jobId) : false,
      });
      buckets[g].push(e);
    }
    return buckets;
  }, [estimates, jobStatus, invoiceJobIds]);

  const list = grouped[tab];

  return (
    <AdminPageShell
      title="Estimates"
      description="One current estimate per request — approve, agree, then job"
      action={
        <Link
          href="/admin/estimates/new"
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="h-4 w-4" /> New estimate
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["to_approve", "Needs Approval", queues.toApprove],
            ["final_agreed", "Agreed", queues.finalAgreed],
            ["completed", "Completed", queues.completed],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              tab === key ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "hover:bg-muted"
            }`}
          >
            {label} ({count || grouped[key].length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading estimates…</p>
      ) : list.length === 0 ? (
        <AdminEmptyState
          icon={FileSpreadsheet}
          title={
            tab === "to_approve"
              ? "Nothing waiting for approval"
              : tab === "final_agreed"
                ? "No agreed estimates yet"
                : "No completed estimate history"
          }
          description="Create an estimate from a customer workspace to get started."
        />
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <Link key={e.id} href={`/admin/estimates/${e.id}`}>
              <PremiumCard interactive className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{e.estimateNumber}</span>
                      <StatusChip label={ESTIMATE_STATUS_LABELS[e.status] ?? e.status} variant="info" />
                      {e.internalApprovedAt && <StatusChip label="Internal OK" variant="success" />}
                      {(e.customerApprovedAt || e.acceptedAt) && (
                        <StatusChip label="Customer OK" variant="success" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {e.divisionId ?? "junk_removal"}
                      {e.customerId ? (
                        <>
                          {" · "}
                          <span
                            onClick={(ev) => {
                              ev.preventDefault();
                              window.location.href = `/admin/customers/${e.customerId}`;
                            }}
                            className="text-brand-primary underline"
                          >
                            Open customer
                          </span>
                        </>
                      ) : null}
                      {e.jobId ? ` · Job linked` : ""}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-brand-primary">
                    ${e.estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
