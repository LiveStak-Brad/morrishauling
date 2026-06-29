"use client";

import type { Job } from "@/types/job";
import type { JunkInternalProfit } from "@/types/junk-removal";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { TrendingUp, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function profitFromJob(job: Job): JunkInternalProfit | null {
  const jrd = job.junkRemovalDetails;
  if (!jrd || job.serviceType !== "junk_removal") return null;

  const revenue = job.estimate?.total ?? 0;
  const hasActual = jrd.disposalCompletedAt != null && jrd.actualGrossProfit != null;

  if (hasActual) {
    const lines = jrd.internalCostBreakdown ?? [];
    const find = (id: string) => lines.find((l) => l.id === id)?.amount ?? 0;
    const quotedDump = jrd.dumpFeeEstimate ?? find("dump_cost");
    const actualDump = jrd.actualDisposalCost ?? quotedDump;

    return {
      revenue,
      fuelCost: jrd.actualFuelCost ?? find("fuel_cost"),
      payrollCost: find("payroll_cost"),
      dumpCost: actualDump,
      truckOperatingCost: find("truck_cost"),
      trailerOperatingCost: find("trailer_cost"),
      overheadCost: find("overhead"),
      creditCardProcessingCost: find("cc_processing"),
      totalOperatingCost: revenue - (jrd.actualGrossProfit ?? 0),
      grossProfit: jrd.actualGrossProfit ?? 0,
      profitMargin: jrd.actualProfitMargin ?? 0,
      quotedDumpCost: quotedDump,
      disposalDifference: Math.round(actualDump - quotedDump),
      isActual: true,
    };
  }

  if (jrd.estimatedProfit == null || jrd.estimatedMargin == null) return null;

  const lines = jrd.internalCostBreakdown ?? [];
  const find = (id: string) => lines.find((l) => l.id === id)?.amount ?? 0;

  return {
    revenue,
    fuelCost: find("fuel_cost"),
    payrollCost: find("payroll_cost"),
    dumpCost: find("dump_cost"),
    truckOperatingCost: find("truck_cost"),
    trailerOperatingCost: find("trailer_cost"),
    overheadCost: find("overhead"),
    creditCardProcessingCost: find("cc_processing"),
    totalOperatingCost: find("total_cost") || revenue - jrd.estimatedProfit,
    grossProfit: jrd.estimatedProfit,
    profitMargin: jrd.estimatedMargin,
    isActual: false,
  };
}

export function JunkInternalProfitCard({ job }: { job: Job }) {
  const profit = profitFromJob(job);
  if (!profit) return null;

  const marginVariant =
    profit.profitMargin >= 50 ? "success" : profit.profitMargin >= 30 ? "info" : "warning";

  return (
    <PremiumCard className="border-dashed border-brand-primary/30 bg-brand-primary/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {profit.isActual ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingUp className="h-5 w-5 text-brand-primary" />
          )}
          <h3 className="font-bold">
            {profit.isActual ? "Final job profitability" : "Internal profit estimate"}
          </h3>
        </div>
        <StatusChip label="Staff only" variant="neutral" className="text-[10px]" />
      </div>
      <p className="mb-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Not visible to customers
      </p>

      {profit.isActual && profit.disposalDifference != null && (
        <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Quoted dump</p>
            <p className="font-semibold">${profit.quotedDumpCost}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Actual dump</p>
            <p className="font-semibold">${profit.dumpCost}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Difference</p>
            <p className={cn("font-semibold", profit.disposalDifference <= 0 ? "text-emerald-600" : "text-amber-700")}>
              {profit.disposalDifference >= 0 ? "+" : ""}${profit.disposalDifference}
            </p>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Revenue</dt>
          <dd className="font-semibold">${profit.revenue}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fuel</dt>
          <dd>${profit.fuelCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Payroll</dt>
          <dd>${profit.payrollCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{profit.isActual ? "Actual dump" : "Dump fee"}</dt>
          <dd>${profit.dumpCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Truck operating</dt>
          <dd>${profit.truckOperatingCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Trailer operating</dt>
          <dd>${profit.trailerOperatingCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Overhead</dt>
          <dd>${profit.overheadCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Card processing</dt>
          <dd>${profit.creditCardProcessingCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{profit.isActual ? "Total operating" : "Est. operating cost"}</dt>
          <dd className="font-medium">${profit.totalOperatingCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{profit.isActual ? "Final gross profit" : "Est. gross profit"}</dt>
          <dd className={cn("font-bold", profit.grossProfit >= 0 ? "text-green-600" : "text-red-600")}>
            ${profit.grossProfit}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Margin</dt>
          <dd>
            <StatusChip label={`${profit.profitMargin}%`} variant={marginVariant} className="text-xs" />
          </dd>
        </div>
      </dl>
    </PremiumCard>
  );
}
