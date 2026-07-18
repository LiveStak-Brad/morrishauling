import { createClient } from "@/lib/supabase/server";
import type {
  AuthorityDivisionTag,
  AuthoritySocialLinks,
  AuthorityStory,
  AuthoritySurface,
  CommunityEventKind,
  PropertyType,
} from "@/lib/authority/types";

type Row = {
  id: string;
  division_id: string;
  title: string;
  description: string | null;
  summary: string | null;
  location: string | null;
  city: string | null;
  service_category: string | null;
  property_type: string | null;
  item_removed: string | null;
  event_kind: string | null;
  surfaces: string[] | null;
  before_image_url: string | null;
  after_image_url: string | null;
  photo_urls: string[] | null;
  video_url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  internal_path: string | null;
  social_links: AuthoritySocialLinks | null;
  published: boolean;
  published_at: string | null;
  display_order: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): AuthorityStory {
  return {
    id: row.id,
    division_id: row.division_id as AuthorityDivisionTag,
    title: row.title,
    description: row.description,
    summary: row.summary,
    location: row.location,
    city: row.city,
    service_category: row.service_category,
    property_type: (row.property_type as PropertyType | null) ?? null,
    item_removed: row.item_removed,
    event_kind: (row.event_kind as CommunityEventKind | null) ?? null,
    surfaces: (row.surfaces ?? []) as AuthoritySurface[],
    before_image_url: row.before_image_url,
    after_image_url: row.after_image_url,
    photo_urls: row.photo_urls ?? [],
    video_url: row.video_url,
    youtube_id: row.youtube_id,
    thumbnail_url: row.thumbnail_url,
    internal_path: row.internal_path,
    social_links: row.social_links ?? {},
    published: row.published,
    published_at: row.published_at,
    display_order: row.display_order,
    featured: row.featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type AuthorityStoryFilter = {
  surface?: AuthoritySurface;
  city?: string;
  serviceCategory?: string;
  propertyType?: PropertyType;
  itemRemoved?: string;
  divisionId?: AuthorityDivisionTag;
  featuredOnly?: boolean;
  limit?: number;
};

export async function listPublishedAuthorityStories(
  filter: AuthorityStoryFilter = {}
): Promise<AuthorityStory[]> {
  const supabase = await createClient();
  let query = supabase
    .from("authority_stories")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (filter.surface) query = query.contains("surfaces", [filter.surface]);
  if (filter.city) query = query.ilike("city", filter.city);
  if (filter.serviceCategory) query = query.ilike("service_category", filter.serviceCategory);
  if (filter.propertyType) query = query.eq("property_type", filter.propertyType);
  if (filter.itemRemoved) query = query.ilike("item_removed", `%${filter.itemRemoved}%`);
  if (filter.divisionId) query = query.eq("division_id", filter.divisionId);
  if (filter.featuredOnly) query = query.eq("featured", true);
  if (filter.limit) query = query.limit(filter.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function getSpotlightStory(
  surface: AuthoritySurface
): Promise<AuthorityStory | null> {
  const rows = await listPublishedAuthorityStories({
    surface,
    featuredOnly: true,
    limit: 1,
  });
  if (rows[0]) return rows[0];
  const fallback = await listPublishedAuthorityStories({ surface, limit: 1 });
  return fallback[0] ?? null;
}

export async function listAllAuthorityStories(): Promise<AuthorityStory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("authority_stories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function upsertAuthorityStory(input: {
  id?: string;
  division_id?: AuthorityDivisionTag;
  title: string;
  description?: string | null;
  summary?: string | null;
  location?: string | null;
  city?: string | null;
  service_category?: string | null;
  property_type?: PropertyType | null;
  item_removed?: string | null;
  event_kind?: CommunityEventKind | null;
  surfaces: AuthoritySurface[];
  before_image_url?: string | null;
  after_image_url?: string | null;
  photo_urls?: string[];
  video_url?: string | null;
  youtube_id?: string | null;
  thumbnail_url?: string | null;
  internal_path?: string | null;
  social_links?: AuthoritySocialLinks;
  published: boolean;
  published_at?: string | null;
  display_order?: number;
  featured?: boolean;
}): Promise<AuthorityStory> {
  const supabase = await createClient();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    division_id: input.division_id ?? "junk_removal",
    title: input.title,
    description: input.description ?? null,
    summary: input.summary ?? null,
    location: input.location ?? null,
    city: input.city ?? null,
    service_category: input.service_category ?? null,
    property_type: input.property_type ?? null,
    item_removed: input.item_removed ?? null,
    event_kind: input.event_kind ?? null,
    surfaces: input.surfaces,
    before_image_url: input.before_image_url ?? null,
    after_image_url: input.after_image_url ?? null,
    photo_urls: input.photo_urls ?? [],
    video_url: input.video_url ?? null,
    youtube_id: input.youtube_id ?? null,
    thumbnail_url: input.thumbnail_url ?? null,
    internal_path: input.internal_path ?? null,
    social_links: input.social_links ?? {},
    published: input.published,
    published_at:
      input.published_at ??
      (input.published ? new Date().toISOString() : null),
    display_order: input.display_order ?? 0,
    featured: Boolean(input.featured),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("authority_stories")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

export async function deleteAuthorityStory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("authority_stories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
