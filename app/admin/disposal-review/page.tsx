"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DISPOSAL_SKIP_REASONS } from "@/lib/disposal/disposal-requirements";
import type { DisposalReviewRow } from "@/lib/db/disposal-review";
import { AlertTriangle, CheckCircle, Flag, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

const FLAG_LABELS: Record<string, string> = {
  missing_receipt: "Missing receipt",
  missing_weight_ticket: "Missing weight ticket",
  cost_over_estimate: "Over estimate",
  facility_override: "Override",
  no_cost_disposal: "No cost",
  disposal_skipped: "Skipped",
  high_wait_time: "Long wait",
  low_margin: "Low margin",
  completed_without_disposal: "No disposal",
};

export default function DisposalReviewPage() {
  const [rows, setRows] = useState<DisposalReviewRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [skipJobId, setSkipJobId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipNotes, setSkipNotes] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/disposal/review")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRows(d.rows ?? []);
          setCounts(d.counts ?? {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const review = async (jobId: string, action: "approve" | "flag" | "request_correction") => {
    const res = await fetch(`/api/admin/disposal/review/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success(`Marked ${action}`);
      refresh();
    } else toast.error(d.error ?? "Failed");
  };

  const skipDisposal = async () => {
    if (!skipJobId || !skipReason) return;
    const res = await fetch(`/api/admin/disposal/review/${skipJobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "skip", skipReason, skipNotes, markJobCompleted: true }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Disposal skipped");
      setSkipJobId(null);
      refresh();
    } else toast.error(d.error ?? "Failed");
  };

  return (
    <AdminPageShell
      title="Disposal review"
      description="Audit receipts, overrides, and profitability flags"
      action={
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="In queue" value={counts.total ?? 0} icon={AlertTriangle} />
        <StatCard label="Missing receipt" value={counts.missingReceipt ?? 0} />
        <StatCard label="Over estimate" value={counts.overEstimate ?? 0} />
        <StatCard label="Overrides" value={counts.overrides ?? 0} />
        <StatCard label="No disposal" value={counts.noDisposal ?? 0} />
      </div>

      {skipJobId && (
        <PremiumCard className="mb-6 space-y-3 p-4 border-amber-200">
          <h3 className="font-semibold">Skip disposal — admin override</h3>
          <Select value={skipReason} onValueChange={(v) => setSkipReason(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Reason…" /></SelectTrigger>
            <SelectContent>
              {DISPOSAL_SKIP_REASONS.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea rows={2} value={skipNotes} onChange={(e) => setSkipNotes(e.target.value)} placeholder="Notes…" />
          <div className="flex gap-2">
            <Button onClick={() => void skipDisposal()}>Skip & complete job</Button>
            <Button variant="ghost" onClick={() => setSkipJobId(null)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && rows.length === 0 && (
        <PremiumCard className="p-8 text-center text-muted-foreground">
          No disposal items need review.
        </PremiumCard>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <PremiumCard key={row.jobId} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.actualSiteName ?? "No site recorded"}</p>
                <p className="text-xs text-muted-foreground">
                  Job {row.jobId.slice(0, 10)}… · {row.status.replace(/_/g, " ")}
                  {row.address ? ` · ${row.address}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.flags.map((f) => (
                    <StatusChip key={f} label={FLAG_LABELS[f] ?? f} variant="warning" className="text-[10px]" />
                  ))}
                  <StatusChip label={row.disposalReviewStatus} variant="neutral" className="text-[10px]" />
                </div>
                {(row.estimatedDisposalCost != null || row.actualDisposalCost != null) && (
                  <p className="mt-2 text-sm">
                    Est ${row.estimatedDisposalCost ?? "—"} → Actual ${row.actualDisposalCost ?? "—"}
                    {row.actualProfitMargin != null && (
                      <span className="ml-2 text-muted-foreground">· {row.actualProfitMargin}% margin</span>
                    )}
                  </p>
                )}
                {row.disposalOverrideReason && (
                  <p className="mt-1 text-xs text-amber-800">Override: {row.disposalOverrideReason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => review(row.jobId, "approve")}>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => review(row.jobId, "flag")}>
                  <Flag className="mr-1 h-3.5 w-3.5" /> Flag
                </Button>
                <Button size="sm" variant="outline" onClick={() => review(row.jobId, "request_correction")}>
                  Request fix
                </Button>
                {!row.disposalCompletedAt && !row.disposalSkipReason && (
                  <Button size="sm" variant="ghost" onClick={() => { setSkipJobId(row.jobId); setSkipReason(""); }}>
                    Skip disposal
                  </Button>
                )}
                <Link href={`/admin/dump-sites?jobId=${row.jobId}`}>
                  <Button size="sm" variant="ghost">Open</Button>
                </Link>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>
    </AdminPageShell>
  );
}
