"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EstimateReviewCard } from "@/components/admin/EstimateReviewCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ClipboardCheck } from "lucide-react";
import type { Job } from "@/types/job";

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
      title="Estimate review"
      description="Jobs flagged for human review before scheduling"
    >
      <div className="mb-4 flex items-center gap-2">
        <StatusChip label={`${queue.length} pending`} variant={queue.length ? "warning" : "success"} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading review queue…</p>
      ) : queue.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardCheck}
          title="No jobs waiting for review."
          description="Jobs flagged for human review before scheduling will appear here."
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
