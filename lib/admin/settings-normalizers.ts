import { morrisConfig } from "@/lib/morris-config";
import type { CommonJunkItemConfig } from "@/lib/common-junk-items";

export interface ServiceAreaConfig {
  id: string;
  name: string;
  label: string;
  center: { lat: number; lng: number };
  radiusMiles: number;
  counties: string[];
  zipCodes: string[];
  active: boolean;
  notes: string;
}

export interface ScheduleCapacityConfig {
  defaultJobsPerSlot: number;
  slotsPerDay: number;
  morningWindowStart: string;
  morningWindowEnd: string;
  afternoonWindowStart: string;
  afternoonWindowEnd: string;
  flexibleWindowEnabled: boolean;
  flexibleDiscountAmount: number;
  maxJobsPerDay: number;
  bufferMinutesBetweenJobs: number;
  defaultWindowLabel?: string;
}

export interface PayDefaultsConfig {
  driverHourlyRate: number;
  helperHourlyRate: number;
  overtimeMultiplier: number;
  weeklyPayrollGoal: number;
  defaultPayPeriod: "weekly" | "biweekly" | "semimonthly" | "monthly";
  mileageReimbursement: number;
  bonusRulesNote: string;
}

export interface DocumentTemplateConfig {
  id: string;
  templateType: string;
  label: string;
  version: string;
  header: string;
  footer: string;
  disclaimer: string;
  active: boolean;
  requiresSignature: boolean;
  appliesTo: {
    customer: boolean;
    employee: boolean;
    applicant: boolean;
    contractor: boolean;
  };
}

export interface DisposalCategoryRow {
  id: string;
  name: string;
  acceptedMaterials: string[];
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  active: boolean;
  category: string;
  icon: string;
}

export interface BrandingConfig {
  logo: string;
  heroBanner: string;
  phone: string;
  email: string;
  companyAddress: string;
  serviceAreaCopy: string;
  brandColors: typeof morrisConfig.brandColors;
}

export interface TermsConfig {
  estimateDisclaimer: string;
  companyTerms: string;
  financingDisclaimer: string;
  haulingEstimateDisclaimer: string;
}

export const MO_SERVICE_COUNTIES = [
  "Warren",
  "Lincoln",
  "St. Charles",
  "Franklin",
  "Montgomery",
  "Pike",
  "Gasconade",
  "St. Louis",
  "Jefferson",
  "Cole",
] as const;

const DEFAULT_SCHEDULE: ScheduleCapacityConfig = {
  defaultJobsPerSlot: 4,
  slotsPerDay: 2,
  morningWindowStart: "08:00",
  morningWindowEnd: "12:00",
  afternoonWindowStart: "12:00",
  afternoonWindowEnd: "17:00",
  flexibleWindowEnabled: false,
  flexibleDiscountAmount: 40,
  maxJobsPerDay: 8,
  bufferMinutesBetweenJobs: 30,
  defaultWindowLabel: "10am – 2pm",
};

export function normalizeServiceAreas(raw: unknown): ServiceAreaConfig[] {
  if (Array.isArray(raw)) {
    return raw.map((item, i) => normalizeServiceArea(item, `area-${i}`));
  }
  if (raw && typeof raw === "object") {
    return [normalizeServiceArea(raw, "primary")];
  }
  return [normalizeServiceArea(morrisConfig.serviceArea, "primary")];
}

export function normalizeServiceArea(raw: unknown, fallbackId = "primary"): ServiceAreaConfig {
  const o = (raw ?? {}) as Partial<ServiceAreaConfig> & {
    center?: { lat?: number; lng?: number };
    label?: string;
    zipCodes?: string[];
  };
  return {
    id: o.id ?? fallbackId,
    name: o.name ?? o.label ?? "Primary service area",
    label: o.label ?? o.name ?? morrisConfig.serviceArea.label ?? "",
    center: {
      lat: o.center?.lat ?? morrisConfig.serviceArea.center.lat,
      lng: o.center?.lng ?? morrisConfig.serviceArea.center.lng,
    },
    radiusMiles: o.radiusMiles ?? morrisConfig.serviceArea.radiusMiles ?? 45,
    counties: o.counties ?? [],
    zipCodes: o.zipCodes ?? morrisConfig.serviceArea.zipCodes ?? [],
    active: o.active ?? true,
    notes: o.notes ?? "",
  };
}

