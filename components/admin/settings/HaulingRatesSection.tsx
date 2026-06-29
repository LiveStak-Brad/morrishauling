"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  AdvancedJsonEditor,
  CurrencyInput,
  FieldGrid,
  PercentInput,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeHaulingRates, type HaulingRatesConfig } from "@/lib/admin/settings-normalizers";

const FIELD_GROUPS: { title: string; fields: { key: keyof HaulingRatesConfig; label: string; type: "currency" | "percent" | "multiplier" }[] }[] = [
  {
    title: "Base & mileage",
    fields: [
      { key: "baseFee", label: "Base fee", type: "currency" },
      { key: "perLoadedMileRate", label: "Per loaded mile", type: "currency" },
      { key: "deadheadMileRate", label: "Deadhead mile rate", type: "currency" },
      { key: "deadheadRatio", label: "Deadhead ratio", type: "multiplier" },
      { key: "fuelAdjustmentRate", label: "Fuel adjustment (per mile)", type: "currency" },
    ],
  },
  {
    title: "Labor",
    fields: [
      { key: "driverHourlyRate", label: "Driver hourly", type: "currency" },
      { key: "loadingLaborRate", label: "Loading labor (per hr)", type: "currency" },
      { key: "unloadingLaborRate", label: "Unloading labor (per hr)", type: "currency" },
    ],
  },
  {
    title: "Trailers & priority",
    fields: [
      { key: "rentalTrailerFee", label: "Rental trailer fee", type: "currency" },
      { key: "rentalTrailerMarkup", label: "Rental markup multiplier", type: "multiplier" },
      { key: "priorityFee", label: "Priority surcharge", type: "currency" },
      { key: "emergencyFee", label: "Emergency surcharge", type: "currency" },
      { key: "economyDiscountPercent", label: "Economy discount", type: "percent" },
    ],
  },
  {
    title: "Internal costing",
    fields: [
      { key: "overheadAllocationFlat", label: "Overhead allocation", type: "currency" },
      { key: "internalFuelCostPerMile", label: "Internal fuel / mile", type: "currency" },
      { key: "internalPayrollCostRate", label: "Internal payroll rate", type: "multiplier" },
      { key: "internalTrailerCostRate", label: "Internal trailer rate", type: "multiplier" },
      { key: "internalRentalCostRate", label: "Internal rental rate", type: "multiplier" },
    ],
  },
];

export function HaulingRatesSection({ initial }: { initial: unknown }) {
  const [rates, setRates] = useState<HaulingRatesConfig>(() => normalizeHaulingRates(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setRates(normalizeHaulingRates(initial));
  }, [initial]);

  const set = (key: keyof HaulingRatesConfig, value: number) =>
    setRates((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsSectionCard
      title="Hauling rates"
      description="Mileage, labor, and surcharge defaults for hauling & transport estimates."
      onSave={() => save("pricing.hauling_rates", rates, "Hauling rates")}
      onReset={() => setRates(normalizeHaulingRates(undefined))}
      saving={saving}
      saveLabel="Save hauling rates"
    >
      {FIELD_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <p className="text-sm font-medium">{group.title}</p>
          <FieldGrid>
            {group.fields.map((f) =>
              f.type === "currency" ? (
                <CurrencyInput
                  key={f.key}
                  label={f.label}
                  value={rates[f.key]}
                  onChange={(v) => set(f.key, v)}
                />
              ) : f.type === "percent" ? (
                <PercentInput key={f.key} label={f.label} value={rates[f.key]} onChange={(v) => set(f.key, v)} />
              ) : (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={rates[f.key]}
                    onChange={(e) => set(f.key, Number(e.target.value))}
                  />
                </div>
              )
            )}
          </FieldGrid>
        </div>
      ))}

      <AdvancedJsonEditor
        value={rates}
        onSave={async (v) => {
          await save("pricing.hauling_rates", v, "Hauling rates");
          setRates(normalizeHaulingRates(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
