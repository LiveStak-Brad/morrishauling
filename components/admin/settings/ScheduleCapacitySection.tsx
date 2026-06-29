"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdvancedJsonEditor,
  CurrencyInput,
  FieldGrid,
  SettingsSectionCard,
  ToggleRow,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeScheduleCapacity, type ScheduleCapacityConfig } from "@/lib/admin/settings-normalizers";

const DEFAULTS = normalizeScheduleCapacity(undefined);

export function ScheduleCapacitySection({ initial }: { initial: unknown }) {
  const [config, setConfig] = useState<ScheduleCapacityConfig>(() => normalizeScheduleCapacity(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setConfig(normalizeScheduleCapacity(initial));
  }, [initial]);

  const set = <K extends keyof ScheduleCapacityConfig>(key: K, value: ScheduleCapacityConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsSectionCard
      title="Schedule capacity defaults"
      description="Default slot capacity and time windows when generating new schedule days."
      onSave={() => save("schedule.capacity", config, "Schedule defaults")}
      onReset={() => setConfig(DEFAULTS)}
      saving={saving}
      saveLabel="Save schedule defaults"
    >
      <FieldGrid>
        <div>
          <Label>Default jobs per slot</Label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={config.defaultJobsPerSlot}
            onChange={(e) => set("defaultJobsPerSlot", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Slots per day</Label>
          <Input
            type="number"
            min={1}
            max={6}
            className="mt-1"
            value={config.slotsPerDay}
            onChange={(e) => set("slotsPerDay", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Max jobs per day</Label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={config.maxJobsPerDay}
            onChange={(e) => set("maxJobsPerDay", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Buffer between jobs (minutes)</Label>
          <Input
            type="number"
            min={0}
            className="mt-1"
            value={config.bufferMinutesBetweenJobs}
            onChange={(e) => set("bufferMinutesBetweenJobs", Number(e.target.value))}
          />
        </div>
      </FieldGrid>

      <div className="space-y-3">
        <p className="text-sm font-medium">Morning window</p>
        <FieldGrid>
          <div>
            <Label>Start</Label>
            <Input type="time" className="mt-1" value={config.morningWindowStart} onChange={(e) => set("morningWindowStart", e.target.value)} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" className="mt-1" value={config.morningWindowEnd} onChange={(e) => set("morningWindowEnd", e.target.value)} />
          </div>
        </FieldGrid>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Afternoon window</p>
        <FieldGrid>
          <div>
            <Label>Start</Label>
            <Input type="time" className="mt-1" value={config.afternoonWindowStart} onChange={(e) => set("afternoonWindowStart", e.target.value)} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" className="mt-1" value={config.afternoonWindowEnd} onChange={(e) => set("afternoonWindowEnd", e.target.value)} />
          </div>
        </FieldGrid>
      </div>

      <ToggleRow
        label="Flexible window enabled"
        description="Offer a discounted flexible arrival window for route batching."
        checked={config.flexibleWindowEnabled}
        onCheckedChange={(v) => set("flexibleWindowEnabled", v)}
      />

      {config.flexibleWindowEnabled ? (
        <CurrencyInput
          label="Flexible discount amount"
          value={config.flexibleDiscountAmount}
          onChange={(v) => set("flexibleDiscountAmount", v)}
        />
      ) : null}

      <AdvancedJsonEditor
        value={config}
        onSave={async (v) => {
          await save("schedule.capacity", v, "Schedule defaults");
          setConfig(normalizeScheduleCapacity(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
