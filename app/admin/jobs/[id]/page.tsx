"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeSelector } from "@/components/hr/EmployeeSelector";
import { FleetUnitSelector } from "@/components/hr/FleetUnitSelector";
import { toast } from "@/lib/toast";
import { serviceTypeToDivision } from "@/lib/divisions";
import { isSlotBookable, SCHEDULE_SLOT_STATUS_LABELS } from "@/types/schedule";
import { labelJobStatus } from "@/lib/ui/status-labels";
import type { ScheduleSlot } from "@/types/schedule";
import type { Job } from "@/types/job";
import type { EstimateRecord } from "@/types/billing";
import type { Invoice } from "@/types/payment";
import type { HrEmployee } from "@/types/hr/employee";
import type { OperationalTruck } from "@/types/operations-depth";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type Workspace = {
  job: Job;
  estimate: EstimateRecord | null;
  invoice: Invoice | null;
  employees: HrEmployee[];
  trucks: OperationalTruck[];
  trailers: OperationalTruck[];
  scheduleSlots: ScheduleSlot[];
  proof: { ok: true } | { ok: false; message: string };
  missingPhotos: string[];
  requiredPhotoStages: string[];
  nextAction: string;
  assignmentPreview: {
    ok: boolean;
    hardBlocks: Array<{ code: string; message: string }>;
    softConflicts: Array<{ message: string }>;
  };
};

