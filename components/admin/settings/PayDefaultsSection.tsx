"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FieldGrid,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizePayDefaults, type PayDefaultsConfig } from "@/lib/admin/settings-normalizers";

const DEFAULTS = normalizePayDefaults(undefined);

export function PayDefaultsSection({ initial }: { initial: unknown }) {
  const [config, setConfig] = useState<PayDefaultsConfig>(() => normalizePayDefaults(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setConfig(normalizePayDefaults(initial));
  }, [initial]);

  const set = <K extends keyof PayDefaultsConfig>(key: K, value: PayDefaultsConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsSectionCard
      title="Pay defaults"
      description="Default hourly rates and payroll targets for HR and dispatch planning."
      onSave={() => save("pay.defaults", config, "Pay defaults")}
      onReset={() => setConfig(DEFAULTS)}
      saving={saving}
      saveLabel="Save pay defaults"
    >
      <FieldGrid>
        <CurrencyInput
          label="Driver hourly rate"
          value={config.driverHourlyRate}
          onChange={(v) => set("driverHourlyRate", v)}
        />
        <CurrencyInput
          label="Helper hourly rate"
          value={config.helperHourlyRate}
          onChange={(v) => set("helperHourlyRate", v)}
        />
        <div>
          <Label>Overtime multiplier</Label>
          <input
            type="number"
            step="0.1"
            min={1}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={config.overtimeMultiplier}
            onChange={(e) => set("overtimeMultiplier", Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted-foreground">e.g. 1.5 = time and a half</p>
        </div>
        <CurrencyInput
          label="Weekly payroll goal"
          value={config.weeklyPayrollGoal}
          onChange={(v) => set("weeklyPayrollGoal", v)}
        />
        <div>
          <Label>Default pay period</Label>
          <Select value={config.defaultPayPeriod} onValueChange={(v) => set("defaultPayPeriod", v as PayDefaultsConfig["defaultPayPeriod"])}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Biweekly</SelectItem>
              <SelectItem value="semimonthly">Semi-monthly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CurrencyInput
          label="Mileage reimbursement (per mile)"
          value={config.mileageReimbursement}
          onChange={(v) => set("mileageReimbursement", v)}
        />
      </FieldGrid>

      <div>
        <Label>Bonus rules</Label>
        <Textarea
          className="mt-1"
          rows={3}
          value={config.bonusRulesNote}
          onChange={(e) => set("bonusRulesNote", e.target.value)}
          placeholder="Describe bonus eligibility, thresholds, and payout timing (placeholder until payroll rules engine ships)."
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Structured bonus rules will be configurable here in a future release.
        </p>
      </div>

      <AdvancedJsonEditor
        value={config}
        onSave={async (v) => {
          await save("pay.defaults", v, "Pay defaults");
          setConfig(normalizePayDefaults(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
