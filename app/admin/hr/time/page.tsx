"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

type TimeclockRow = {
  id: string;
  employeeId: string;
  employeeName?: string;
  shiftDate: string;
  clockInAt?: string;
  clockOutAt?: string;
  shiftStatus?: string;
  hours?: number;
};

type AdjustmentRow = {
  id: string;
  employeeId: string;
  reason: string;
  status: string;
  proposedPunchedAt?: string;
};

export default function HrTimeAttendancePage() {
  const [shifts, setShifts] = useState<TimeclockRow[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/hr/time?companyId=${MORRIS_COMPANY_ID}&date=${date}`
      );
      const json = await res.json();
      if (json.ok) {
        setShifts(json.data.shifts ?? []);
        setAdjustments(json.data.adjustments ?? []);
      } else {
        toast.error(json.error || "Failed to load time data");
      }
    } catch {
      toast.error("Failed to load time data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function approveAdjustment(id: string, approve: boolean) {
    const res = await fetch(`/api/admin/hr/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: approve ? "approve_adjustment" : "deny_adjustment",
        adjustmentId: id,
        companyId: MORRIS_COMPANY_ID,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(approve ? "Adjustment approved" : "Adjustment denied");
      void load();
    } else {
      toast.error(json.error || "Action failed");
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-medium tracking-tight">Time & Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review clock punches, approve corrections, and export for payroll.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `/api/admin/hr/time?companyId=${MORRIS_COMPANY_ID}&date=${date}&export=csv`;
            }}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <PremiumCard className="p-4">
        <h2 className="text-lg font-semibold">Shifts — {date}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : shifts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No time entries for this date.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Clock in</th>
                  <th className="py-2 pr-3">Clock out</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{s.employeeName ?? s.employeeId}</td>
                    <td className="py-2 pr-3">
                      {s.clockInAt ? new Date(s.clockInAt).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {s.clockOutAt ? new Date(s.clockOutAt).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-2 pr-3">{s.shiftStatus ?? "—"}</td>
                    <td className="py-2">{s.hours != null ? s.hours.toFixed(2) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>

      <PremiumCard className="p-4">
        <h2 className="text-lg font-semibold">Pending corrections</h2>
        {adjustments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending timesheet adjustments.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {adjustments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{a.employeeId}</p>
                  <p className="text-xs text-muted-foreground">{a.reason}</p>
                  {a.proposedPunchedAt && (
                    <p className="text-xs text-muted-foreground">
                      Proposed: {new Date(a.proposedPunchedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void approveAdjustment(a.id, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void approveAdjustment(a.id, false)}>
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>
    </div>
  );
}
