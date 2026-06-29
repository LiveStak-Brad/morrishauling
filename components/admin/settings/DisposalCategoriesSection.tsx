"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdvancedJsonEditor,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeDisposalCategories, type DisposalCategoryRow } from "@/lib/admin/settings-normalizers";
import { DISPOSAL_CATEGORY_LABELS } from "@/lib/disposal/disposal-routing";

const MATERIAL_OPTIONS = Object.entries(DISPOSAL_CATEGORY_LABELS);

export function DisposalCategoriesSection({ initial }: { initial: unknown }) {
  const [rows, setRows] = useState<DisposalCategoryRow[]>(() => normalizeDisposalCategories(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setRows(normalizeDisposalCategories(initial));
  }, [initial]);

  const update = (index: number, patch: Partial<DisposalCategoryRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const toggleMaterial = (index: number, material: string) => {
    const row = rows[index];
    const acceptedMaterials = row.acceptedMaterials.includes(material)
      ? row.acceptedMaterials.filter((m) => m !== material)
      : [...row.acceptedMaterials, material];
    update(index, { acceptedMaterials });
  };

  return (
    <SettingsSectionCard
      title="Disposal categories"
      description="Which materials each disposal site or routing category accepts."
      onSave={() => save("pricing.disposal_categories", rows, "Disposal categories")}
      onReset={() => setRows(normalizeDisposalCategories(undefined))}
      saving={saving}
      saveLabel="Save disposal categories"
    >
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={row.id} className="rounded-lg border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Site / category ID</Label>
                <Input className="mt-1 font-mono text-sm" value={row.id} readOnly />
              </div>
              <div>
                <Label>Name</Label>
                <Input className="mt-1" value={row.name} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Accepted materials</Label>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {MATERIAL_OPTIONS.map(([id, label]) => (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={row.acceptedMaterials.includes(id)}
                      onCheckedChange={() => toggleMaterial(i, id)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdvancedJsonEditor
        value={rows}
        onSave={async (v) => {
          await save("pricing.disposal_categories", v, "Disposal categories");
          setRows(normalizeDisposalCategories(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
