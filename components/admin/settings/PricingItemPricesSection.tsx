"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdvancedJsonEditor,
  CurrencyInput,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeItemPrices } from "@/lib/admin/settings-normalizers";
import type { CommonJunkItemConfig } from "@/lib/common-junk-items";
import { DISPOSAL_CATEGORY_LABELS, type DisposalCategory } from "@/lib/disposal/disposal-routing";

export function PricingItemPricesSection({ initial }: { initial: unknown }) {
  const [items, setItems] = useState<CommonJunkItemConfig[]>(() => normalizeItemPrices(initial));
  const [filter, setFilter] = useState("");
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setItems(normalizeItemPrices(initial));
  }, [initial]);

  const filtered = items.filter(
    (i) =>
      !filter ||
      i.name.toLowerCase().includes(filter.toLowerCase()) ||
      i.id.toLowerCase().includes(filter.toLowerCase())
  );

  const update = (index: number, patch: Partial<CommonJunkItemConfig>) => {
    const realIndex = items.findIndex((x) => x.id === filtered[index].id);
    if (realIndex < 0) return;
    setItems((prev) => prev.map((item, i) => (i === realIndex ? { ...item, ...patch } : item)));
  };

  return (
    <SettingsSectionCard
      title="Common item prices"
      description="Per-item pickup pricing from the junk removal catalog."
      onSave={() => save("pricing.item_prices", items, "Item prices")}
      onReset={() => setItems(normalizeItemPrices(undefined))}
      saving={saving}
      saveLabel="Save item catalog"
    >
      <div>
        <Label>Search items</Label>
        <Input
          className="mt-1 max-w-sm"
          placeholder="Search by name or ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2 font-medium">Item</th>
              <th className="p-2 font-medium w-28">Base price</th>
              <th className="p-2 font-medium w-24">Labor min</th>
              <th className="p-2 font-medium w-20">Heavy</th>
              <th className="p-2 font-medium">Disposal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    className="h-8"
                    value={item.basePrice}
                    onChange={(e) => update(i, { basePrice: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    className="h-8"
                    value={item.laborMinutes}
                    onChange={(e) => update(i, { laborMinutes: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <Switch checked={item.heavy} onCheckedChange={(heavy) => update(i, { heavy })} />
                </td>
                <td className="p-2">
                  <Select
                    value={item.disposalCategory}
                    onValueChange={(v) => update(i, { disposalCategory: v as DisposalCategory })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DISPOSAL_CATEGORY_LABELS).map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items match your search.</p>
      ) : null}

      <AdvancedJsonEditor
        value={items}
        onSave={async (v) => {
          await save("pricing.item_prices", v, "Item prices");
          setItems(normalizeItemPrices(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
