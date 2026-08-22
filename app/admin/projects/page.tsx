"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALL_DIVISION_IDS, getDivision, isEquipmentDivision } from "@/lib/divisions";

type Project = {
  id: string;
  slug: string;
  title: string;
  divisionId: string;
  published: boolean;
  city: string | null;
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    divisionId: "land_clearing",
    city: "",
    county: "",
    serviceSlug: "",
    customerGoal: "",
    workCompleted: "",
    published: false,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/published-projects");
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Failed to load");
    setProjects(json.projects ?? []);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function save() {
    const res = await fetch("/api/admin/published-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Save failed");
    setForm({
      title: "",
      slug: "",
      divisionId: "land_clearing",
      city: "",
      county: "",
      serviceSlug: "",
      customerGoal: "",
      workCompleted: "",
      published: false,
    });
    await load();
  }

  return (
    <AdminPageShell
      title="Published projects"
      description="SEO project pages. Only publish completed jobs with real media — do not invent stories."
    >
      {error && <p className="mb-4 text-sm text-red-800">{error}</p>}

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-lg font-semibold">New / update project</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            placeholder="slug-like-this"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <select
            className="h-11 rounded-xl border px-3 text-sm"
            value={form.divisionId}
            onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}
          >
            {ALL_DIVISION_IDS.filter(isEquipmentDivision).map((id) => (
              <option key={id} value={id}>
                {getDivision(id).name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Service slug (forestry-mulching)"
            value={form.serviceSlug}
            onChange={(e) => setForm((f) => ({ ...f, serviceSlug: e.target.value }))}
          />
          <Input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            placeholder="County"
            value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
          />
          <Textarea
            className="sm:col-span-2"
            placeholder="Customer goal"
            value={form.customerGoal}
            onChange={(e) => setForm((f) => ({ ...f, customerGoal: e.target.value }))}
          />
          <Textarea
            className="sm:col-span-2"
            placeholder="Work completed"
            value={form.workCompleted}
            onChange={(e) => setForm((f) => ({ ...f, workCompleted: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            Publish on /projects
          </label>
        </div>
        <Button type="button" className="mt-4" onClick={() => void save()}>
          Save project
        </Button>
      </section>

      <ul className="mt-8 space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm">
            <span className="font-medium">{p.title}</span>
            <span className="ml-2 text-muted-foreground">
              /projects/{p.slug} {p.published ? "· published" : "· draft"}
            </span>
          </li>
        ))}
        {!projects.length && <li className="text-sm text-muted-foreground">No projects saved.</li>}
      </ul>
    </AdminPageShell>
  );
}
