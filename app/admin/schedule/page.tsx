"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminScheduleManager } from "@/components/admin/AdminScheduleManager";
import type { Job } from "@/types/job";
import type { ScheduleSlot } from "@/types/schedule";

export default function AdminSchedulePage() {
  const { companyId } = useCompany();
  const today = new Date().toISOString().split("T")[0];
  const [initialSlots, setInitialSlots] = useState<ScheduleSlot[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/schedule/slots?companyId=${encodeURIComponent(companyId)}&fromDate=${today}&days=30&includeClosed=1`).then((r) => r.json()),
      fetch("/api/admin/jobs").then((r) => r.json()),
    ])
      .then(([slotsRes, jobsRes]) => {
        if (slotsRes.ok && slotsRes.slots) setInitialSlots(slotsRes.slots);
        if (jobsRes.ok) setJobs(jobsRes.jobs ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [companyId, today]);

  return (
    <AdminPageShell title="Schedule">
      {loading ? (
        <p className="text-muted-foreground">Loading schedule…</p>
      ) : (
        <AdminScheduleManager companyId={companyId} initialSlots={initialSlots} jobs={jobs} />
      )}
    </AdminPageShell>
  );
}
