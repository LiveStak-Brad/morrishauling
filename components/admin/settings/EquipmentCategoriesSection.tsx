"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdvancedJsonEditor,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeEquipmentCategories } from "@/lib/admin/settings-normalizers";
import { Plus, X } from "lucide-react";

const SUGGESTED = ["truck", "trailer", "dolly", "strap", "tool", "uniform", "electronics", "general"];

export function EquipmentCategoriesSection({ initial }: { initial: unknown }) {
  const [categories, setCategories] = useState<string[]>(() => normalizeEquipmentCategories(initial));
  const [newSlug, setNewSlug] = useState("");
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setCategories(normalizeEquipmentCategories(initial));
  }, [initial]);

  const addCategory = (slug: string) => {
    const normalized = slug.trim().toLowerCase().replace(/\s+/g, "_");
    if (!normalized || categories.includes(normalized)) return;
    setCategories((prev) => [...prev, normalized]);
    setNewSlug("");
  };

  const remove = (slug: string) => setCategories((prev) => prev.filter((c) => c !== slug));

  return (
    <SettingsSectionCard
      title="Equipment categories"
      description="Category slugs used when assigning trucks, trailers, tools, and uniforms."
      onSave={() => save("equipment.categories", categories, "Equipment categories")}
      onReset={() => setCategories(normalizeEquipmentCategories(undefined))}
      saving={saving}
      saveLabel="Save equipment categories"
    >
      <div className="flex flex-wrap gap-2">
        {categories.map((slug) => (
          <Badge key={slug} variant="secondary" className="gap-1 pr-1 text-sm">
            {slug}
            <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => remove(slug)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories defined.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED.filter((s) => !categories.includes(s)).map((slug) => (
          <Button key={slug} type="button" size="sm" variant="outline" onClick={() => addCategory(slug)}>
            + {slug}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="flex-1">
          <Label htmlFor="new-category">Add category slug</Label>
          <Input
            id="new-category"
            className="mt-1"
            value={newSlug}
            placeholder="e.g. safety_gear"
            onChange={(e) => setNewSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory(newSlug))}
          />
        </div>
        <Button type="button" className="self-end" onClick={() => addCategory(newSlug)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <AdvancedJsonEditor
        value={categories}
        onSave={async (v) => {
          await save("equipment.categories", v, "Equipment categories");
          setCategories(normalizeEquipmentCategories(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
