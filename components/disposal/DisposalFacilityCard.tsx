"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { MiniBarChart } from "@/components/morris/Charts";
import { getMaterialIcon } from "@/lib/disposal/material-icons";
import { MATERIAL_CATEGORY_LABELS } from "@/lib/disposal/material-categories";
import type { DisposalSiteScore } from "@/types/disposal-management";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Star,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<string, string> = {
  recommended: "bg-brand-primary/90 text-white border-0",
  cheapest: "bg-emerald-600 text-white border-0",
  closest: "bg-blue-600 text-white border-0",
  fastest: "bg-violet-600 text-white border-0",
  preferred: "bg-amber-500 text-white border-0",
  most_profitable: "bg-teal-600 text-white border-0",
  avoid: "bg-red-100 text-red-800 border border-red-200",
};

const ACCESS_LABELS: Record<string, string> = {
  public: "Public",
  commercial: "Commercial",
  both: "Public & commercial",
};

export function DisposalFacilityCompactCard({
  score,
  onToggleFavorite,
  onTogglePreferred,
}: {
  score: DisposalSiteScore;
  onToggleFavorite?: () => void;
  onTogglePreferred?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { site, costs } = score;
  const materials = site.acceptedMaterials.slice(0, 6);
  const topReason = score.recommendationReasons[0]?.label;

  return (
    <PremiumCard
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-lg",
        site.isClosed && "opacity-70",
        site.isAvoidVendor && "ring-1 ring-red-200"
      )}
    >
      {/* Header: name + open status */}
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/dump-sites/${site.id}`}
              className="block truncate text-lg font-bold leading-tight hover:text-brand-primary"
            >
              {site.name}
            </Link>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {site.county ? `${site.county} County` : "—"}
              <span className="mx-1.5 text-border">·</span>
              {ACCESS_LABELS[site.accessType] ?? site.accessType}
              {site.vendorRating ? (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <Star className="inline h-3 w-3 text-amber-500" /> {site.vendorRating.toFixed(1)}
                </>
              ) : null}
            </p>
          </div>
          <StatusChip
            label={score.isOpenNow ? "Open" : "Closed"}
            variant={score.isOpenNow ? "success" : "urgent"}
            className="shrink-0 text-xs font-semibold"
          />
        </div>

        {/* Badges row */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full bg-brand-primary px-2 text-xs font-bold text-white">
            {score.recommendationScore}
          </span>
          {score.badges.slice(0, 3).map((b) => (
            <Badge key={b} variant="secondary" className={cn("text-[10px] capitalize font-medium", BADGE_STYLES[b] ?? "")}>
              {b.replace(/_/g, " ")}
            </Badge>
          ))}
          {site.isPreferredVendor && (
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-[10px] text-amber-800">
              Preferred
            </Badge>
          )}
          {site.isAvoidVendor && (
            <Badge className={cn("text-[10px]", BADGE_STYLES.avoid)}>
              <Ban className="mr-0.5 h-3 w-3" /> Avoid
            </Badge>
          )}
          {score.acceptsAllMaterials && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Compatible
            </span>
          )}
        </div>
      </div>

      {/* Hero metric: total cost */}
      <div className="px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total company cost
            </p>
            <p className="text-3xl font-bold tabular-nums text-brand-primary">${costs.totalCompanyCost}</p>
            <p className="text-xs text-muted-foreground">${costs.tippingFee} tipping fee</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <MapPin className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-bold">{score.distanceMiles} mi</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <Clock className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-bold">{score.driveMinutes} min</p>
            </div>
          </div>
        </div>

        {topReason && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>
            {topReason}
            {score.recommendationReasons.length > 1 && ` +${score.recommendationReasons.length - 1} more`}
          </p>
        )}

        {/* Materials */}
        <div className="mt-3 flex flex-wrap gap-1">
          {materials.map((m) => {
            const Icon = getMaterialIcon(m);
            return (
              <span
                key={m}
                title={MATERIAL_CATEGORY_LABELS[m]}
                className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Icon className="h-3 w-3" />
                {MATERIAL_CATEGORY_LABELS[m].split(" ")[0]}
              </span>
            );
          })}
          {site.acceptedMaterials.length > 6 && (
            <span className="inline-flex items-center px-1.5 text-[10px] text-muted-foreground">
              +{site.acceptedMaterials.length - 6}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-3 text-xs space-y-2">
          <p className="text-muted-foreground">
            {site.address}
            {site.city ? `, ${site.city}` : ""}
          </p>
          <ul className="space-y-0.5">
            {score.recommendationReasons.map((r) => (
              <li key={r.label} className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                {r.label}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground pt-1">
            <span>Fuel ${costs.fuelCost}</span>
            <span>Labor ${costs.laborCost + costs.waitCost + costs.unloadLaborCost}</span>
          </div>
          {score.usesHistoricalData && (
            <p className="text-emerald-700">Uses your historical job data</p>
          )}
        </div>
      )}

      <div className="flex border-t">
        <Button variant="ghost" size="sm" className="flex-1 rounded-none h-9 text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
          {expanded ? "Less" : "Why & details"}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-none h-9 px-3" onClick={onToggleFavorite} aria-label="Favorite">
          <Heart className={cn("h-4 w-4", site.isFavorite && "fill-red-500 text-red-500")} />
        </Button>
        <Button variant="ghost" size="sm" className="rounded-none h-9 px-3" onClick={onTogglePreferred} aria-label="Preferred">
          <Star className={cn("h-4 w-4", site.isPreferredVendor && "fill-amber-400 text-amber-500")} />
        </Button>
        <Link href={`/admin/dump-sites/${site.id}`} className="inline-flex items-center justify-center rounded-none h-9 px-3 hover:bg-muted">
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </PremiumCard>
  );
}

export function DisposalReportingSection({
  topFacilities,
  facilities,
  eventCount = 0,
}: {
  topFacilities: import("@/types/disposal-management").DisposalFacilityReportRow[];
  facilities?: import("@/types/disposal-management").DisposalFacility[];
  eventCount?: number;
}) {
  if (topFacilities.length === 0) {
    return (
      <PremiumCard className="p-6">
        <div className="mx-auto max-w-md text-center">
          <p className="text-4xl font-bold tabular-nums text-muted-foreground/40">{eventCount}</p>
          <p className="mt-1 text-sm font-medium">disposal events recorded</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Charts populate when crews complete disposal on jobs — receipt, cost, and facility are saved to{" "}
            <code className="rounded bg-muted px-1 text-xs">disposal_events</code>.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/planner">
              <Button size="sm" variant="outline">Dispatch board</Button>
            </Link>
            <Link href="/admin/disposal-review">
              <Button size="sm" variant="outline">Disposal review</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Employee app → record disposal at facility · Planner → accept recommendation · Review queue → audit actuals
          </p>
        </div>
      </PremiumCard>
    );
  }

  const preferred = facilities?.filter((f) => f.isPreferredVendor) ?? [];
  const topRated = [...(facilities ?? [])]
    .filter((f) => f.vendorRating)
    .sort((a, b) => (b.vendorRating ?? 0) - (a.vendorRating ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniBarChart
          title="Most used facilities"
          data={topFacilities.map((f) => ({ label: f.dumpSiteName.split(" ")[0], value: f.jobCount }))}
        />
        <MiniBarChart
          title="Spend by facility ($)"
          data={topFacilities.map((f) => ({ label: f.dumpSiteName.split(" ")[0], value: f.totalSpent }))}
        />
      </div>

      {(preferred.length > 0 || topRated.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {preferred.length > 0 && (
            <PremiumCard className="p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preferred vendors
              </h4>
              <ul className="space-y-2 text-sm">
                {preferred.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-center justify-between">
                    <Link href={`/admin/dump-sites/${f.id}`} className="font-medium hover:text-brand-primary">
                      {f.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {f.vendorRating ? `★ ${f.vendorRating.toFixed(1)}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </PremiumCard>
          )}
          {topRated.length > 0 && (
            <PremiumCard className="p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vendor scorecard
              </h4>
              <ul className="space-y-2 text-sm">
                {topRated.map((f) => (
                  <li key={f.id} className="flex items-center justify-between">
                    <Link href={`/admin/dump-sites/${f.id}`} className="font-medium hover:text-brand-primary">
                      {f.name}
                    </Link>
                    <span className="font-semibold text-amber-600">★ {f.vendorRating!.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </PremiumCard>
          )}
        </div>
      )}
    </div>
  );
}

export function DisposalRecentActivity({
  rows,
}: {
  rows: import("@/types/disposal-management").DisposalActivityRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <PremiumCard className="p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent disposal activity</h3>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="font-medium">{r.dumpSiteName}</p>
              <p className="text-xs text-muted-foreground">
                Job {r.jobId.slice(0, 8)}… · {new Date(r.completedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${r.actualCost}</p>
              {r.wasRecommended && (
                <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
    </PremiumCard>
  );
}

/** @deprecated use DisposalFacilityCompactCard */
export { DisposalFacilityCompactCard as DisposalFacilityCard };
export { DisposalFacilityCompactCard as DisposalRecommendationCard };
