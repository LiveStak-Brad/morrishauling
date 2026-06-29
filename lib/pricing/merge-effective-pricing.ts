import type { MorrisConfig } from "@/lib/morris-config";
import { COMMON_JUNK_ITEMS } from "@/lib/common-junk-items";

export type EffectivePricingSlice = {
  loadTiers: MorrisConfig["pricingRules"]["loadTiers"];
  modifiers: MorrisConfig["pricingRules"]["modifiers"];
  minCharge: number;
  dumpFee: number;
  itemSurcharge: number;
  haulingRates: MorrisConfig["haulingPricing"];
  itemPrices: MorrisConfig["commonJunkItems"];
};

/** Merge DB-backed pricing into morris-config; static config is fallback only. Client-safe. */
export function mergeEffectivePricing(base: MorrisConfig, pricing: EffectivePricingSlice): MorrisConfig {
  return {
    ...base,
    pricingRules: {
      ...base.pricingRules,
      loadTiers: pricing.loadTiers,
      modifiers: pricing.modifiers,
      minCharge: pricing.minCharge,
      dumpFee: pricing.dumpFee,
      itemSurcharge: pricing.itemSurcharge,
    },
    commonJunkItems: pricing.itemPrices,
    haulingPricing: {
      ...base.haulingPricing,
      ...pricing.haulingRates,
    },
    junkRemovalPricing: {
      ...base.junkRemovalPricing,
      dumpFeeDefault: pricing.dumpFee,
      minimumJobPrice: Math.max(base.junkRemovalPricing.minimumJobPrice, pricing.minCharge),
    },
  };
}

export function pricingSliceFromApiResponse(config: {
  pricingRules: MorrisConfig["pricingRules"];
  commonJunkItems?: MorrisConfig["commonJunkItems"];
  haulingPricing: MorrisConfig["haulingPricing"];
}): EffectivePricingSlice {
  return {
    loadTiers: config.pricingRules.loadTiers,
    modifiers: config.pricingRules.modifiers,
    minCharge: config.pricingRules.minCharge,
    dumpFee: config.pricingRules.dumpFee,
    itemSurcharge: config.pricingRules.itemSurcharge,
    haulingRates: config.haulingPricing,
    itemPrices: config.commonJunkItems ?? COMMON_JUNK_ITEMS,
  };
}
