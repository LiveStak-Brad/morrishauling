import { createClient } from "@/lib/supabase/server";
import type { SocialContentKind, SocialPlatformId } from "@/lib/social/config";

export type SocialPostRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  platform: SocialPlatformId;
  description: string | null;
  location: string | null;
  service_type: string | null;
  content_kind: SocialContentKind;
  destination_url: string;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function listPublishedSocialPosts(limit = 8): Promise<SocialPostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SocialPostRow[];
}

export async function listAllSocialPosts(): Promise<SocialPostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SocialPostRow[];
}

export async function upsertSocialPost(input: {
  id?: string;
  title: string;
  thumbnail_url?: string | null;
  platform: SocialPlatformId;
  description?: string | null;
  location?: string | null;
  service_type?: string | null;
  content_kind: SocialContentKind;
  destination_url: string;
  published: boolean;
  display_order: number;
}): Promise<SocialPostRow> {
  const supabase = await createClient();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    thumbnail_url: input.thumbnail_url ?? null,
    platform: input.platform,
    description: input.description ?? null,
    location: input.location ?? null,
    service_type: input.service_type ?? null,
    content_kind: input.content_kind,
    destination_url: input.destination_url,
    published: input.published,
    display_order: input.display_order,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("social_posts")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SocialPostRow;
}

export async function deleteSocialPost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("social_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function recordSocialClick(input: {
  platform: SocialPlatformId;
  surface: string;
  path?: string;
  device?: string;
  referrer_host?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("social_click_events").insert({
    platform: input.platform,
    surface: input.surface,
    path: input.path ?? null,
    device: input.device ?? null,
    referrer_host: input.referrer_host ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function socialClickStats(days: 7 | 30) {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("social_click_events")
    .select("platform, surface, path, created_at")
    .gte("created_at", since);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const byPlatform: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  const bySurface: Record<string, number> = {};
  for (const row of rows) {
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + 1;
    const path = row.path || "/";
    byPath[path] = (byPath[path] ?? 0) + 1;
    bySurface[row.surface] = (bySurface[row.surface] ?? 0) + 1;
  }
  const topPlatform =
    Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    days,
    total: rows.length,
    byPlatform,
    byPath,
    bySurface,
    topPlatform,
  };
}
