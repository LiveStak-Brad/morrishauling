import { morrisConfig } from "@/lib/morris-config";
import { getEffectiveMorrisConfig } from "@/lib/pricing/effective-config";
import { getCompanySettingsMap } from "@/lib/db/company-settings";
import { apiOk, apiError } from "@/lib/api/route-utils";

/** Public read — pricing used by /book and /pricing (no secrets). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? morrisConfig.companyId;

    const [settings, { config }] = await Promise.all([
      getCompanySettingsMap(companyId),
      getEffectiveMorrisConfig(companyId),
    ]);
    const fromDb = Object.keys(settings).some((k) => k.startsWith("pricing."));

    return apiOk({
      config: {
        pricingRules: config.pricingRules,
        commonJunkItems: config.commonJunkItems,
        haulingPricing: config.haulingPricing,
        junkRemovalPricing: config.junkRemovalPricing,
        estimateDisclaimer: config.estimateDisclaimer,
        haulingEstimateDisclaimer: config.haulingEstimateDisclaimer,
      },
      fromDb,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load pricing", 500);
  }
}
