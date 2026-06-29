"use client";

import type { Job } from "@/types/job";
import type { HaulingInternalProfit } from "@/types/hauling";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function profitFromJob(job: Job): HaulingInternalProfit | null {
  const hd = job.haulingDetails;
  if (!hd) return null;

  if (
    hd.estimatedProfit != null &&
    hd.estimatedMargin != null &&
    job.estimate?.total != null
  ) {
    const revenue = job.estimate.total;
    const lines = hd.internalCostBreakdown ?? [];
    const find = (id: string) => lines.find((l) => l.id === id)?.amount ?? 0;
    return {
      revenue,
      fuelCost: find("fuel_cost") || hd.estimatedFuelCost || 0,
      payrollCost: find("payroll_cost"),
      trailerCost: find("trailer_cost"),
      rentalCost: find("rental_cost"),
      overheadCost: find("overhead"),
      totalOperatingCost: find("total_cost") || revenue - hd.estimatedProfit,
      grossProfit: hd.estimatedProfit,
      profitMargin: hd.estimatedMargin,
    };
  }
  return null;
}

export function HaulingInternalProfitCard({ job }: { job: Job }) {
  if (job.serviceType !== "hauling_transport") return null;

  const profit = profitFromJob(job);
  if (!profit) return null;

  const marginVariant =
    profit.profitMargin >= 60 ? "success" : profit.profitMargin >= 40 ? "info" : "warning";

  return (
    <PremiumCard className="border-dashed border-brand-primary/30 bg-brand-primary/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Internal profit estimate</h3>
        </div>
        <StatusChip label="Staff only" variant="neutral" className="text-[10px]" />
      </div>
      <p className="mb-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Not visible to customers
      </p>
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
          <dt className="text-xs text-muted-foreground">Trailer cost</dt>
          <dd>${profit.trailerCost}</dd>
        </div>
        {profit.rentalCost > 0 && (
          <div>
            <dt className="text-xs text-muted-foreground">Rental cost</dt>
            <dd>${profit.rentalCost}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted-foreground">Overhead</dt>
          <dd>${profit.overheadCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Est. operating cost</dt>
          <dd className="font-medium">${profit.totalOperatingCost}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Est. gross profit</dt>
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

export function HaulingInternalProfitInline({ job }: { job: Job }) {
  const profit = profitFromJob(job);
  if (!profit || job.serviceType !== "hauling_transport") return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2 text-[10px]">
      <Lock className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium text-muted-foreground">Internal:</span>
      <StatusChip label={`Profit $${profit.grossProfit}`} variant="success" className="text-[10px]" />
      <StatusChip label={`${profit.profitMargin}% margin`} variant="info" className="text-[10px]" />
    </div>
  );
}
