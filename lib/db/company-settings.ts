import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { morrisConfig } from "@/lib/morris-config";
import { COMMON_JUNK_ITEMS } from "@/lib/common-junk-items";
import { isDbReady } from "@/lib/db/operations";

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export type CompanySettingKey =
  | "pricing.load_tiers"
  | "pricing.modifiers"
  | "pricing.item_prices"
  | "pricing.hauling_rates"
  | "pricing.disposal_categories"
  | "service.areas"
  | "schedule.capacity"
  | "pay.defaults"
  | "employment.types"
  | "equipment.categories"
  | "document.templates";

export async function getCompanySettingsMap(
  companyId: string
): Promise<Record<string, unknown>> {
  if (!(await isDbReady())) return {};
  const { data, error } = await (await createClient())
    .from("company_settings")
    .select("setting_key, setting_value")
    .eq("company_id", companyId);
  if (error) throw error;
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[String(row.setting_key)] = row.setting_value;
  }
  return map;
}

export async function upsertCompanySetting(
  companyId: string,
  settingKey: string,
  settingValue: unknown
) {
  const settingId = `set-${settingKey.replace(/\./g, "-")}`;
  const { error } = await (await sbWrite()).from("company_settings").upsert({
    id: settingId,
    company_id: companyId,
    setting_key: settingKey,
    setting_value: settingValue,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Pricing rules with DB override; falls back to morris-config defaults. */
export async function getEffectivePricingRules(companyId: string) {
  const settings = await getCompanySettingsMap(companyId);
  return {
    loadTiers:
      (settings["pricing.load_tiers"] as typeof morrisConfig.pricingRules.loadTiers) ??
      morrisConfig.pricingRules.loadTiers,
    modifiers:
      (settings["pricing.modifiers"] as typeof morrisConfig.pricingRules.modifiers) ??
      morrisConfig.pricingRules.modifiers,
    minCharge:
      (settings["pricing.min_charge"] as number | undefined) ?? morrisConfig.pricingRules.minCharge,
    dumpFee:
      (settings["pricing.dump_fee"] as number | undefined) ?? morrisConfig.pricingRules.dumpFee,
    itemSurcharge:
      (settings["pricing.item_surcharge"] as number | undefined) ??
      morrisConfig.pricingRules.itemSurcharge,
    haulingRates:
      (settings["pricing.hauling_rates"] as typeof morrisConfig.haulingPricing) ??
      morrisConfig.haulingPricing,
    disposalCategories:
      (settings["pricing.disposal_categories"] as unknown[]) ??
      morrisConfig.dumpSites.map((d) => ({
        id: d.id,
        name: d.name,
        acceptedMaterials: d.acceptedMaterials,
      })),
    itemPrices:
      (settings["pricing.item_prices"] as typeof COMMON_JUNK_ITEMS) ?? COMMON_JUNK_ITEMS,
  };
}

export async function getEffectiveScheduleCapacity(companyId: string) {
  const settings = await getCompanySettingsMap(companyId);
  const defaults = {
    defaultMaxJobsPerSlot: 4,
    defaultWindowLabel: "10am – 2pm",
    slotsPerDay: 2,
  };
  return { ...defaults, ...(settings["schedule.capacity"] as object | undefined) };
}

export async function getEffectivePayDefaults(companyId: string) {
  const settings = await getCompanySettingsMap(companyId);
  const defaults = {
    driverHourlyRate: morrisConfig.haulingPricing.driverHourlyRate,
    helperHourlyRate: morrisConfig.junkRemovalPricing.helperHourlyRate,
    overtimeMultiplier: 1.5,
    weeklyPayrollGoal: morrisConfig.operationsGoals.weeklyPayrollAmount,
  };
  return { ...defaults, ...(settings["pay.defaults"] as object | undefined) };
}

export async function getEffectiveDocumentTemplates(companyId: string) {
  const settings = await getCompanySettingsMap(companyId);
  const defaults = {
    invoice: { label: "Standard invoice", version: "1.0", footer: morrisConfig.companyName },
    estimate: { label: "Junk removal estimate", version: "1.0", disclaimer: morrisConfig.estimateDisclaimer },
    haulingEstimate: {
      label: "Hauling estimate",
      version: "1.0",
      disclaimer: morrisConfig.haulingEstimateDisclaimer,
    },
  };
  return { ...defaults, ...(settings["document.templates"] as object | undefined) };
}

export async function getAllEffectiveSettings(companyId: string) {
  const [pricing, serviceArea, scheduleCapacity, payDefaults, documentTemplates, equipmentCategories] =
    await Promise.all([
      getEffectivePricingRules(companyId),
      getEffectiveServiceArea(companyId),
      getEffectiveScheduleCapacity(companyId),
      getEffectivePayDefaults(companyId),
      getEffectiveDocumentTemplates(companyId),
      getEffectiveEquipmentCategories(companyId),
    ]);
  return {
    pricing,
    serviceArea,
    scheduleCapacity,
    payDefaults,
    documentTemplates,
    equipmentCategories,
  };
}

export async function getEffectiveServiceArea(companyId: string) {
  const settings = await getCompanySettingsMap(companyId);
  const raw = settings["service.areas"];
  if (Array.isArray(raw)) {
    const active = (raw as { active?: boolean }[]).find((a) => a.active !== false) ?? raw[0];
    return { ...morrisConfig.serviceArea, ...(active as object) };
  }
  const area = raw as Partial<typeof morrisConfig.serviceArea> | undefined;
  return { ...morrisConfig.serviceArea, ...area };
}

export async function getEffectiveEquipmentCategories(companyId: string): Promise<string[]> {
  const settings = await getCompanySettingsMap(companyId);
  const fromDb = settings["equipment.categories"] as string[] | undefined;
  if (fromDb?.length) return fromDb;
  return ["truck", "trailer", "dolly", "strap", "tool", "uniform", "electronics", "general"];
}
