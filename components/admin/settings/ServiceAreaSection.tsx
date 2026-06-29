"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AdvancedJsonEditor,
  FieldGrid,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import {
  MO_SERVICE_COUNTIES,
  normalizeServiceAreas,
  serviceAreasForSave,
  type ServiceAreaConfig,
} from "@/lib/admin/settings-normalizers";
import { morrisConfig } from "@/lib/morris-config";
import { Plus, Trash2 } from "lucide-react";

function ServiceAreaEditor({
  area,
  onChange,
  onRemove,
  canRemove,
}: {
  area: ServiceAreaConfig;
  onChange: (next: ServiceAreaConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const toggleCounty = (county: string) => {
    const counties = area.counties.includes(county)
      ? area.counties.filter((c) => c !== county)
      : [...area.counties, county];
    onChange({ ...area, counties });
  };

  const updateZip = (index: number, zip: string) => {
    const zipCodes = [...area.zipCodes];
    zipCodes[index] = zip;
    onChange({ ...area, zipCodes });
  };

  const addZip = () => onChange({ ...area, zipCodes: [...area.zipCodes, ""] });
  const removeZip = (index: number) =>
    onChange({ ...area, zipCodes: area.zipCodes.filter((_, i) => i !== index) });

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{area.name || "Service area"}</p>
        {canRemove ? (
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <FieldGrid>
        <div>
          <Label>Service area name</Label>
          <Input
            className="mt-1"
            value={area.name}
            onChange={(e) => onChange({ ...area, name: e.target.value, label: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <div className="flex-1">
            <Label>Active</Label>
            <div className="mt-2 flex items-center gap-2">
              <Switch checked={area.active} onCheckedChange={(active) => onChange({ ...area, active })} />
              <span className="text-sm text-muted-foreground">{area.active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
        <div>
          <Label>Center latitude</Label>
          <Input
            type="number"
            step="any"
            className="mt-1"
            value={area.center.lat}
            onChange={(e) =>
              onChange({ ...area, center: { ...area.center, lat: Number(e.target.value) } })
            }
          />
        </div>
        <div>
          <Label>Center longitude</Label>
          <Input
            type="number"
            step="any"
            className="mt-1"
            value={area.center.lng}
            onChange={(e) =>
              onChange({ ...area, center: { ...area.center, lng: Number(e.target.value) } })
            }
          />
        </div>
        <div>
          <Label>Radius (miles)</Label>
          <Input
            type="number"
            className="mt-1"
            value={area.radiusMiles}
            onChange={(e) => onChange({ ...area, radiusMiles: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Display label</Label>
          <Input
            className="mt-1"
            value={area.label}
            onChange={(e) => onChange({ ...area, label: e.target.value })}
            placeholder="Shown on website & booking"
          />
        </div>
      </FieldGrid>

      <div>
        <Label className="mb-2 block">Counties served</Label>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {MO_SERVICE_COUNTIES.map((county) => (
            <label key={county} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={area.counties.includes(county)}
                onCheckedChange={() => toggleCounty(county)}
              />
              {county} County
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>ZIP codes</Label>
          <Button type="button" size="sm" variant="outline" onClick={addZip}>
            <Plus className="mr-1 h-3 w-3" /> Add ZIP code
          </Button>
        </div>
        <div className="space-y-2">
          {area.zipCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ZIP codes — add one to define coverage.</p>
          ) : (
            area.zipCodes.map((zip, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={zip}
                  placeholder="63383"
                  maxLength={5}
                  onChange={(e) => updateZip(i, e.target.value.replace(/\D/g, "").slice(0, 5))}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeZip(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          className="mt-1"
          rows={2}
          value={area.notes}
          onChange={(e) => onChange({ ...area, notes: e.target.value })}
          placeholder="Internal notes about this coverage area"
        />
      </div>
    </div>
  );
}

export function ServiceAreaSection({ initial }: { initial: unknown }) {
  const [areas, setAreas] = useState<ServiceAreaConfig[]>(() => normalizeServiceAreas(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setAreas(normalizeServiceAreas(initial));
  }, [initial]);

  const updateArea = (index: number, next: ServiceAreaConfig) => {
    setAreas((prev) => prev.map((a, i) => (i === index ? next : a)));
  };

  const addArea = () => {
    setAreas((prev) => [
      ...prev,
      {
        id: `area-${Date.now()}`,
        name: "New service area",
        label: "",
        center: { ...morrisConfig.serviceArea.center },
        radiusMiles: 30,
        counties: [],
        zipCodes: [],
        active: true,
        notes: "",
      },
    ]);
  };

  return (
    <SettingsSectionCard
      title="Service areas"
      description="Define where Morris Hauling operates. Used for booking validation, routing, and customer-facing copy."
      onSave={() => save("service.areas", serviceAreasForSave(areas), "Service areas")}
      onReset={() => setAreas(normalizeServiceAreas(morrisConfig.serviceArea))}
      saving={saving}
      saveLabel="Save service areas"
    >
      <div className="space-y-4">
        {areas.map((area, i) => (
          <ServiceAreaEditor
            key={area.id}
            area={area}
            onChange={(next) => updateArea(i, next)}
            onRemove={() => setAreas((prev) => prev.filter((_, j) => j !== i))}
            canRemove={areas.length > 1}
          />
        ))}
        <Button type="button" variant="outline" onClick={addArea}>
          <Plus className="mr-2 h-4 w-4" /> Add service area
        </Button>
      </div>
      <AdvancedJsonEditor
        value={serviceAreasForSave(areas)}
        onSave={async (v) => {
          await save("service.areas", v, "Service areas");
          setAreas(normalizeServiceAreas(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
