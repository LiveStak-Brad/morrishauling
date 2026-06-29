"use client";

import { StatCard } from "@/components/morris/StatCard";
import type { DisposalDashboardKpis, DisposalRecommendationResult, DisposalSiteScore } from "@/types/disposal-management";
import {
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
  Star,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DisposalQuickMode =
  | "recommended"
  | "cheapest"
  | "closest"
  | "fastest"
  | "most_profitable"
  | "preferred";

const QUICK_MODES: { id: DisposalQuickMode; label: string }[] = [
  { id: "recommended", label: "Best overall" },
  { id: "cheapest", label: "Cheapest" },
  { id: "closest", label: "Closest" },
  { id: "fastest", label: "Fastest" },
  { id: "most_profitable", label: "Most profitable" },
  { id: "preferred", label: "Preferred" },
];

export function scoreForQuickMode(
  rec: DisposalRecommendationResult,
  mode: DisposalQuickMode
): DisposalSiteScore | null {
  switch (mode) {
    case "recommended":
      return rec.bestOverall;
    case "cheapest":
      return rec.cheapest;
    case "closest":
      return rec.closest;
    case "fastest":
      return rec.fastest;
    case "most_profitable":
      return rec.mostProfitable;
    case "preferred":
      return rec.preferredVendor;
    default:
      return rec.bestOverall;
  }
}

export function DisposalQuickModePills({
  mode,
  onChange,
}: {
  mode: DisposalQuickMode;
  onChange: (m: DisposalQuickMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            mode === m.id
              ? "bg-brand-primary text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function DisposalKpiStrip({ kpis }: { kpis: DisposalDashboardKpis }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <StatCard label="Facilities" value={kpis.totalFacilities} icon={Building2} />
      <StatCard label="Open now" value={kpis.openNow} icon={Clock} subtext="Ready to receive loads" />
      <StatCard label="Preferred vendors" value={kpis.preferredVendors} icon={Star} />
      <StatCard
        label="Avg disposal cost"
        value={kpis.avgDisposalCost > 0 ? `$${kpis.avgDisposalCost}` : "—"}
        icon={DollarSign}
      />
      <StatCard
        label="Avg drive"
        value={kpis.avgDriveMiles > 0 ? `${kpis.avgDriveMiles} mi` : "—"}
        icon={MapPin}
      />
      <StatCard
        label="Monthly spend"
        value={kpis.monthlySpend > 0 ? `$${kpis.monthlySpend.toLocaleString()}` : "$0"}
        icon={DollarSign}
        variant="hero"
      />
      <StatCard
        label="Rec. savings"
        value={kpis.savingsFromRecommendations > 0 ? `$${kpis.savingsFromRecommendations}` : "—"}
        icon={TrendingDown}
        subtext="vs estimates"
      />
    </div>
  );
}

export function DisposalRecommendationHero({
  title = "Recommended disposal",
  score,
  alternatives,
  avoidWarning,
}: {
  title?: string;
  score: DisposalSiteScore;
  alternatives?: DisposalRecommendationResult;
  avoidWarning?: string;
}) {
  const { site, costs } = score;

  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-brand-primary/30 text-white shadow-xl">
      {avoidWarning && (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {avoidWarning}
        </div>
      )}
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {title}
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">{site.name}</h2>
            <p className="mt-1 text-sm text-white/70">
              {site.county ? `${site.county} County · ` : ""}
              {site.accessType === "both" ? "Public & commercial · " : `${site.accessType} · `}
              {score.distanceMiles} mi · {score.driveMinutes} min drive
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-300">${costs.totalCompanyCost}</p>
            <p className="text-xs text-white/60">total company cost</p>
            {costs.estimatedProfitAfterDisposal != null && (
              <p className="mt-1 text-sm text-amber-200">
                Est. profit after disposal: ${costs.estimatedProfitAfterDisposal}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {[
            { label: "Tipping", value: `$${costs.tippingFee}` },
            { label: "Fuel", value: `$${costs.fuelCost}` },
            { label: "Labor", value: `$${costs.laborCost + costs.waitCost + costs.unloadLaborCost}` },
            { label: "Truck ops", value: `$${costs.truckOperatingCost}` },
            { label: "Wait est.", value: `$${costs.waitCost}` },
            { label: "Score", value: `${score.recommendationScore}/100` },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-white/50">{m.label}</p>
              <p className="font-semibold">{m.value}</p>
            </div>
          ))}
        </div>

        {score.recommendationReasons.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Recommended because</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {score.recommendationReasons.map((r) => (
                <li key={r.label} className="flex items-center gap-2 text-sm text-white/90">
                  <span className="text-emerald-400">✓</span>
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {alternatives && (
        <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Cheapest", row: alternatives.cheapest },
            { label: "Closest", row: alternatives.closest },
            { label: "Fastest", row: alternatives.fastest },
            { label: "Most profitable", row: alternatives.mostProfitable },
            { label: "Preferred", row: alternatives.preferredVendor },
          ].map(({ label, row }) =>
            row && row.site.id !== score.site.id ? (
              <div key={label} className="border-white/10 px-4 py-3 sm:border-r last:sm:border-r-0">
                <p className="text-[10px] uppercase text-white/45">{label}</p>
                <p className="truncate text-sm font-medium">{row.site.name}</p>
                <p className="text-xs text-white/60">${row.costs.totalCompanyCost} · {row.distanceMiles} mi</p>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
