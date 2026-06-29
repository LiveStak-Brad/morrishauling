"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TimeOffRequest } from "@/types/hr/schedule";
import { toast } from "@/lib/toast";

export default function EmployeeTimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balances, setBalances] = useState<Array<{ bucket: string; balanceHours: number }>>([]);
  const [form, setForm] = useState({
    requestType: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
    notes: "",
    partialDay: false,
    hoursRequested: "8",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch("/api/hr/time-off")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRequests(d.requests);
          setBalances(d.balances ?? []);
        }
      });
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error("Select start and end dates");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: form.requestType,
          startDate: form.startDate,
          endDate: form.endDate,
          partialDay: form.partialDay,
          hoursRequested: Number(form.hoursRequested) || undefined,
          reason: [form.reason, form.notes].filter(Boolean).join(" — ") || undefined,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success("Time off request submitted");
        setForm({ requestType: "vacation", startDate: "", endDate: "", reason: "", notes: "", partialDay: false, hoursRequested: "8" });
        load();
      } else {
        toast.error(d.error ?? "Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Time Off</h1>

      {balances.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {balances.map((b) => (
            <PremiumCard key={b.bucket} className="p-3 text-center">
              <p className="text-xs text-muted-foreground capitalize">{b.bucket}</p>
              <p className="text-lg font-bold">{b.balanceHours}h</p>
            </PremiumCard>
          ))}
        </div>
      )}

      <PremiumCard className="p-4 space-y-3">
        <h3 className="font-semibold">Request Time Off</h3>
        <div>
          <Label>Type</Label>
          <Select value={form.requestType} onValueChange={(v) => v && setForm((f) => ({ ...f, requestType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vacation">Vacation</SelectItem>
              <SelectItem value="sick">Sick</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Start</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
          <div><Label>End</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.partialDay} onChange={(e) => setForm((f) => ({ ...f, partialDay: e.target.checked }))} />
          Partial day
        </label>
        {form.partialDay && (
          <div>
            <Label>Hours requested</Label>
            <Input type="number" min={1} max={8} value={form.hoursRequested} onChange={(e) => setForm((f) => ({ ...f, hoursRequested: e.target.value }))} />
          </div>
        )}
        <div>
          <Label>Reason</Label>
          <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Brief reason" />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
        </div>
        <Button onClick={submit} className="w-full h-12" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Request"}
        </Button>
      </PremiumCard>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Your requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          requests.map((r) => (
            <PremiumCard key={r.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium capitalize">{r.requestType}</p>
                  <p className="text-sm text-muted-foreground">{r.startDate} – {r.endDate}</p>
                  {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
                </div>
                <Badge variant={r.status === "approved" ? "default" : r.status === "denied" ? "destructive" : "secondary"}>
                  {r.status}
                </Badge>
              </div>
            </PremiumCard>
          ))
        )}
      </div>
    </div>
  );
}
