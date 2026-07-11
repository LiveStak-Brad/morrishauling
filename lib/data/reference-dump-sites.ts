/**
 * @deprecated Prefer lib/data/disposal-network (verified catalog + migration 040).
 * Kept as a thin re-export for older scripts/docs that import REFERENCE_DUMP_SITES.
 */

import { VERIFIED_DISPOSAL_FACILITIES } from "@/lib/data/disposal-network/facilities";
import type { ReferenceDumpSiteSeed } from "./reference-dump-sites-types";

export type { ReferenceDumpSiteSeed } from "./reference-dump-sites-types";

/** Legacy shape mapped from the verified network (active sites with coordinates). */
export const REFERENCE_DUMP_SITES: ReferenceDumpSiteSeed[] = VERIFIED_DISPOSAL_FACILITIES.filter(
  (f) => f.status === "active" && f.latitude != null && f.longitude != null
).map((f) => ({
  id: f.id,
  name: f.name,
  address: f.address,
  city: f.city,
  state: f.state,
  zip: f.zip,
  county: f.county,
  latitude: f.latitude!,
  longitude: f.longitude!,
  phone: f.phone,
  website: f.website,
  acceptedMaterials: f.acceptedMaterials,
  restrictions: f.specialRequirements,
  feeType: f.feeType ?? "weight",
  baseFee: f.baseFee ?? undefined,
  perTonFee: f.perTonFee ?? undefined,
  minimumFee: f.minimumFee ?? undefined,
  hoursJson: f.hoursJson,
  notes: [f.operationalNotes, f.internalNotes].filter(Boolean).join(" "),
}));
