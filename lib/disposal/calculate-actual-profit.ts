import type { Job } from "@/types/job";
import type { JunkInternalProfit } from "@/types/junk-removal";

export interface ActualDisposalInput {
  actualDisposalCost: number;
  actualFuelCost?: number;
  waitMinutes?: number;
  unloadMinutes?: number;
  laborRatePerHour?: number;
}

/** Recalculate job profitability using actual disposal costs. */
export function calculateActualProfit(job: Job, input: ActualDisposalInput): JunkInternalProfit | null {
  const jrd = job.junkRemovalDetails;
  if (!jrd || job.serviceType !== "junk_removal") return null;

  const revenue = job.estimate?.total ?? 0;
  if (revenue <= 0) return null;

  const lines = jrd.internalCostBreakdown ?? [];
  const find = (id: string) => lines.find((l) => l.id === id)?.amount ?? 0;

  const quotedDump = jrd.dumpFeeEstimate ?? find("dump_cost");
  const actualDump = input.actualDisposalCost;
  const laborRate = input.laborRatePerHour ?? 28;
  const waitLabor = ((input.waitMinutes ?? 0) / 60) * laborRate;
  const unloadLabor = ((input.unloadMinutes ?? 0) / 60) * laborRate;

  const fuelCost = input.actualFuelCost ?? find("fuel_cost");
  const payrollCost = find("payroll_cost") + waitLabor + unloadLabor;
  const truckOperatingCost = find("truck_cost");
  const trailerOperatingCost = find("trailer_cost");
  const overheadCost = find("overhead");
  const creditCardProcessingCost = find("cc_processing");

  const totalOperatingCost =
    fuelCost +
    payrollCost +
    actualDump +
    truckOperatingCost +
    trailerOperatingCost +
    overheadCost +
    creditCardProcessingCost;

  const grossProfit = Math.round(revenue - totalOperatingCost);
  const profitMargin = Math.round((grossProfit / revenue) * 1000) / 10;

  return {
    revenue,
    fuelCost: Math.round(fuelCost),
    payrollCost: Math.round(payrollCost),
    dumpCost: Math.round(actualDump),
    truckOperatingCost: Math.round(truckOperatingCost),
    trailerOperatingCost: Math.round(trailerOperatingCost),
    overheadCost: Math.round(overheadCost),
    creditCardProcessingCost: Math.round(creditCardProcessingCost),
    totalOperatingCost: Math.round(totalOperatingCost),
    grossProfit,
    profitMargin,
    quotedDumpCost: Math.round(quotedDump),
    disposalDifference: Math.round(actualDump - quotedDump),
    isActual: true,
  };
}

export type ActualProfitResult = JunkInternalProfit & {
  quotedDumpCost?: number;
  disposalDifference?: number;
};