export function serviceAreasForSave(areas: ServiceAreaConfig[]): ServiceAreaConfig[] | ServiceAreaConfig {
  if (areas.length === 1) {
    const a = areas[0];
    return {
      id: a.id,
      name: a.name,
      label: a.label,
      center: a.center,
      radiusMiles: a.radiusMiles,
      counties: a.counties,
      zipCodes: a.zipCodes,
      active: a.active,
      notes: a.notes,
    };
  }
  return areas;
}

export function normalizeScheduleCapacity(raw: unknown): ScheduleCapacityConfig {
  const o = (raw ?? {}) as Partial<ScheduleCapacityConfig> & {
    defaultMaxJobsPerSlot?: number;
  };
  return {
    ...DEFAULT_SCHEDULE,
    defaultJobsPerSlot: o.defaultJobsPerSlot ?? o.defaultMaxJobsPerSlot ?? DEFAULT_SCHEDULE.defaultJobsPerSlot,
    slotsPerDay: o.slotsPerDay ?? DEFAULT_SCHEDULE.slotsPerDay,
    morningWindowStart: o.morningWindowStart ?? DEFAULT_SCHEDULE.morningWindowStart,
    morningWindowEnd: o.morningWindowEnd ?? DEFAULT_SCHEDULE.morningWindowEnd,
    afternoonWindowStart: o.afternoonWindowStart ?? DEFAULT_SCHEDULE.afternoonWindowStart,
    afternoonWindowEnd: o.afternoonWindowEnd ?? DEFAULT_SCHEDULE.afternoonWindowEnd,
    flexibleWindowEnabled: o.flexibleWindowEnabled ?? DEFAULT_SCHEDULE.flexibleWindowEnabled,
    flexibleDiscountAmount: o.flexibleDiscountAmount ?? DEFAULT_SCHEDULE.flexibleDiscountAmount,
    maxJobsPerDay: o.maxJobsPerDay ?? DEFAULT_SCHEDULE.maxJobsPerDay,
    bufferMinutesBetweenJobs: o.bufferMinutesBetweenJobs ?? DEFAULT_SCHEDULE.bufferMinutesBetweenJobs,
    defaultWindowLabel: o.defaultWindowLabel ?? DEFAULT_SCHEDULE.defaultWindowLabel,
  };
}

export function normalizePayDefaults(raw: unknown): PayDefaultsConfig {
  const o = (raw ?? {}) as Partial<PayDefaultsConfig>;
  return {
    driverHourlyRate: o.driverHourlyRate ?? morrisConfig.haulingPricing.driverHourlyRate,
    helperHourlyRate: o.helperHourlyRate ?? morrisConfig.junkRemovalPricing.helperHourlyRate,
    overtimeMultiplier: o.overtimeMultiplier ?? 1.5,
    weeklyPayrollGoal: o.weeklyPayrollGoal ?? morrisConfig.operationsGoals?.weeklyPayrollAmount ?? 2841,
    defaultPayPeriod: o.defaultPayPeriod ?? "weekly",
    mileageReimbursement: o.mileageReimbursement ?? 0.67,
    bonusRulesNote: o.bonusRulesNote ?? "",
  };
}

function normalizeOneTemplate(id: string, raw: unknown): DocumentTemplateConfig {
  const o = (raw ?? {}) as Partial<DocumentTemplateConfig> & {
    disclaimer?: string;
    footer?: string;
  };
  return {
    id,
    templateType: o.templateType ?? id,
    label: o.label ?? id,
    version: o.version ?? "1.0",
    header: o.header ?? "",
    footer: o.footer ?? "",
    disclaimer: o.disclaimer ?? "",
    active: o.active ?? true,
    requiresSignature: o.requiresSignature ?? false,
    appliesTo: {
      customer: o.appliesTo?.customer ?? (id.includes("invoice") || id.includes("estimate")),
      employee: o.appliesTo?.employee ?? false,
      applicant: o.appliesTo?.applicant ?? false,
      contractor: o.appliesTo?.contractor ?? false,
    },
  };
}

