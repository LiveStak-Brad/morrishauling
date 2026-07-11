import type { CoverageCounty } from "./types";

/** Expandable county registry — add rows as Morris Services enters new markets. */
export const DISPOSAL_COVERAGE_COUNTIES: CoverageCounty[] = [
  // Missouri — core / near-term
  { id: "mo-warren", state: "MO", county: "Warren", tier: "core", status: "no_local_msw_facility", notes: "No DNR-listed operating sanitary landfill or transfer station in-county. Primary MSW tip: Meridian Foristell. Recycling: East Central Missouri Recycling Center (Warrenton)." },
  { id: "mo-st-charles", state: "MO", county: "St. Charles", tier: "core", status: "active", notes: "Meridian Foristell transfer; O'Fallon city transfer (resident-oriented); Recycle Works Central/West." },
  { id: "mo-lincoln", state: "MO", county: "Lincoln", tier: "core", status: "active", notes: "Meridian Winfield transfer (DNR-listed)." },
  { id: "mo-franklin", state: "MO", county: "Franklin", tier: "core", status: "active", notes: "City of Washington (Struckhoff) sanitary landfill (DNR-listed)." },
  { id: "mo-jefferson", state: "MO", county: "Jefferson", tier: "expansion", status: "active", notes: "WM DeSoto and Kimmswick transfer stations (DNR-listed). No operating sanitary landfill in-county on DNR list." },
  { id: "mo-st-louis", state: "MO", county: "St. Louis", tier: "expansion", status: "active", notes: "Champ Landfill; Bridgeton, Valley Park (FW Disposal), University City transfers; Rock Hill demolition landfill." },
  { id: "mo-st-louis-city", state: "MO", county: "St. Louis City", tier: "expansion", status: "active", notes: "Multiple DNR-listed city transfer/processing facilities — verify commercial access per site before routing." },
  { id: "mo-washington", state: "MO", county: "Washington", tier: "expansion", status: "active", notes: "Timber Ridge Landfill (Richwoods); CWI-Potosi transfer (Cadet) — geocode/confirm before first use." },
  { id: "mo-st-francois", state: "MO", county: "St. Francois", tier: "expansion", status: "active", notes: "St. Francois County Solid Waste Transfer Station (Park Hills)." },
  { id: "mo-crawford", state: "MO", county: "Crawford", tier: "expansion", status: "active", notes: "Prairie Valley Landfill (Cuba)." },
  { id: "mo-gasconade", state: "MO", county: "Gasconade", tier: "adjacent", status: "no_local_msw_facility", notes: "No DNR-listed operating transfer/sanitary landfill in-county. Route to Franklin (Struckhoff) or Crawford (Prairie Valley)." },
  { id: "mo-montgomery", state: "MO", county: "Montgomery", tier: "adjacent", status: "no_local_msw_facility", notes: "No DNR-listed operating transfer/sanitary landfill in-county. Recycling via East Central Missouri Recycling Center service area; MSW tip via Meridian Foristell or Struckhoff." },
  // Illinois — Metro East
  { id: "il-st-clair", state: "IL", county: "St. Clair", tier: "expansion", status: "active", notes: "Milam RDF (East St. Louis); Cottonwood Hills RDF (Marissa) — St. Clair County Health / WM." },
  { id: "il-madison", state: "IL", county: "Madison", tier: "expansion", status: "active", notes: "Roxana Landfill (Edwardsville) — Republic Services / IEPA NPDES facility." },
  { id: "il-monroe", state: "IL", county: "Monroe", tier: "expansion", status: "active", notes: "Monroe County Recycling Center / dump site (Waterloo) — county health department; confirm commercial hauler rules before routing." },
];
