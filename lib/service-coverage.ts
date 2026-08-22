/**
 * Public service-coverage source of truth.
 *
 * Operational routing still uses radius/ZIP rules in lib/geo/service-area.ts.
 * This module is for customer-facing copy, metadata, schema, and forms.
 *
 * A listed county is not a guarantee of service. Availability and travel
 * depend on project type, access, and current capacity.
 */

import type { DivisionId } from "@/lib/divisions";

export type CoverageCounty = {
  id: string;
  name: string;
  shortName: string;
};

export const COMPANY_PRIMARY_COUNTIES: readonly CoverageCounty[] = [
  { id: "warren", name: "Warren County", shortName: "Warren" },
  { id: "lincoln", name: "Lincoln County", shortName: "Lincoln" },
  { id: "st_charles", name: "St. Charles County", shortName: "St. Charles" },
] as const;

export const EXTENDED_SERVICE_COUNTIES: readonly CoverageCounty[] = [
  { id: "franklin", name: "Franklin County", shortName: "Franklin" },
  { id: "jefferson", name: "Jefferson County", shortName: "Jefferson" },
] as const;

export const ALL_PUBLIC_COUNTIES: readonly CoverageCounty[] = [
  ...COMPANY_PRIMARY_COUNTIES,
  ...EXTENDED_SERVICE_COUNTIES,
] as const;

export type DivisionCoverage = {
  primary: readonly CoverageCounty[];
  extended: readonly CoverageCounty[];
};

/** Narrower coverage later — empty means inherit the company default. */
export const DIVISION_SERVICE_AREAS: Partial<Record<DivisionId, DivisionCoverage>> = {};

export function coverageForDivision(divisionId?: DivisionId): DivisionCoverage {
  const override = divisionId ? DIVISION_SERVICE_AREAS[divisionId] : undefined;
  return {
    primary: override?.primary ?? COMPANY_PRIMARY_COUNTIES,
    extended: override?.extended ?? EXTENDED_SERVICE_COUNTIES,
  };
}

export function allCoverageCounties(divisionId?: DivisionId): CoverageCounty[] {
  const { primary, extended } = coverageForDivision(divisionId);
  return [...primary, ...extended];
}

export function countyShortNames(counties: readonly CoverageCounty[]): string[] {
  return counties.map((c) => c.shortName);
}

export function countyFullNames(counties: readonly CoverageCounty[]): string[] {
  return counties.map((c) => c.name);
}

export function joinCountyNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

export function joinCountyNamesNatural(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** Compact UI label: "Warren, Lincoln, St. Charles, Franklin & Jefferson Counties, MO" */
export function serviceAreaShortLabel(divisionId?: DivisionId): string {
  return `${joinCountyNames(countyShortNames(allCoverageCounties(divisionId)))} Counties, MO`;
}

/** SEO / schema label */
export function serviceAreaSeoLabel(divisionId?: DivisionId): string {
  return `${joinCountyNames(countyShortNames(allCoverageCounties(divisionId)))} Counties, Missouri`;
}

export function primaryCountiesShortLabel(divisionId?: DivisionId): string {
  return `${joinCountyNames(countyShortNames(coverageForDivision(divisionId).primary))} Counties`;
}

export const SERVICE_AREA_AVAILABILITY_NOTE =
  "Availability and travel depend on project type.";

export const SERVICE_AREA_PUBLIC_BLURB = `Primary and extended service throughout ${joinCountyNamesNatural(
  countyShortNames(ALL_PUBLIC_COUNTIES)
)} Counties. Availability and travel depend on project type.`;

export const HOME_MARKET_LABEL = "Warrenton / Warren County";
