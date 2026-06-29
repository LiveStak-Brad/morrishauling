"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TimeOffRequest } from "@/types/hr/schedule";
import { toast } from "@/lib/toast";

export default function AdminSchedulePage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    fetch("/api/hr/time-off")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setRequests(d.requests ?? []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (requestId: string, approved: boolean) => {
    const res = await fetch("/api/hr/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        requestId,
        approved,
        notes: notes[requestId],
      }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success(approved ? "Approved" : "Denied");
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <AdminPageShell title="Schedule & Time Off" description="Review PTO requests and manage scheduling">
      <h2 className="text-lg font-semibold mb-3">Pending time off ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="text-muted-foreground">No pending requests.</p>
      ) : (
        pending.map((r) => (
          <PremiumCard key={r.id} className="p-4 mb-3 space-y-2">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium capitalize">{r.requestType.replace(/_/g, " ")}</p>
                <p className="text-sm text-muted-foreground">
                  {r.startDate} → {r.endDate}
                  {r.hoursRequested != null && ` · ${r.hoursRequested}h`}
                  {r.partialDay && " · partial day"}
                </p>
                {r.reason && <p className="text-sm mt-1">{r.reason}</p>}
              </div>
              <Badge>Pending</Badge>
            </div>
            <Textarea
              placeholder="Manager notes"
              value={notes[r.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => review(r.id, true)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => review(r.id, false)}>
                Deny
              </Button>
            </div>
          </PremiumCard>
        ))
      )}
    </AdminPageShell>
  );
}
