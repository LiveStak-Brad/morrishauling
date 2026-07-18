"use client";

import { useMemo, useState } from "react";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type AuthorityStory,
  type PropertyType,
} from "@/lib/authority/types";

export function GalleryFilterClient({ stories }: { stories: AuthorityStory[] }) {
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [item, setItem] = useState("");
  const [q, setQ] = useState("");

  const cities = useMemo(
    () =>
      Array.from(new Set(stories.map((s) => s.city).filter(Boolean) as string[])).sort(),
    [stories]
  );
  const services = useMemo(
    () =>
      Array.from(
        new Set(stories.map((s) => s.service_category).filter(Boolean) as string[])
      ).sort(),
    [stories]
  );

  const filtered = stories.filter((s) => {
    if (city && s.city !== city) return false;
    if (service && s.service_category !== service) return false;
    if (propertyType && s.property_type !== propertyType) return false;
    if (item && !(s.item_removed || "").toLowerCase().includes(item.toLowerCase())) {
      return false;
    }
    if (q) {
      const hay = `${s.title} ${s.summary ?? ""} ${s.description ?? ""} ${s.city ?? ""} ${s.location ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mt-8 grid gap-3 rounded-2xl border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-medium text-muted-foreground">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Garage, Warrenton, couch…"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          City
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Service type
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Property type
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All property types</option>
            {PROPERTY_TYPES.map((p) => (
              <option key={p} value={p}>
                {PROPERTY_TYPE_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
          Item removed
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Appliance, furniture…"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {filtered.length} of {stories.length} projects
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-muted-foreground">
          No gallery projects match these filters yet. Check back soon — or request an estimate and
          we may feature your project (with permission).
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((story) => (
            <li key={story.id}>
              <AuthorityContentCard story={story} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
