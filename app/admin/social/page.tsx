"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SOCIAL_CONTENT_KINDS,
  SOCIAL_CONTENT_KIND_LABELS,
  SOCIAL_PLATFORMS,
  WARRENTON_JUNK_SOCIAL,
  type SocialContentKind,
  type SocialPlatformId,
} from "@/lib/social/config";
import { toast } from "@/lib/toast";
import { Loader2, Trash2 } from "lucide-react";

type Post = {
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
};

type Stats = {
  days: number;
  total: number;
  byPlatform: Record<string, number>;
  byPath: Record<string, number>;
  topPlatform: string | null;
};

const emptyForm = {
  id: undefined as string | undefined,
  title: "",
  thumbnail_url: "",
  platform: "facebook" as SocialPlatformId,
  description: "",
  location: "",
  service_type: "",
  content_kind: "video" as SocialContentKind,
  destination_url: "",
  published: true,
  display_order: 0,
};

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats7, setStats7] = useState<Stats | null>(null);
  const [stats30, setStats30] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    try {
      const [postsRes, s7, s30] = await Promise.all([
        fetch("/api/admin/social/posts").then((r) => r.json()),
        fetch("/api/admin/social/stats?days=7").then((r) => r.json()),
        fetch("/api/admin/social/stats?days=30").then((r) => r.json()),
      ]);
      if (postsRes.ok) setPosts(postsRes.posts ?? []);
      if (s7.ok) setStats7(s7.stats);
      if (s30.ok) setStats30(s30.stats);
    } catch {
      toast.error("Failed to load social data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [postsRes, s7, s30] = await Promise.all([
          fetch("/api/admin/social/posts").then((r) => r.json()),
          fetch("/api/admin/social/stats?days=7").then((r) => r.json()),
          fetch("/api/admin/social/stats?days=30").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (postsRes.ok) setPosts(postsRes.posts ?? []);
        if (s7.ok) setStats7(s7.stats);
        if (s30.ok) setStats30(s30.stats);
      } catch {
        if (!cancelled) toast.error("Failed to load social data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function savePost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          thumbnail_url: form.thumbnail_url || null,
          description: form.description || null,
          location: form.location || null,
          service_type: form.service_type || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save failed");
      toast.success(form.id ? "Post updated" : "Post created");
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("Delete this featured post?")) return;
    const res = await fetch(`/api/admin/social/posts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      toast.error(json.error || "Delete failed");
      return;
    }
    toast.success("Deleted");
    await load();
  }

  return (
    <AdminPageShell
      title="Social (@WarrentonJunk)"
      description="Featured posts, platform links, and follow analytics for the social brand."
    >
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading social…
        </div>
      ) : (
        <div className="space-y-10">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Brand & platform URLs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Display name: {WARRENTON_JUNK_SOCIAL.displayName}. URLs are centralized in{" "}
              <code className="text-xs">lib/social/config.ts</code> — edit there to change
              profiles site-wide.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {SOCIAL_PLATFORMS.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 font-medium">{p.name}</span>
                  <a
                    href={p.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline"
                  >
                    {p.profileUrl}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {p.enabled ? "enabled" : "disabled"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <StatsCard title="Last 7 days" stats={stats7} />
            <StatsCard title="Last 30 days" stats={stats30} />
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">
              {form.id ? "Edit featured post" : "Add featured post"}
            </h2>
            <form onSubmit={savePost} className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                required
                placeholder="Destination URL"
                value={form.destination_url}
                onChange={(e) => setForm((f) => ({ ...f, destination_url: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Thumbnail URL"
                value={form.thumbnail_url}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                className="sm:col-span-2"
              />
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Location (e.g. Warrenton, MO)"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                placeholder="Service type"
                value={form.service_type}
                onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.platform}
                onChange={(e) =>
                  setForm((f) => ({ ...f, platform: e.target.value as SocialPlatformId }))
                }
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.content_kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content_kind: e.target.value as SocialContentKind }))
                }
              >
                {SOCIAL_CONTENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {SOCIAL_CONTENT_KIND_LABELS[k]}
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                Published / visible
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Update post" : "Create post"}
                </Button>
                {form.id ? (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Featured posts ({posts.length})</h2>
            <ul className="mt-4 divide-y divide-border">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {post.title}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        · {post.platform} · {SOCIAL_CONTENT_KIND_LABELS[post.content_kind]} ·{" "}
                        {post.published ? "live" : "hidden"} · order {post.display_order}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{post.destination_url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: post.id,
                          title: post.title,
                          thumbnail_url: post.thumbnail_url ?? "",
                          platform: post.platform,
                          description: post.description ?? "",
                          location: post.location ?? "",
                          service_type: post.service_type ?? "",
                          content_kind: post.content_kind,
                          destination_url: post.destination_url,
                          published: post.published,
                          display_order: post.display_order,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void removePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {posts.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">
                  No featured posts yet. Add one above to populate “Latest From @WarrentonJunk”.
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      )}
    </AdminPageShell>
  );
}

function StatsCard({ title, stats }: { title: string; stats: Stats | null }) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {title}: no data yet
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.total}</p>
      <p className="text-xs text-muted-foreground">total clicks</p>
      <p className="mt-3 text-sm">
        Top platform:{" "}
        <span className="font-medium">{stats.topPlatform ?? "—"}</span>
      </p>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {Object.entries(stats.byPlatform)
          .sort((a, b) => b[1] - a[1])
          .map(([platform, count]) => (
            <li key={platform}>
              {platform}: {count}
            </li>
          ))}
      </ul>
    </div>
  );
}
