"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EstimateReviewCard } from "@/components/admin/EstimateReviewCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ClipboardCheck } from "lucide-react";
import type { Job } from "@/types/job";

/**
 * Legacy photo-based junk pricing review.
 * Formal customer estimates live under /admin/estimates (Needs Approval).
 */
export default function AdminReviewPage() {
  const [queue, setQueue] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setQueue([]);
          return;
        }
        const jobs = (d.jobs as Job[]).filter(
          (j) =>
            j.serviceType === "junk_removal" &&
            (j.junkRemovalDetails?.reviewRequired ||
              j.junkRemovalDetails?.reviewStatus === "needs_review" ||
              j.reviewStatus === "needs_review")
        );
        setQueue(jobs);
      })
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <AdminPageShell
      title="Field photo review"
      description="Legacy intake only — formal estimates use Customer → Estimate → dual approval"
    >
      <PremiumCard className="mb-4 space-y-2 border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-950">
          Prefer the Estimates queue for day-one work.
        </p>
        <p className="text-sm text-amber-900">
          Create and approve estimates under{" "}
          <Link href="/admin/estimates?tab=to_approve" className="underline">
            Estimates → Needs Approval
          </Link>
          . This page is only for older photo-flagged junk jobs that never got a formal estimate.
        </p>
      </PremiumCard>

      <div className="mb-4 flex items-center gap-2">
        <StatusChip label={`${queue.length} pending`} variant={queue.length ? "warning" : "success"} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading review queue…</p>
      ) : queue.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardCheck}
          title="No legacy field reviews waiting"
          description="Use Estimates → Needs Approval for the customer-centered workflow."
          action={
            <Link
              href="/admin/estimates"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Open estimates
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {queue.map((job) => (
            <EstimateReviewCard
              key={job.id}
              job={job}
              onUpdated={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
