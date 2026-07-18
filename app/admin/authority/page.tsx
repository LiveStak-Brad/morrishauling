"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AUTHORITY_DIVISION_TAGS,
  AUTHORITY_SURFACE_LABELS,
  AUTHORITY_SURFACES,
  COMMUNITY_EVENT_KINDS,
  COMMUNITY_EVENT_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type AuthorityStory,
  type AuthoritySurface,
} from "@/lib/authority/types";
import { toast } from "@/lib/toast";
import { Loader2, Trash2 } from "lucide-react";

const emptyForm = {
  id: undefined as string | undefined,
  title: "",
  description: "",
  summary: "",
  location: "",
  city: "",
  service_category: "",
  property_type: "" as string,
  item_removed: "",
  event_kind: "" as string,
  division_id: "junk_removal",
  surfaces: ["latest_jobs", "gallery"] as AuthoritySurface[],
  before_image_url: "",
  after_image_url: "",
  thumbnail_url: "",
  video_url: "",
  youtube_id: "",
  internal_path: "",
  social_facebook: "",
  social_instagram: "",
  social_tiktok: "",
  social_youtube: "",
  social_x: "",
  published: true,
  featured: false,
  display_order: 0,
};

export default function AdminAuthorityPage() {
  const [stories, setStories] = useState<AuthorityStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/authority/stories").then((r) => r.json());
        if (!cancelled && res.ok) setStories(res.stories ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load stories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    const res = await fetch("/api/admin/authority/stories").then((r) => r.json());
    if (res.ok) setStories(res.stories ?? []);
  }

  function toggleSurface(surface: AuthoritySurface) {
    setForm((f) => ({
      ...f,
      surfaces: f.surfaces.includes(surface)
        ? f.surfaces.filter((s) => s !== surface)
        : [...f.surfaces, surface],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/authority/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          description: form.description || null,
          summary: form.summary || null,
          location: form.location || null,
          city: form.city || null,
          service_category: form.service_category || null,
          property_type: form.property_type || null,
          item_removed: form.item_removed || null,
          event_kind: form.event_kind || null,
          division_id: form.division_id,
          surfaces: form.surfaces,
          before_image_url: form.before_image_url || null,
          after_image_url: form.after_image_url || null,
          thumbnail_url: form.thumbnail_url || null,
          video_url: form.video_url || null,
          youtube_id: form.youtube_id || null,
          internal_path: form.internal_path || null,
          social_links: {
            facebook: form.social_facebook || undefined,
            instagram: form.social_instagram || undefined,
            tiktok: form.social_tiktok || undefined,
            youtube: form.social_youtube || undefined,
            x: form.social_x || undefined,
          },
          published: form.published,
          featured: form.featured,
          display_order: form.display_order,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save failed");
      toast.success(form.id ? "Story updated" : "Story created");
      setForm(emptyForm);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this story?")) return;
    const res = await fetch(`/api/admin/authority/stories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      toast.error(json.error || "Delete failed");
      return;
    }
    toast.success("Deleted");
    await reload();
  }

  return (
    <AdminPageShell
      title="Local Authority Content"
      description="One job story can power Featured Job, Gallery, Videos, Community, Tips, and Reviews — tag surfaces below."
    >
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="space-y-10">
          <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">
              {form.id ? "Edit story" : "Add content card"}
            </h2>
            <Input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              placeholder="Summary (short)"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="City (e.g. Warrenton)"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                placeholder="Location detail"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                placeholder="Service category"
                value={form.service_category}
                onChange={(e) => setForm((f) => ({ ...f, service_category: e.target.value }))}
              />
              <Input
                placeholder="Item removed"
                value={form.item_removed}
                onChange={(e) => setForm((f) => ({ ...f, item_removed: e.target.value }))}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.property_type}
                onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
              >
                <option value="">Property type</option>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PROPERTY_TYPE_LABELS[p]}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.event_kind}
                onChange={(e) => setForm((f) => ({ ...f, event_kind: e.target.value }))}
              >
                <option value="">Community event kind</option>
                {COMMUNITY_EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {COMMUNITY_EVENT_LABELS[k]}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.division_id}
                onChange={(e) => setForm((f) => ({ ...f, division_id: e.target.value }))}
              >
                {AUTHORITY_DIVISION_TAGS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Display order"
                value={form.display_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Before image URL"
                value={form.before_image_url}
                onChange={(e) => setForm((f) => ({ ...f, before_image_url: e.target.value }))}
              />
              <Input
                placeholder="After image URL"
                value={form.after_image_url}
                onChange={(e) => setForm((f) => ({ ...f, after_image_url: e.target.value }))}
              />
              <Input
                placeholder="Thumbnail URL"
                value={form.thumbnail_url}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
              />
              <Input
                placeholder="YouTube ID"
                value={form.youtube_id}
                onChange={(e) => setForm((f) => ({ ...f, youtube_id: e.target.value }))}
              />
              <Input
                placeholder="Video URL"
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              />
              <Input
                placeholder="Internal path (/junk-removal/...)"
                value={form.internal_path}
                onChange={(e) => setForm((f) => ({ ...f, internal_path: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Facebook post URL"
                value={form.social_facebook}
                onChange={(e) => setForm((f) => ({ ...f, social_facebook: e.target.value }))}
              />
              <Input
                placeholder="Instagram post URL"
                value={form.social_instagram}
                onChange={(e) => setForm((f) => ({ ...f, social_instagram: e.target.value }))}
              />
              <Input
                placeholder="TikTok URL"
                value={form.social_tiktok}
                onChange={(e) => setForm((f) => ({ ...f, social_tiktok: e.target.value }))}
              />
              <Input
                placeholder="YouTube URL"
                value={form.social_youtube}
                onChange={(e) => setForm((f) => ({ ...f, social_youtube: e.target.value }))}
              />
              <Input
                placeholder="X URL"
                value={form.social_x}
                onChange={(e) => setForm((f) => ({ ...f, social_x: e.target.value }))}
              />
            </div>
            <fieldset>
              <legend className="text-sm font-semibold">Publish to surfaces</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {AUTHORITY_SURFACES.map((surface) => (
                  <label key={surface} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={form.surfaces.includes(surface)}
                      onChange={() => toggleSurface(surface)}
                    />
                    {AUTHORITY_SURFACE_LABELS[surface]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                Published
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                />
                Featured / spotlight priority
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : form.id ? "Update" : "Create"}
              </Button>
              {form.id ? (
                <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Stories ({stories.length})</h2>
            <ul className="mt-4 divide-y divide-border">
              {stories.map((story) => (
                <li
                  key={story.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {story.title}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        · {story.city || "—"} · {story.published ? "live" : "draft"}
                        {story.featured ? " · featured" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {story.surfaces.map((s) => AUTHORITY_SURFACE_LABELS[s]).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: story.id,
                          title: story.title,
                          description: story.description ?? "",
                          summary: story.summary ?? "",
                          location: story.location ?? "",
                          city: story.city ?? "",
                          service_category: story.service_category ?? "",
                          property_type: story.property_type ?? "",
                          item_removed: story.item_removed ?? "",
                          event_kind: story.event_kind ?? "",
                          division_id: story.division_id,
                          surfaces: story.surfaces,
                          before_image_url: story.before_image_url ?? "",
                          after_image_url: story.after_image_url ?? "",
                          thumbnail_url: story.thumbnail_url ?? "",
                          video_url: story.video_url ?? "",
                          youtube_id: story.youtube_id ?? "",
                          internal_path: story.internal_path ?? "",
                          social_facebook: story.social_links.facebook ?? "",
                          social_instagram: story.social_links.instagram ?? "",
                          social_tiktok: story.social_links.tiktok ?? "",
                          social_youtube: story.social_links.youtube ?? "",
                          social_x: story.social_links.x ?? "",
                          published: story.published,
                          featured: story.featured,
                          display_order: story.display_order,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void remove(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {stories.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">
                  No stories yet. Create one and tag surfaces to fill Video Hub, Gallery, Latest
                  Jobs, and spotlights.
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      )}
    </AdminPageShell>
  );
}
