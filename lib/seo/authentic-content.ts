/**
 * Reusable shells for authentic photography — hide on public site until real content exists.
 * Do not populate with invented projects or stock-as-proof imagery.
 */

export type ProjectStory = {
  id: string;
  title: string;
  summary: string;
  beforeSrc?: string;
  afterSrc?: string;
  locationLabel?: string;
  division?: "junk_removal" | "hauling";
};

export type CrewMember = {
  id: string;
  name: string;
  role: string;
  photoSrc?: string;
  bio?: string;
};

export type FleetItem = {
  id: string;
  name: string;
  description: string;
  photoSrc?: string;
};

/** Returns null when empty — call sites should not render empty marketing sections. */
export function hasPublicPhotoContent(items: unknown[] | null | undefined): boolean {
  return Array.isArray(items) && items.length > 0;
}
