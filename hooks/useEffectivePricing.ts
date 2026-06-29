"use client";

import { useEffect, useState } from "react";
import { morrisConfig, type MorrisConfig } from "@/lib/morris-config";
import { mergeEffectivePricing, pricingSliceFromApiResponse } from "@/lib/pricing/merge-effective-pricing";

/** Load DB-backed pricing for booking/estimate UI; falls back to morris-config. */
export function useEffectivePricing(companyId: string = morrisConfig.companyId) {
  const [estimateConfig, setEstimateConfig] = useState<MorrisConfig>(morrisConfig);
  const [loading, setLoading] = useState(true);
  const [fromDb, setFromDb] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pricing/effective?companyId=${encodeURIComponent(companyId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.config) {
          setEstimateConfig(mergeEffectivePricing(morrisConfig, pricingSliceFromApiResponse(d.config)));
          setFromDb(Boolean(d.fromDb));
        } else {
          setEstimateConfig(morrisConfig);
        }
      })
      .catch(() => setEstimateConfig(morrisConfig))
      .finally(() => setLoading(false));
  }, [companyId]);

  return { estimateConfig, loading, fromDb };
}
