"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DisposalKpiStrip,
  DisposalRecommendationHero,
  DisposalQuickModePills,
  scoreForQuickMode,
  type DisposalQuickMode,
} from "@/components/disposal/DisposalDashboardSections";
import {
  DisposalFacilityCompactCard,
  DisposalRecentActivity,
  DisposalReportingSection,
} from "@/components/disposal/DisposalFacilityCard";
import { DisposalCompletionPanel } from "@/components/disposal/DisposalCompletionPanel";
import { CompactMaterialSelector } from "@/components/disposal/CompactMaterialSelector";
import { DisposalSchemaStatus } from "@/components/disposal/DisposalSchemaStatus";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  MATERIAL_CATEGORY_GROUPS,
  type MaterialCategory,
} from "@/lib/disposal/material-categories";
import type {
  DisposalDashboardKpis,
  DisposalFacility,
  DisposalRecommendationResult,
  DisposalSiteScore,
  DisposalSortMode,
} from "@/types/disposal-management";
import { Recycle, Search } from "lucide-react";

const SORT_OPTIONS: { value: DisposalSortMode; label: string }[] = [
  { value: "recommended", label: "Best overall" },
  { value: "most_profitable", label: "Most profitable" },
  { value: "lowest_total_cost", label: "Lowest total cost" },
  { value: "lowest_tipping", label: "Lowest disposal fee" },
  { value: "closest", label: "Closest" },
  { value: "fastest", label: "Fastest" },
  { value: "shortest_drive", label: "Shortest drive" },
  { value: "lowest_fuel", label: "Lowest fuel cost" },
  { value: "lowest_labor", label: "Lowest labor cost" },
  { value: "highest_rating", label: "Highest vendor rating" },
  { value: "preferred_vendor", label: "Preferred vendor" },
  { value: "open_now", label: "Open right now" },
  { value: "lowest_wait_time", label: "Lowest wait time" },
  { value: "alphabetical", label: "A–Z" },
];