export function normalizeDocumentTemplates(raw: unknown): DocumentTemplateConfig[] {
  if (Array.isArray(raw)) {
    return raw.map((t, i) => normalizeOneTemplate(String((t as DocumentTemplateConfig).id ?? i), t));
  }
  const defaults = {
    invoice: { label: "Standard invoice", version: "1.0", footer: morrisConfig.companyName },
    estimate: { label: "Junk removal estimate", version: "1.0", disclaimer: morrisConfig.estimateDisclaimer },
    haulingEstimate: {
      label: "Hauling estimate",
      version: "1.0",
      disclaimer: morrisConfig.haulingEstimateDisclaimer,
    },
  };
  const merged = { ...defaults, ...(raw as object | undefined) };
  return Object.entries(merged).map(([key, val]) => normalizeOneTemplate(key, val));
}

export function documentTemplatesForSave(templates: DocumentTemplateConfig[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of templates) {
    const key = t.templateType || t.id;
    out[key] = {
      templateType: t.templateType,
      label: t.label,
      version: t.version,
      header: t.header,
      footer: t.footer,
      disclaimer: t.disclaimer,
      active: t.active,
      requiresSignature: t.requiresSignature,
      appliesTo: t.appliesTo,
    };
  }
  return out;
}

export function normalizeEquipmentCategories(raw: unknown): string[] {
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) return raw as string[];
  return ["truck", "trailer", "dolly", "strap", "tool", "uniform", "electronics", "general"];
}

export function normalizeItemPrices(raw: unknown): CommonJunkItemConfig[] {
  if (Array.isArray(raw) && raw.length) return raw as CommonJunkItemConfig[];
  return morrisConfig.commonJunkItems;
}

export function normalizeDisposalCategories(raw: unknown): DisposalCategoryRow[] {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((row, i) => {
      const r = row as Partial<DisposalCategoryRow>;
      return {
        id: r.id ?? `cat-${i}`,
        name: r.name ?? "Unnamed",
        acceptedMaterials: r.acceptedMaterials ?? [],
      };
    });
  }
  return morrisConfig.dumpSites.map((d) => ({
    id: d.id,
    name: d.name,
    acceptedMaterials: d.acceptedMaterials ?? [],
  }));
}

export function normalizeServicesCatalog(raw: unknown): ServiceCatalogItem[] {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((s, i) => {
      const item = s as Partial<ServiceCatalogItem>;
      return {
        id: item.id ?? `svc-${i}`,
        name: item.name ?? "Service",
        description: item.description ?? "",
        basePrice: item.basePrice ?? 0,
        active: item.active ?? true,
        category: item.category ?? "general",
        icon: item.icon ?? "",
      };
    });
  }
  return morrisConfig.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    basePrice: 0,
    active: true,
    category: s.id,
    icon: "",
  }));
}

export function normalizeBranding(raw: unknown): BrandingConfig {
  const o = (raw ?? {}) as Partial<BrandingConfig>;
  return {
    logo: o.logo ?? morrisConfig.logo,
    heroBanner: o.heroBanner ?? morrisConfig.heroBanner ?? "",
    phone: o.phone ?? morrisConfig.phone,
    email: o.email ?? morrisConfig.email,
    companyAddress: o.companyAddress ?? morrisConfig.companyAddress ?? "",
    serviceAreaCopy: o.serviceAreaCopy ?? morrisConfig.serviceArea.label ?? "",
    brandColors: { ...morrisConfig.brandColors, ...o.brandColors },
  };
}

export function normalizeTerms(raw: unknown): TermsConfig {
  const o = (raw ?? {}) as Partial<TermsConfig>;
  return {
    estimateDisclaimer: o.estimateDisclaimer ?? morrisConfig.estimateDisclaimer,
    companyTerms: o.companyTerms ?? morrisConfig.companyTerms,
    financingDisclaimer: o.financingDisclaimer ?? morrisConfig.financingDisclaimer,
    haulingEstimateDisclaimer: o.haulingEstimateDisclaimer ?? morrisConfig.haulingEstimateDisclaimer,
  };
}

export type HaulingRatesConfig = typeof morrisConfig.haulingPricing;

export function normalizeHaulingRates(raw: unknown): HaulingRatesConfig {
  return { ...morrisConfig.haulingPricing, ...(raw as object | undefined) };
}
