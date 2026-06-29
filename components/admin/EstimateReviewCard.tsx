"use client";

import type { Job } from "@/types/job";
import { getCommonJunkItem } from "@/lib/common-junk-items";
import { getBookingCategory } from "@/lib/booking-categories";
import {
  ESTIMATE_REVIEW_STATUS_LABELS,
  JUNK_ESTIMATE_MODE_LABELS,
  JUNK_VOLUME_TIER_LABELS,
} from "@/types/junk-removal";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mutateReviewEstimate } from "@/lib/api/mutations";
import { useCompany } from "@/lib/company-context";
import { JunkInternalProfitCard } from "@/components/junk/JunkInternalProfitCard";
import { JunkEstimateReview } from "@/components/junk/JunkEstimateReview";
import { PriceFactorsCard } from "@/components/junk/JunkEstimateExplainers";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { morrisConfig } from "@/lib/morris-config";
import { useMemo, useState, useEffect } from "react";
import { Camera, MessageSquare, User, Route, ImageIcon } from "lucide-react";
import { DISPOSAL_CATEGORY_LABELS } from "@/types/disposal";
import { toast } from "@/lib/toast";
import type { Customer } from "@/types/user";
import Image from "next/image";

interface EstimateReviewCardProps {
  job: Job;
  onUpdated?: () => void;
}

