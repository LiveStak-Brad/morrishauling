import type { MorrisConfig } from "@/lib/morris-config";
import { morrisConfig } from "@/lib/morris-config";
import { getEffectivePricingRules } from "@/lib/db/company-settings";
import { mergeEffectivePricing } from "@/lib/pricing/merge-effective-pricing";

/** Server-only: load effective morris config with DB pricing overrides. */
export async function getEffectiveMorrisConfig(companyId: string): Promise<{
  config: MorrisConfig;
}> {
  const pricing = await getEffectivePricingRules(companyId);
  return {
    config: mergeEffectivePricing(morrisConfig, {
      loadTiers: pricing.loadTiers,
      modifiers: pricing.modifiers,
      minCharge: pricing.minCharge,
      dumpFee: pricing.dumpFee,
      itemSurcharge: pricing.itemSurcharge,
      haulingRates: pricing.haulingRates,
      itemPrices: pricing.itemPrices,
    }),
  };
}
