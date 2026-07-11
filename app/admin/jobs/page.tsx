"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminJobIntake } from "@/components/admin/AdminJobIntake";
import { JobCard } from "@/components/customer/JobCard";
import { jobQueueGroup, type JobQueueGroup } from "@/lib/billing/workflow";
import type { Job } from "@/types";
import { Briefcase } from "lucide-react";

const TABS: Array<{ key: JobQueueGroup | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "needs_scheduling", label: "Needs Scheduling" },
  { key: "missing_assignments", label: "Missing Assignment" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "awaiting_proof", label: "Awaiting Proof" },
  { key: "ready_to_invoice", label: "Ready to Invoice" },
  { key: "invoiced", label: "Invoiced" },
];

export default function AdminJobsPage() {
  const { companyId } = useCompany();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as JobQueueGroup | "all" | null) ?? "all";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoicedJobIds, setInvoicedJobIds] = useState<Set<string>>(new Set());
  const [queues, setQueues] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<JobQueueGroup | "all">(
    TABS.some((t) => t.key === initialTab) ? initialTab : "all"
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/workflow-queues").then((r) => r.json()),
    ])
      .then(([jobsRes, inv, q]) => {
        if (jobsRes.ok) setJobs(jobsRes.jobs ?? []);
        if (inv.ok) {
          setInvoicedJobIds(new Set((inv.invoices ?? []).map((i: { jobId: string }) => i.jobId)));
        }
        if (q.ok && q.jobs) {
          setQueues({
            needs_scheduling: q.jobs.needsScheduling ?? 0,
            missing_assignments: q.jobs.missingAssignments ?? 0,
            scheduled: q.jobs.scheduled ?? 0,
            in_progress: q.jobs.inProgress ?? 0,
            awaiting_proof: q.jobs.awaitingProof ?? 0,
            ready_to_invoice: q.jobs.readyToInvoice ?? 0,
            invoiced: q.jobs.invoiced ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  const filtered = useMemo(() => {
    if (tab === "all") return jobs.filter((j) => !["cancelled", "canceled"].includes(j.status));
    return jobs.filter((j) => {
      if (["cancelled", "canceled"].includes(j.status)) return false;
      return jobQueueGroup(j, invoicedJobIds.has(j.id)) === tab;
    });
  }, [jobs, tab, invoicedJobIds]);

  return (
    <AdminPageShell
      title="Jobs"
      description="Jobs come from agreed estimates — schedule, complete with proof, then invoice"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => {
          const count =
            key === "all"
              ? jobs.filter((j) => !["cancelled", "canceled"].includes(j.status)).length
              : queues[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                tab === key ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "hover:bg-muted"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <details className="mb-4 rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Owner exception — create job without estimate
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Normal path: Customer → Estimate → dual approval → Job. Use this only for corrections.
        </p>
        <div className="mt-3">
          <AdminJobIntake onCreated={refresh} />
        </div>
      </details>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
        {!loading && filtered.length === 0 && (
          <AdminEmptyState
            icon={Briefcase}
            title="No jobs in this queue."
            description="Agree an estimate to create a job, or use manual intake only when needed."
          />
        )}
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} href={`/admin/jobs/${job.id}`} showInternalProfit />
        ))}
      </div>
    </AdminPageShell>
  );
}
