"use client";

import { useMemo, useState } from "react";
import type { Job } from "@/types";
import type { ScheduleSlot, ScheduleSlotInput, ScheduleSlotStatus } from "@/types/schedule";
import { SCHEDULE_SLOT_STATUS_LABELS } from "@/types/schedule";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CalendarClock, Plus, Users } from "lucide-react";

interface AdminScheduleManagerProps {
  companyId: string;
  initialSlots: ScheduleSlot[];
  jobs: Job[];
}

const emptyForm: ScheduleSlotInput = {
  slotDate: "",
  windowLabel: "Morning",
  startTime: "08:00:00",
  endTime: "12:00:00",
  maxJobs: 4,
  discountAmount: 0,
  serviceArea: "Warren, Lincoln & St. Charles Counties",
  routeZone: "",
};

export function AdminScheduleManager({ companyId, initialSlots, jobs }: AdminScheduleManagerProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [selectedId, setSelectedId] = useState<string | null>(initialSlots[0]?.id ?? null);
  const [form, setForm] = useState<ScheduleSlotInput>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = slots.find((s) => s.id === selectedId);
  const bookedJobs = useMemo(
    () => jobs.filter((j) => j.selectedScheduleSlotId === selectedId),
    [jobs, selectedId]
  );

  const saveSlot = async (updates: Partial<ScheduleSlotInput> & { status?: ScheduleSlotStatus }) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/schedule/slots/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, updates }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSlots((prev) => prev.map((s) => (s.id === selectedId ? data.slot : s)));
    } finally {
      setSaving(false);
    }
  };

  const createSlot = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/schedule/slots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, slot: form }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSlots((prev) => [...prev, data.slot].sort((a, b) => a.slotDate.localeCompare(b.slotDate)));
      setSelectedId(data.slot.id);
      setShowCreate(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <PremiumCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <CalendarClock className="h-4 w-4" /> Upcoming slots
          </h3>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
        <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
          {slots.map((slot) => (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => setSelectedId(slot.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left text-sm transition-colors",
                  selectedId === slot.id ? "border-brand-primary bg-brand-primary/5" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {slot.slotDate} · {slot.windowLabel}
                  </span>
                  <StatusChip
                    label={SCHEDULE_SLOT_STATUS_LABELS[slot.status]}
                    variant={
                      slot.status === "full" || slot.status === "closed"
                        ? "neutral"
                        : slot.status === "limited" || slot.status === "almost_full"
                          ? "warning"
                          : "success"
                    }
                    className="text-[10px]"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {slot.currentJobs}/{slot.maxJobs} jobs
                  {slot.discountAmount > 0 && ` · $${slot.discountAmount} discount`}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </PremiumCard>

      <div className="space-y-4">
        {showCreate && (
          <PremiumCard className="p-5">
            <h3 className="font-bold">Create slot</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.slotDate} onChange={(e) => setForm({ ...form, slotDate: e.target.value })} />
              </div>
              <div>
                <Label>Window label</Label>
                <Input value={form.windowLabel} onChange={(e) => setForm({ ...form, windowLabel: e.target.value })} />
              </div>
              <div>
                <Label>Max jobs</Label>
                <Input type="number" min={1} value={form.maxJobs} onChange={(e) => setForm({ ...form, maxJobs: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Discount ($)</Label>
                <Input type="number" min={0} value={form.discountAmount ?? 0} onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Route zone</Label>
                <Input value={form.routeZone ?? ""} onChange={(e) => setForm({ ...form, routeZone: e.target.value })} />
              </div>
              <div>
                <Label>Service area</Label>
                <Input value={form.serviceArea ?? ""} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={createSlot} disabled={saving || !form.slotDate}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </PremiumCard>
        )}

        {selected && (
          <PremiumCard className="p-5">
            <h3 className="font-bold">Edit slot</h3>
            <p className="text-sm text-muted-foreground">
              {selected.slotDate} · {selected.startTime.slice(0, 5)}–{selected.endTime.slice(0, 5)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Max jobs</Label>
                <Input
                  type="number"
                  min={selected.currentJobs}
                  defaultValue={selected.maxJobs}
                  key={`max-${selected.id}-${selected.maxJobs}`}
                  onBlur={(e) => saveSlot({ maxJobs: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Discount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={selected.discountAmount}
                  key={`disc-${selected.id}`}
                  onBlur={(e) => saveSlot({ discountAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Route zone</Label>
                <Input
                  defaultValue={selected.routeZone ?? ""}
                  key={`zone-${selected.id}`}
                  onBlur={(e) => saveSlot({ routeZone: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selected.status}
                  onChange={(e) => saveSlot({ status: e.target.value as ScheduleSlotStatus })}
                >
                  {Object.entries(SCHEDULE_SLOT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Capacity: <strong>{selected.currentJobs}/{selected.maxJobs}</strong>
            </p>
          </PremiumCard>
        )}

        {selected && (
          <PremiumCard className="p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <Users className="h-4 w-4" /> Booked jobs ({bookedJobs.length})
            </h3>
            {bookedJobs.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No jobs booked in this window yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {bookedJobs.map((job) => (
                  <li key={job.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{job.address.street}, {job.address.city}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.scheduledWindowLabel ?? "—"} · ${job.estimate?.total ?? "—"}
                      {job.flexibleDiscountAmount ? ` (−$${job.flexibleDiscountAmount} flex)` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PremiumCard>
        )}
      </div>
    </div>
  );
}
