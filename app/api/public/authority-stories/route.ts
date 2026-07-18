import { apiOk } from "@/lib/api/route-utils";
import { listPublishedAuthorityStories } from "@/lib/db/authority-stories";
import {
  AUTHORITY_SURFACES,
  PROPERTY_TYPES,
  type AuthoritySurface,
  type PropertyType,
} from "@/lib/authority/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const surfaceRaw = searchParams.get("surface");
    const surface =
      surfaceRaw && (AUTHORITY_SURFACES as readonly string[]).includes(surfaceRaw)
        ? (surfaceRaw as AuthoritySurface)
        : undefined;
    const propertyRaw = searchParams.get("propertyType");
    const propertyType =
      propertyRaw && (PROPERTY_TYPES as readonly string[]).includes(propertyRaw)
        ? (propertyRaw as PropertyType)
        : undefined;

    const stories = await listPublishedAuthorityStories({
      surface,
      city: searchParams.get("city") || undefined,
      serviceCategory: searchParams.get("serviceCategory") || undefined,
      propertyType,
      itemRemoved: searchParams.get("itemRemoved") || undefined,
      featuredOnly: searchParams.get("featured") === "1",
      limit: Math.min(Number(searchParams.get("limit") || 24) || 24, 48),
    });

    return apiOk({ stories });
  } catch (e) {
    return apiOk({
      stories: [],
      warning: e instanceof Error ? e.message : "unavailable",
    });
  }
}
