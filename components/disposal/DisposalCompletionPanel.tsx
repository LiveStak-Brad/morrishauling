"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DisposalRecommendationHero } from "@/components/disposal/DisposalDashboardSections";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NO_DISPOSAL_COST_REASONS } from "@/lib/disposal/disposal-requirements";
import type {
  DisposalRecommendationResult,
  DisposalSiteScore,
} from "@/types/disposal-management";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Upload,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface DisposalCompletionPanelProps {
  jobId: string;
  onComplete?: () => void;
  compact?: boolean;
  mobileFirst?: boolean;
  showCompareLink?: boolean;
}

export function DisposalCompletionPanel({
  jobId,
  onComplete,
  compact,
  mobileFirst = false,
  showCompareLink = true,
}: DisposalCompletionPanelProps) {
  const [rec, setRec] = useState<DisposalRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"recommended" | "override">("recommended");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [noCost, setNoCost] = useState(false);
  const [noCostReason, setNoCostReason] = useState("");

  const [actualCost, setActualCost] = useState("");
  const [actualWeight, setActualWeight] = useState("");
  const [waitMinutes, setWaitMinutes] = useState("");
  const [unloadMinutes, setUnloadMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [receiptPath, setReceiptPath] = useState<string>();
  const [weightTicketPath, setWeightTicketPath] = useState<string>();
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingTicket, setUploadingTicket] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, stateRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/disposal/recommend`).then((r) => r.json()),
        fetch(`/api/jobs/${jobId}/disposal`).then((r) => r.json()),
      ]);
      if (recRes.ok) {
        setRec(recRes.recommendation);
        const best = recRes.recommendation.bestOverall;
        if (best && !actualCost) {
          setActualCost(String(best.costs.tippingFee));
          setSelectedSiteId(best.site.id);
        }
      }
      if (stateRes.ok && stateRes.disposal?.completedAt) {
        setAlreadyCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, actualCost]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeScore = useMemo((): DisposalSiteScore | null => {
    if (mode === "recommended") return rec?.bestOverall ?? null;
    return rec?.ranked.find((r) => r.site.id === selectedSiteId) ?? rec?.bestOverall ?? null;
  }, [mode, rec, selectedSiteId]);

  const needsOverrideReason =
    mode === "override" ||
    (rec?.bestOverall && activeScore && activeScore.site.id !== rec.bestOverall.site.id);

  const mapsUrl = activeScore?.site.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${activeScore.site.location.lat},${activeScore.site.location.lng}`
    : activeScore
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeScore.site.name)}`
      : null;

  const uploadFile = async (file: File, fileType: "receipt" | "weight_ticket") => {
    const form = new FormData();
    form.append("file", file);
    form.append("fileType", fileType);
    const res = await fetch(`/api/jobs/${jobId}/disposal`, { method: "POST", body: form });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error ?? "Upload failed");
    return d.storagePath as string;
  };

  const submit = async (markJobCompleted = false) => {
    if (!activeScore) return;
    const cost = noCost ? 0 : Number(actualCost);
    if (!noCost && !actualCost.trim()) {
      toast.error("Enter actual disposal cost");
      return;
    }
    if (noCost && !noCostReason) {
      toast.error("Select a reason for no disposal cost");
      return;
    }
    if (needsOverrideReason && !overrideReason.trim()) {
      toast.error("Override reason required when not using the recommended facility");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/disposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualSiteId: activeScore.site.id,
          actualSiteName: activeScore.site.name,
          actualCost: cost,
          actualWeightTons: actualWeight ? Number(actualWeight) : undefined,
          receiptUrl: receiptPath,
          weightTicketUrl: weightTicketPath,
          notes: notes || undefined,
          overrideReason: needsOverrideReason ? overrideReason : undefined,
          noDisposalCostReason: noCost ? noCostReason : undefined,
          recommendedSiteId: rec?.bestOverall?.site.id,
          estimatedCost: activeScore.costs.totalCompanyCost,
          driveMiles: activeScore.distanceMiles,
          driveMinutes: activeScore.driveMinutes,
          fuelCost: activeScore.costs.fuelCost,
          waitMinutes: waitMinutes ? Number(waitMinutes) : undefined,
          unloadMinutes: unloadMinutes ? Number(unloadMinutes) : undefined,
          laborCost: activeScore.costs.laborCost + activeScore.costs.waitCost + activeScore.costs.unloadLaborCost,
          truckOperatingCost: activeScore.costs.truckOperatingCost,
          markJobCompleted,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(markJobCompleted ? "Disposal recorded — job completed" : "Disposal recorded");
        setAlreadyCompleted(true);
        onComplete?.();
      } else {
        toast.error(d.error ?? "Failed to record disposal");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const btnClass = mobileFirst ? "h-12 text-base" : "";
  const uploadClass = mobileFirst
    ? "mt-1 flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-base active:bg-muted/60"
    : "mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm hover:bg-muted/50";

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding best disposal option…
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <PremiumCard className="border-emerald-200 bg-emerald-50/50 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
        <p className="font-semibold text-emerald-900">Disposal complete</p>
        <p className="mt-1 text-sm text-emerald-800">Actuals saved — you can mark the job finished.</p>
      </PremiumCard>
    );
  }

  if (!rec?.bestOverall) {
    return (
      <AdminEmptyState
        title="No compatible disposal"
        description="No facility accepts this job's materials. Contact dispatch."
      />
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {mobileFirst && (
        <div className="rounded-xl bg-brand-primary/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Needs disposal</p>
          <p className="mt-1 text-lg font-bold">{rec.bestOverall.site.name}</p>
          <p className="text-sm text-muted-foreground">
            {rec.bestOverall.distanceMiles} mi · ~{rec.bestOverall.driveMinutes} min
          </p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary text-base font-semibold text-white"
            >
              <Navigation className="h-5 w-5" />
              Navigate to facility
            </a>
          )}
        </div>
      )}

      {!mobileFirst && (
        <DisposalRecommendationHero score={rec.bestOverall} alternatives={rec} title="Recommended disposal" />
      )}

      <PremiumCard className={cn("space-y-4", mobileFirst ? "p-4" : "p-4")}>
        <div className={cn("flex flex-wrap gap-2", mobileFirst && "flex-col")}>
          <Button
            size={mobileFirst ? "lg" : "sm"}
            className={cn(mode === "recommended" ? "bg-emerald-600 hover:bg-emerald-700" : "", btnClass, mobileFirst && "w-full")}
            variant={mode === "recommended" ? "default" : "outline"}
            onClick={() => {
              setMode("recommended");
              if (rec.bestOverall) {
                setSelectedSiteId(rec.bestOverall.site.id);
                if (!noCost) setActualCost(String(rec.bestOverall.costs.tippingFee));
              }
            }}
          >
            Accept recommendation
          </Button>
          <Button
            size={mobileFirst ? "lg" : "sm"}
            className={cn(btnClass, mobileFirst && "w-full")}
            variant={mode === "override" ? "default" : "outline"}
            onClick={() => setMode("override")}
          >
            Different facility
          </Button>
          {showCompareLink && !mobileFirst && (
            <Link href={`/admin/dump-sites?jobId=${jobId}`} className="ml-auto">
              <Button size="sm" variant="ghost">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Compare all
              </Button>
            </Link>
          )}
        </div>

        {mode === "override" && (
          <div>
            <Label className="text-xs">Select facility</Label>
            <Select
              value={selectedSiteId}
              onValueChange={(id) => {
                if (!id) return;
                setSelectedSiteId(id);
                const row = rec.ranked.find((r) => r.site.id === id);
                if (row && !noCost) setActualCost(String(row.costs.tippingFee));
              }}
            >
              <SelectTrigger className={mobileFirst ? "h-12" : ""}>
                <SelectValue placeholder="Choose facility…" />
              </SelectTrigger>
              <SelectContent>
                {rec.ranked.slice(0, 12).map((r) => (
                  <SelectItem key={r.site.id} value={r.site.id}>
                    {r.site.name} — ${r.costs.totalCompanyCost} · {r.distanceMiles} mi
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <label className="flex items-center gap-3 rounded-lg border p-3">
          <Checkbox
            checked={noCost}
            onCheckedChange={(v) => {
              setNoCost(Boolean(v));
              if (v) setActualCost("0");
              else if (activeScore) setActualCost(String(activeScore.costs.tippingFee));
            }}
          />
          <span className="text-sm">No disposal cost ($0)</span>
        </label>

        {noCost && (
          <div>
            <Label className="text-xs">Reason for $0 cost</Label>
            <Select value={noCostReason} onValueChange={(v) => setNoCostReason(v ?? "")}>
              <SelectTrigger className={mobileFirst ? "h-12" : ""}>
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {NO_DISPOSAL_COST_REASONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className={cn("grid gap-3", mobileFirst ? "grid-cols-1" : "sm:grid-cols-2")}>
          {!noCost && (
            <div>
              <Label className="text-xs">Actual cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                className={mobileFirst ? "h-12 text-base" : ""}
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="text-xs">Weight (tons)</Label>
            <Input
              type="number"
              step="0.01"
              className={mobileFirst ? "h-12 text-base" : ""}
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Wait (min)</Label>
            <Input
              type="number"
              className={mobileFirst ? "h-12 text-base" : ""}
              value={waitMinutes}
              onChange={(e) => setWaitMinutes(e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <Label className="text-xs">Unload (min)</Label>
            <Input
              type="number"
              className={mobileFirst ? "h-12 text-base" : ""}
              value={unloadMinutes}
              onChange={(e) => setUnloadMinutes(e.target.value)}
              placeholder="18"
            />
          </div>
        </div>

        <div className={cn("grid gap-3", mobileFirst ? "grid-cols-1" : "sm:grid-cols-2")}>
          <div>
            <Label className="text-xs">Receipt photo</Label>
            <label className={uploadClass}>
              <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span>{receiptPath ? "✓ Receipt uploaded" : uploadingReceipt ? "Uploading…" : "Tap to upload"}</span>
              <Input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                disabled={uploadingReceipt}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingReceipt(true);
                  try {
                    setReceiptPath(await uploadFile(file, "receipt"));
                    toast.success("Receipt uploaded");
                  } catch {
                    toast.error("Receipt upload failed");
                  } finally {
                    setUploadingReceipt(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          <div>
            <Label className="text-xs">Weight ticket</Label>
            <label className={uploadClass}>
              <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span>{weightTicketPath ? "✓ Ticket uploaded" : uploadingTicket ? "Uploading…" : "Tap to upload"}</span>
              <Input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                disabled={uploadingTicket}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingTicket(true);
                  try {
                    setWeightTicketPath(await uploadFile(file, "weight_ticket"));
                    toast.success("Weight ticket uploaded");
                  } catch {
                    toast.error("Upload failed");
                  } finally {
                    setUploadingTicket(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate wait, scale issues…" />
        </div>

        {needsOverrideReason && (
          <div>
            <Label className="text-xs text-amber-800">Why not the recommended site?</Label>
            <Textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="border-amber-200"
            />
          </div>
        )}

        {!mobileFirst && mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-primary hover:underline">
            <MapPin className="h-4 w-4" /> Open directions
          </a>
        )}

        <div className={cn("flex flex-col gap-2", !mobileFirst && "sm:flex-row")}>
          <Button
            className={cn("flex-1 bg-emerald-600 hover:bg-emerald-700", btnClass)}
            disabled={submitting}
            onClick={() => void submit(false)}
          >
            {submitting ? "Saving…" : "Complete disposal"}
          </Button>
          <Button
            variant="outline"
            className={cn("flex-1", btnClass)}
            disabled={submitting}
            onClick={() => void submit(true)}
          >
            Complete disposal & finish job
          </Button>
        </div>
      </PremiumCard>
    </div>
  );
}
