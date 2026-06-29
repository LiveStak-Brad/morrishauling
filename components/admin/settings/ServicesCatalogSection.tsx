"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AdvancedJsonEditor,
  CurrencyInput,
  FieldGrid,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeServicesCatalog, type ServiceCatalogItem } from "@/lib/admin/settings-normalizers";
import { Plus } from "lucide-react";

export function ServicesCatalogSection({ initial }: { initial: unknown }) {
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => normalizeServicesCatalog(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setServices(normalizeServicesCatalog(initial));
  }, [initial]);

  const update = (index: number, patch: Partial<ServiceCatalogItem>) =>
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addService = () => {
    const id = `service-${Date.now()}`;
    setServices((prev) => [
      ...prev,
      { id, name: "New service", description: "", basePrice: 0, active: true, category: "general", icon: "" },
    ]);
  };

  return (
    <SettingsSectionCard
      title="Service offerings"
      description="Services shown on the website and available during booking intake."
      onSave={() => save("services.catalog", services, "Services")}
      onReset={() => setServices(normalizeServicesCatalog(undefined))}
      saving={saving}
      saveLabel="Save services"
    >
      <div className="space-y-4">
        {services.map((s, i) => (
          <div key={s.id} className={`rounded-lg border p-4 space-y-3 ${!s.active ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{s.name}</p>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={s.active} onCheckedChange={(active) => update(i, { active })} />
                Active
              </label>
            </div>
            <FieldGrid>
              <div>
                <Label>Service name</Label>
                <Input className="mt-1" value={s.name} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>Category / icon</Label>
                <Input
                  className="mt-1"
                  value={s.category}
                  onChange={(e) => update(i, { category: e.target.value })}
                  placeholder="e.g. residential"
                />
              </div>
              <CurrencyInput label="Base price (optional)" value={s.basePrice} onChange={(v) => update(i, { basePrice: v })} />
            </FieldGrid>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={s.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addService}>
          <Plus className="mr-2 h-4 w-4" /> Add service
        </Button>
      </div>

      <AdvancedJsonEditor
        value={services}
        onSave={async (v) => {
          await save("services.catalog", v, "Services");
          setServices(normalizeServicesCatalog(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