export function DisposalManagementDashboard() {
  const { companyId } = useCompany();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");

  const [kpis, setKpis] = useState<DisposalDashboardKpis | null>(null);
  const [facilities, setFacilities] = useState<DisposalFacility[]>([]);
  const [recommendation, setRecommendation] = useState<DisposalRecommendationResult | null>(null);
  const [recentActivity, setRecentActivity] = useState<import("@/types/disposal-management").DisposalActivityRow[]>([]);
  const [topFacilities, setTopFacilities] = useState<import("@/types/disposal-management").DisposalFacilityReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<DisposalSortMode>("recommended");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPreferred, setFilterPreferred] = useState(false);
  const [materialTab, setMaterialTab] = useState("all");
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialCategory[]>([]);
  const [search, setSearch] = useState("");
  const [referenceZip, setReferenceZip] = useState("63301");
  const [quickMode, setQuickMode] = useState<DisposalQuickMode>("recommended");
  const [eventCount, setEventCount] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const dashRes = await fetch("/api/admin/disposal/dashboard").then((r) => r.json());
      if (dashRes.ok) {
        setKpis(dashRes.kpis);
        setFacilities(dashRes.facilities ?? []);
        setRecentActivity(dashRes.recentActivity ?? []);
        setTopFacilities(dashRes.topFacilities ?? []);
        setEventCount(dashRes.eventCount ?? 0);
      }

      const recBody: Record<string, unknown> = {
        sortBy,
        strictMaterials: selectedMaterials.length > 0,
        filters: {
          openNow: filterOpen || undefined,
          preferredOnly: filterPreferred || undefined,
        },
      };
      if (selectedMaterials.length) recBody.materials = selectedMaterials;
      if (jobIdParam) recBody.jobId = jobIdParam;
      else recBody.zip = referenceZip;

      const recRes = await fetch("/api/admin/disposal/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recBody),
      }).then((r) => r.json());
      if (recRes.ok) setRecommendation(recRes.recommendation);
    } finally {
      setLoading(false);
    }
  }, [sortBy, filterOpen, filterPreferred, selectedMaterials, jobIdParam, referenceZip]);

  useEffect(() => {
    void refresh();
  }, [refresh, companyId]);

  const scoreMap = useMemo(() => {
    const m = new Map<string, DisposalSiteScore>();
    recommendation?.ranked.forEach((s) => m.set(s.site.id, s));
    return m;
  }, [recommendation]);

  const displayList = useMemo(() => {
    let ids = new Set(facilities.map((f) => f.id));
    if (materialTab !== "all") {
      const group = MATERIAL_CATEGORY_GROUPS.find((g) => g.id === materialTab);
      if (group) {
        ids = new Set(
          facilities.filter((f) => group.categories.some((c) => f.acceptedMaterials.includes(c))).map((f) => f.id)
        );
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      ids = new Set(
        [...ids].filter((id) => {
          const f = facilities.find((x) => x.id === id);
          return f && (f.name.toLowerCase().includes(q) || (f.county ?? "").toLowerCase().includes(q));
        })
      );
    }
    const ranked = recommendation?.ranked.filter((r) => ids.has(r.site.id)) ?? [];
    if (ranked.length) return ranked;
    return facilities.filter((f) => ids.has(f.id)).map(
      (f): DisposalSiteScore => ({
        site: f,
        distanceMiles: 0,
        driveMinutes: 0,
        costs: {
          tippingFee: f.baseFee,
          fuelCost: 0,
          laborCost: 0,
          truckOperatingCost: 0,
          trailerOperatingCost: 0,
          waitCost: 0,
          unloadLaborCost: 0,
          totalCompanyCost: f.baseFee,
        },
        tippingFee: f.baseFee,
        fuelCost: 0,
        laborCost: 0,
        totalDisposalCost: f.baseFee,
        recommendationScore: 0,
        stars: 3,
        badges: [],
        isOpenNow: false,
        acceptsAllMaterials: true,
        selectionReason: "",
        recommendationReasons: [],
        usesHistoricalData: false,
      })
    );
  }, [recommendation, facilities, materialTab, search]);

  const heroScore = useMemo(() => {
    if (!recommendation) return null;
    return scoreForQuickMode(recommendation, quickMode) ?? recommendation.bestOverall;
  }, [recommendation, quickMode]);

  const heroTitle = useMemo(() => {
    const labels: Record<DisposalQuickMode, string> = {
      recommended: "Best overall",
      cheapest: "Cheapest option",
      closest: "Closest option",
      fastest: "Fastest option",
      most_profitable: "Most profitable",
      preferred: "Preferred vendor",
    };
    return jobIdParam ? `Recommended for this job — ${labels[quickMode]}` : labels[quickMode];
  }, [quickMode, jobIdParam]);

  const toggleSiteFlag = async (id: string, field: "isFavorite" | "isPreferredVendor", value: boolean) => {
    await fetch(`/api/admin/disposal/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { [field]: value } }),
    });
    void refresh();
  };

  return (
    <div className="space-y-8">
      {kpis && <DisposalKpiStrip kpis={kpis} />}

      {recommendation?.bestOverall && heroScore && (
        <section className="space-y-3">
          <SectionHeader
            title={jobIdParam ? "Recommended for this job" : "Best disposal option"}
            subtitle="Optimized for total company cost and profit — not distance alone"
          />
          {!jobIdParam && (
            <DisposalQuickModePills mode={quickMode} onChange={setQuickMode} />
          )}
          {jobIdParam ? (
            <DisposalCompletionPanel jobId={jobIdParam} onComplete={() => void refresh()} />
          ) : (
            <DisposalRecommendationHero
              title={heroTitle}
              score={heroScore}
              alternatives={recommendation}
              avoidWarning={
                quickMode === "recommended"
                  ? recommendation.avoidWarning
                  : heroScore.site.isAvoidVendor
                    ? "This facility is on your avoid list."
                    : undefined
              }
            />
          )}
        </section>
      )}

      <section>
        <SectionHeader title="Find the right facility" subtitle="Filter by materials — incompatible sites disappear automatically" />
        <PremiumCard className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Facility or county…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            {!jobIdParam && (
              <div className="w-28">
                <Label className="text-xs">Job ZIP</Label>
                <Input value={referenceZip} onChange={(e) => setReferenceZip(e.target.value)} />
              </div>
            )}
            <div className="w-44">
              <Label className="text-xs">Sort by</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as DisposalSortMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filterOpen} onCheckedChange={(v) => setFilterOpen(Boolean(v))} />
                Open now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filterPreferred} onCheckedChange={(v) => setFilterPreferred(Boolean(v))} />
                Preferred only
              </label>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>Apply</Button>
          </div>

          <CompactMaterialSelector selected={selectedMaterials} onChange={setSelectedMaterials} />

          <div className="flex flex-wrap gap-1">
            {[{ id: "all", label: "All" }, ...MATERIAL_CATEGORY_GROUPS].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setMaterialTab(g.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  materialTab === g.id ? "bg-brand-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </PremiumCard>
      </section>

      <section>
        <SectionHeader title={`${displayList.length} compatible facilities`} />
        {loading && <p className="text-sm text-muted-foreground">Calculating options…</p>}
        {!loading && displayList.length === 0 && (
          <AdminEmptyState
            icon={Recycle}
            title="No compatible facilities"
            description="Adjust materials or filters — incompatible sites are hidden automatically."
          />
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayList.map((row) => (
            <DisposalFacilityCompactCard
              key={row.site.id}
              score={scoreMap.get(row.site.id) ?? row}
              onToggleFavorite={() => void toggleSiteFlag(row.site.id, "isFavorite", !row.site.isFavorite)}
              onTogglePreferred={() => void toggleSiteFlag(row.site.id, "isPreferredVendor", !row.site.isPreferredVendor)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Reporting" subtitle="Based on recorded disposal events" />
        <DisposalReportingSection topFacilities={topFacilities} facilities={facilities} eventCount={eventCount} />
      </section>

      <DisposalSchemaStatus />

      {recentActivity.length > 0 && (
        <section>
          <DisposalRecentActivity rows={recentActivity} />
        </section>
      )}
    </div>
  );
}

export function DisposalJobPanel({ jobId, onAssigned }: { jobId: string; onAssigned?: () => void }) {
  return <DisposalCompletionPanel jobId={jobId} onComplete={onAssigned} compact />;
}