export function EstimateReviewCard({ job, onUpdated }: EstimateReviewCardProps) {
  const { companyId } = useCompany();
  const [adjustedTotal, setAdjustedTotal] = useState(String(job.estimate?.total ?? 0));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [baseOverride, setBaseOverride] = useState<string>("auto");
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setCustomer((d.customers as Customer[]).find((c) => c.id === job.customerId) ?? null);
        }
      });
  }, [job.customerId]);

  const jrd = job.junkRemovalDetails;
  const suggestedTotal = job.estimate?.total ?? 0;

  const estimateInput = useMemo(
    () =>
      jrd
        ? {
            mode: jrd.estimateMode,
            selectedItems: jrd.selectedItems,
            loadSizeTier: job.loadSizeTier,
            junkCategory: jrd.selectedCategory ?? job.junkType,
            accessDetails: job.accessDetails,
            items: job.items,
            addressLocation: job.address.location,
            zip: job.address.zip,
            priorityLevel: jrd.priorityLevel,
            hasPhotos: job.photos.length > 0,
            customerNotes: job.customerNotes,
            originBaseId: baseOverride === "auto" ? undefined : baseOverride,
          }
        : null,
    [jrd, job, baseOverride]
  );

  const estimateResult = useMemo(
    () => (estimateInput ? junkRemovalEngine.calculate(estimateInput, morrisConfig) : null),
    [estimateInput]
  );

  const engineSuggestedTotal = estimateResult?.total ?? suggestedTotal;

  const handleAction = async (
    action: "approved" | "adjusted" | "declined" | "request_info" | "send_quote"
  ) => {
    setBusy(true);
    try {
      await mutateReviewEstimate(companyId, job.id, {
        action,
        adjustedTotal:
          action === "adjusted" || action === "send_quote"
            ? Number(adjustedTotal)
            : undefined,
        notes: notes || undefined,
      });
      if (action === "send_quote") {
        toast.info("Revised quote saved. Email sending is not connected yet.");
      }
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <PremiumCard className="overflow-hidden">
      <div className="border-b bg-muted/40 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Review request</p>
            <h3 className="text-lg font-bold">{job.address.street}</h3>
            <p className="text-sm text-muted-foreground">
              {job.address.city}, {job.address.state}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip
              label={ESTIMATE_REVIEW_STATUS_LABELS[jrd?.reviewStatus ?? job.reviewStatus ?? "needs_review"]}
              variant={jrd?.reviewRequired ? "warning" : "info"}
            />
            {jrd && (
              <StatusChip label={JUNK_ESTIMATE_MODE_LABELS[jrd.estimateMode]} variant="neutral" />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-brand-primary" />
            <span className="font-medium">{customer?.name ?? "Customer"}</span>
            <span className="text-muted-foreground">{customer?.phone}</span>
          </div>

          {job.photos.length > 0 && (
            <PremiumCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-brand-primary" />
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Customer photos ({job.photos.length})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {job.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    {photo.url.startsWith("/") ? (
                      <Image
                        src={photo.url}
                        alt={photo.caption ?? "Job photo"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Photos submitted for human review — adjust pricing if the load differs from the estimate.
              </p>
            </PremiumCard>
          )}

          {jrd?.estimateMode === "single_item" && jrd.selectedItems && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Items</p>
              <ul className="mt-1 text-sm">
                {jrd.selectedItems.map((sel) => (
                  <li key={sel.itemId}>
                    {sel.quantity}× {getCommonJunkItem(sel.itemId)?.name ?? sel.itemId}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {jrd?.estimateMode === "cleanout" && (
            <p className="text-sm">
              <span className="text-muted-foreground">Category: </span>
              {getBookingCategory(jrd.selectedCategory ?? job.junkType)?.name ?? job.junkType}
              {job.loadSizeTier && (
                <>
                  {" · "}
                  {JUNK_VOLUME_TIER_LABELS[job.loadSizeTier]}
                </>
              )}
            </p>
          )}

          {job.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Additional items listed</p>
              <ul className="mt-1 text-sm">
                {job.items.map((i) => (
                  <li key={i.id}>{i.quantity}× {i.name}</li>
                ))}
              </ul>
            </div>
          )}

          {(jrd?.selectedDisposalSiteName || estimateResult?.route) && (
            <PremiumCard className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Route className="h-4 w-4 text-brand-primary" />
                <p className="text-xs font-semibold uppercase text-muted-foreground">Route & disposal (staff)</p>
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Disposal</dt>
                  <dd>{jrd?.selectedDisposalSiteName ?? estimateResult?.route.selectedDisposalSiteName}</dd>
                </div>
                {(jrd?.disposalCategory ?? estimateResult?.route.disposalCategory) && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      {DISPOSAL_CATEGORY_LABELS[
                        (jrd?.disposalCategory ?? estimateResult?.route.disposalCategory)!
                      ]}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Base → customer</dt>
                  <dd>{jrd?.estimatedDispatchMiles ?? estimateResult?.route.dispatchMiles} mi</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer → disposal</dt>
                  <dd>{jrd?.estimatedCustomerToDisposalMiles ?? estimateResult?.route.customerToDisposalMiles} mi</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Disposal → base</dt>
                  <dd>{jrd?.estimatedReturnMiles ?? estimateResult?.route.returnMiles} mi</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total route</dt>
                  <dd>{jrd?.estimatedTotalRouteMiles ?? estimateResult?.route.totalRouteMiles} mi</dd>
                </div>
              </dl>
              {jrd?.minimumsApplied && jrd.minimumsApplied.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Minimums: {jrd.minimumsApplied.join("; ")}
                </p>
              )}
            </PremiumCard>
          )}

          {jrd?.reviewReasons && jrd.reviewReasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Review reasons</p>
              <ul className="mt-1 space-y-1 text-sm">
                {jrd.reviewReasons.map((r) => (
                  <li key={r} className="flex items-start gap-1.5">
                    <span className="text-brand-primary">·</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.customerNotes && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
              {job.customerNotes}
            </p>
          )}

          <PremiumCard className="border-brand-primary/20 bg-brand-primary/5 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Pricing summary</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Engine suggested</dt>
                <dd className="font-semibold">${engineSuggestedTotal}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Customer submitted</dt>
                <dd>${suggestedTotal}</dd>
              </div>
            </dl>
          </PremiumCard>

          {estimateResult && estimateResult.priceFactors.length > 0 && (
            <PriceFactorsCard
              factors={estimateResult.priceFactors}
              title="Reason estimate may be higher than average"
              showDetails
            />
          )}

          <PremiumCard className="p-4">
            <Label htmlFor="base-override" className="text-xs font-semibold uppercase text-muted-foreground">
              Dispatch base (admin override)
            </Label>
            <select
              id="base-override"
              className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={baseOverride}
              onChange={(e) => setBaseOverride(e.target.value)}
            >
              <option value="auto">Auto — shortest route</option>
              {morrisConfig.operatingBases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
            {estimateResult?.route.baseSelectionReason && (
              <p className="mt-2 text-xs text-muted-foreground">
                {estimateResult.route.baseSelectionReason}
              </p>
            )}
          </PremiumCard>
        </div>

        <div className="space-y-4">
          {estimateResult && jrd && (
            <JunkEstimateReview
              mode={jrd.estimateMode}
              estimate={estimateResult}
              selectedItems={jrd.selectedItems}
              categoryId={jrd.selectedCategory ?? job.junkType}
              loadSizeTier={job.loadSizeTier}
              priorityLevel={jrd.priorityLevel}
              showReviewBanner={false}
              audience="customer"
            />
          )}
          <JunkInternalProfitCard job={job} />
        </div>
      </div>

      <div className="space-y-4 border-t bg-muted/20 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Adjusted total ($)</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={adjustedTotal}
              onChange={(e) => setAdjustedTotal(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Suggested: ${engineSuggestedTotal} · Submitted: ${suggestedTotal}
            </p>
          </div>
          <div>
            <Label>Internal notes</Label>
            <Textarea
              className="mt-1.5 min-h-[80px] rounded-xl"
              placeholder="Notes for dispatch or customer follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl bg-green-600 hover:bg-green-700"
            disabled={busy}
            onClick={() => handleAction("approved")}
          >
            Approve estimate
          </Button>
          <Button variant="secondary" className="rounded-xl" disabled={busy} onClick={() => handleAction("adjusted")}>
            Adjust & approve
          </Button>
          <Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => handleAction("send_quote")}>
            Save revised quote
          </Button>
          <Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => handleAction("request_info")}>
            Request more info
          </Button>
          <Button variant="ghost" className="rounded-xl text-destructive" disabled={busy} onClick={() => handleAction("declined")}>
            Decline
          </Button>
        </div>
      </div>
    </PremiumCard>
  );
}