export default function AdminJobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [windowLabel, setWindowLabel] = useState("");
  const [slotId, setSlotId] = useState("");
  const [duration, setDuration] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [crewIds, setCrewIds] = useState<string[]>([]);
  const [addCrewId, setAddCrewId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [completionOverride, setCompletionOverride] = useState("");
  const [uploadingStage, setUploadingStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`);
      const json = await res.json();
      if (!json.ok) {
        setData(null);
        return;
      }
      const ws = json as Workspace & { ok: boolean };
      setData(ws);
      const job = ws.job;
      setStatus(job.status);
      setScheduledDate(job.scheduledDate ?? "");
      setWindowLabel(job.scheduledWindowLabel ?? "");
      setSlotId(job.selectedScheduleSlotId ?? "");
      setDuration(job.estimatedDurationMinutes ? String(job.estimatedDurationMinutes) : "");
      setFlexible((job.flexibleDiscountAmount ?? 0) > 0);
      setCrewIds(job.assignedEmployeeIds ?? []);
      setDriverId(job.driverEmployeeId ?? "");
      setTruckId(job.assignedTruckId ?? "");
      setTrailerId(job.assignedTrailerId ?? "");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const empName = useCallback(
    (eid: string) => {
      const e = data?.employees.find((x) => x.id === eid);
      return e ? `${e.firstName} ${e.lastName}` : eid;
    },
    [data?.employees]
  );

  const unitName = useCallback(
    (uid: string, kind: "truck" | "trailer") => {
      const list = kind === "truck" ? data?.trucks : data?.trailers;
      return list?.find((u) => u.id === uid)?.name ?? uid;
    },
    [data?.trucks, data?.trailers]
  );

  const daySlots = useMemo(() => {
    if (!data || !scheduledDate) return [];
    return data.scheduleSlots.filter((s) => s.slotDate === scheduledDate);
  }, [data, scheduledDate]);

  const saveAssignments = async (opts?: { clear?: boolean }) => {
    if (!data) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = opts?.clear
        ? {
            assignedEmployeeIds: [],
            driverEmployeeId: null,
            assignedTruckId: null,
            assignedTrailerId: null,
          }
        : {
            assignedEmployeeIds: crewIds,
            driverEmployeeId: driverId || null,
            assignedTruckId: truckId || null,
            assignedTrailerId: trailerId || null,
          };
      if (overrideReason.trim()) body.assignmentOverrideReason = overrideReason.trim();

      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Assignment save failed");
        return;
      }
      toast.success(opts?.clear ? "Assignments cleared" : "Assignments saved");
      setOverrideReason("");
      await load();
    } catch {
      toast.error("Assignment save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const selected = daySlots.find((s) => s.id === slotId);
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: scheduledDate || null,
          scheduledWindowLabel: (selected?.windowLabel ?? windowLabel) || null,
          selectedScheduleSlotId: slotId || null,
          estimatedDurationMinutes: duration ? Number(duration) : null,
          flexibleDiscountAmount: flexible
            ? (selected?.discountAmount ?? data.job.flexibleDiscountAmount ?? 25)
            : 0,
          status: scheduledDate && status === "submitted" ? "scheduled" : status,
          assignmentOverrideReason: overrideReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Schedule save failed");
        return;
      }
      toast.success("Schedule saved");
      setOverrideReason("");
      await load();
    } catch {
      toast.error("Schedule save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status };
      if (status === "completed" && data.proof && !data.proof.ok) {
        if (!completionOverride.trim()) {
          toast.error("Completion proof incomplete — add photos or an override reason.");
          setSaving(false);
          return;
        }
        body.completionOverrideReason = completionOverride.trim();
      }
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Status update failed");
        return;
      }
      toast.success("Status updated");
      setCompletionOverride("");
      await load();
    } catch {
      toast.error("Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadProof = async (stage: string, file: File) => {
    setUploadingStage(stage);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("photoType", stage);
      form.append("photoStage", stage);
      const res = await fetch(`/api/jobs/${id}/photos`, { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      toast.success(`${stage.replace(/_/g, " ")} uploaded`);
      await load();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingStage(null);
    }
  };

  const divisionId = data
    ? data.job.divisionId ?? serviceTypeToDivision(data.job.serviceType)
    : "junk_removal";

  return (
    <AdminPageShell
      title="Job workspace"
      description="Schedule, assign crew and equipment, review proof, and invoice from one place"
      action={
        <Link href="/admin/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All jobs
        </Link>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-muted-foreground">Job not found.</p>
      ) : (
        <div className="space-y-4 pb-8">
          {/* Operational action panel */}
          <PremiumCard className="space-y-3 border-l-4 border-l-brand-primary p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next required action</p>
                <p className="text-xl font-bold text-brand-primary">{data.nextAction}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusChip label={labelJobStatus(data.job.status)} variant="info" />
                <StatusChip
                  label={divisionId === "hauling" ? "Hauling" : "Junk Removal"}
                  variant="neutral"
                />
                <StatusChip
                  label={data.proof.ok ? "Proof ready" : "Proof incomplete"}
                  variant={data.proof.ok ? "success" : "warning"}
                />
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">
                  {data.job.scheduledDate ?? "—"} {data.job.scheduledWindowLabel ?? ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Crew</p>
                <p className="font-medium">
                  {(data.job.assignedEmployeeIds ?? []).map(empName).join(", ") || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Driver</p>
                <p className="font-medium">{data.job.driverEmployeeId ? empName(data.job.driverEmployeeId) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Truck / Trailer</p>
                <p className="font-medium">
                  {data.job.assignedTruckId ? unitName(data.job.assignedTruckId, "truck") : "—"}
                  {" / "}
                  {data.job.assignedTrailerId ? unitName(data.job.assignedTrailerId, "trailer") : "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {data.missingPhotos.length > 0 && (
                <span className="text-amber-800">
                  Missing proof: {data.missingPhotos.map((s) => s.replace(/_/g, " ")).join(", ")}
                </span>
              )}
              {data.estimate && (
                <Link href={`/admin/estimates/${data.estimate.id}`} className="text-brand-primary underline">
                  Estimate {data.estimate.estimateNumber}
                </Link>
              )}
              {data.invoice ? (
                <Link href={`/admin/invoices/${data.invoice.id}`} className="text-brand-primary underline">
                  Invoice {data.invoice.invoiceNumber}
                  {data.invoice.balanceDue > 0 ? ` · $${data.invoice.balanceDue.toFixed(2)} due` : " · paid"}
                </Link>
              ) : data.job.status === "completed" ? (
                <Link
                  href={`/admin/invoices/new?jobId=${data.job.id}&customerId=${data.job.customerId ?? ""}`}
                  className="font-medium text-brand-primary underline"
                >
                  Create invoice
                </Link>
              ) : null}
              {data.job.customerId && (
                <Link href={`/admin/customers/${data.job.customerId}`} className="text-brand-primary underline">
                  Customer
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.job.address.street}, {data.job.address.city}, {data.job.address.state}{" "}
              {data.job.address.zip}
            </p>
          </PremiumCard>

          {(data.assignmentPreview.hardBlocks.length > 0 ||
            data.assignmentPreview.softConflicts.length > 0) && (
            <PremiumCard className="space-y-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Assignment issues
              </div>
              {data.assignmentPreview.hardBlocks.map((b) => (
                <p key={b.message} className="text-sm text-red-800">
                  Blocked: {b.message}
                </p>
              ))}
              {data.assignmentPreview.softConflicts.map((c) => (
                <p key={c.message} className="text-sm text-amber-900">
                  Conflict: {c.message}
                </p>
              ))}
            </PremiumCard>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Schedule */}
            <PremiumCard className="space-y-3 p-5">
              <h3 className="font-bold">Schedule</h3>
              <div>
                <Label>Service date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    setSlotId("");
                  }}
                />
              </div>
              <div>
                <Label>Arrival window / slot</Label>
                <Select
                  value={slotId || "__none__"}
                  onValueChange={(v) => {
                    if (v == null || v === "__none__") {
                      setSlotId("");
                      return;
                    }
                    setSlotId(v);
                    const slot = daySlots.find((s) => s.id === v);
                    if (slot) setWindowLabel(slot.windowLabel);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No slot / flexible</SelectItem>
                    {daySlots.map((s) => (
                      <SelectItem key={s.id} value={s.id} disabled={!isSlotBookable(s.status)}>
                        {s.windowLabel} · {s.startTime}–{s.endTime} ·{" "}
                        {SCHEDULE_SLOT_STATUS_LABELS[s.status]} ({s.currentJobs}/{s.maxJobs})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!daySlots.length && scheduledDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No capacity slots for this date — enter a custom window below.
                  </p>
                )}
              </div>
              <div>
                <Label>Custom window label</Label>
                <Input
                  value={windowLabel}
                  onChange={(e) => setWindowLabel(e.target.value)}
                  placeholder="e.g. 8–10 AM"
                />
              </div>
              <div>
                <Label>Estimated duration (minutes)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={flexible}
                  onChange={(e) => setFlexible(e.target.checked)}
                />
                Flexible scheduling (apply slot discount when available)
              </label>
              <Button disabled={saving} className="min-h-10 w-full sm:w-auto" onClick={() => void saveSchedule()}>
                Save schedule
              </Button>
            </PremiumCard>

            {/* Status */}
            <PremiumCard className="space-y-3 p-5">
              <h3 className="font-bold">Status</h3>
              <Select value={status} onValueChange={(v) => { if (v != null) setStatus(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {["submitted", "estimated", "scheduled", "in_progress", "needs_dump", "completed", "cancelled"].map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {labelJobStatus(s)}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
              {status === "completed" && !data.proof.ok && (
                <div>
                  <Label>Completion override reason (owner/manager)</Label>
                  <Textarea
                    value={completionOverride}
                    onChange={(e) => setCompletionOverride(e.target.value)}
                    placeholder="Required when proof is incomplete"
                  />
                </div>
              )}
              <Button disabled={saving} className="min-h-10 w-full sm:w-auto" onClick={() => void saveStatus()}>
                Update status
              </Button>
            </PremiumCard>
          </div>

          {/* Assignments */}
          <PremiumCard className="space-y-4 p-5">
            <h3 className="font-bold">Crew, driver & equipment</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Add crew member</Label>
                <EmployeeSelector
                  value={addCrewId}
                  lifecycleFilter="active"
                  onChange={(eid) => {
                    setAddCrewId("");
                    if (eid && !crewIds.includes(eid)) setCrewIds([...crewIds, eid]);
                  }}
                  placeholder="Search active employees…"
                />
                <ul className="space-y-1">
                  {crewIds.map((eid) => (
                    <li key={eid} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                      <span>
                        {empName(eid)}
                        {driverId === eid ? " · driver" : ""}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-red-700 underline"
                        onClick={() => {
                          setCrewIds(crewIds.filter((x) => x !== eid));
                          if (driverId === eid) setDriverId("");
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                  {!crewIds.length && (
                    <li className="text-sm text-muted-foreground">No crew assigned</li>
                  )}
                </ul>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Driver</Label>
                  <Select
                    value={driverId || "__none__"}
                    onValueChange={(v) => {
                      if (v == null || v === "__none__") {
                        setDriverId("");
                        return;
                      }
                      setDriverId(v);
                      if (!crewIds.includes(v)) setCrewIds([...crewIds, v]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No driver</SelectItem>
                      {crewIds.map((eid) => (
                        <SelectItem key={eid} value={eid}>
                          {empName(eid)}
                        </SelectItem>
                      ))}
                      {data.employees
                        .filter((e) => !crewIds.includes(e.id))
                        .slice(0, 40)
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Truck</Label>
                  <FleetUnitSelector
                    kind="truck"
                    value={truckId}
                    onChange={(uid) => setTruckId(uid)}
                    placeholder="Select truck…"
                  />
                  {truckId && (
                    <button
                      type="button"
                      className="mt-1 text-xs underline"
                      onClick={() => setTruckId("")}
                    >
                      Clear truck
                    </button>
                  )}
                </div>
                <div>
                  <Label>Trailer</Label>
                  <FleetUnitSelector
                    kind="trailer"
                    value={trailerId}
                    onChange={(uid) => setTrailerId(uid)}
                    placeholder="Select trailer…"
                  />
                  {trailerId && (
                    <button
                      type="button"
                      className="mt-1 text-xs underline"
                      onClick={() => setTrailerId("")}
                    >
                      Clear trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Owner override reason (scheduling conflicts only)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Required to save when soft day conflicts exist. Safety/maintenance/licensing blocks cannot be overridden."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} className="min-h-10" onClick={() => void saveAssignments()}>
                Save assignments
              </Button>
              <Button
                variant="outline"
                className="min-h-10"
                disabled={saving}
                onClick={() => void saveAssignments({ clear: true })}
              >
                Clear all assignments
              </Button>
            </div>
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">Truck availability</p>
                <ul>
                  {data.trucks.slice(0, 8).map((t) => (
                    <li key={t.id}>
                      {t.name}: {t.maintenanceStatus}
                      {t.status ? ` / ${t.status}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Trailer availability</p>
                <ul>
                  {data.trailers.slice(0, 8).map((t) => (
                    <li key={t.id}>
                      {t.name}: {t.maintenanceStatus}
                      {t.status ? ` / ${t.status}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PremiumCard>

          {/* Proof uploads */}
          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-bold">Completion proof</h3>
            <p className="text-sm text-muted-foreground">
              Required: {data.requiredPhotoStages.join(", ")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.requiredPhotoStages.map((stage) => {
                const have = (data.job.photos ?? []).some(
                  (p) =>
                    (p.photoStage ?? p.caption ?? "").toLowerCase().includes(stage.toLowerCase()) ||
                    (p.photoStage ?? p.caption ?? "").toLowerCase() === stage.toLowerCase()
                );
                return (
                  <div key={stage} className="rounded border p-3">
                    <p className="text-sm font-medium">{stage.replace(/_/g, " ")}</p>
                    <p className={`text-xs ${have ? "text-emerald-700" : "text-amber-800"}`}>
                      {have ? "On file" : "Missing"}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="mt-2"
                      disabled={uploadingStage === stage}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadProof(stage, f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {data.job.photos?.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {data.job.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt={p.caption ?? "Job photo"}
                    className="h-28 w-full rounded object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
            )}
          </PremiumCard>
        </div>
      )}
    </AdminPageShell>
  );
}
