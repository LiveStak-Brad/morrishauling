"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PremiumCard } from "@/components/morris/PremiumCard";
import type { HrEmployee } from "@/types/hr/employee";

const LIFECYCLE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Active",
  on_leave: "On Leave",
  terminated: "Terminated",
  archived: "Archived",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  w2_full_time: "W-2 Full Time",
  w2_part_time: "W-2 Part Time",
  "1099_contractor": "1099 Contractor",
  seasonal: "Seasonal",
  temporary: "Temporary",
  office_staff: "Office Staff",
};

export function EmployeeDirectory() {
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = search ? `/api/hr/employees?search=${encodeURIComponent(search)}` : "/api/hr/employees";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setEmployees(d.employees); })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search employees…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp) => (
            <Link key={emp.id} href={`/admin/hr/employees/${emp.id}`}>
              <PremiumCard className="p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {emp.employeeNumber} · {emp.position?.title ?? emp.role} · {emp.department?.name ?? "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {emp.employmentType && (
                    <Badge variant="outline">{EMPLOYMENT_LABELS[emp.employmentType] ?? emp.employmentType}</Badge>
                  )}
                  <Badge>{LIFECYCLE_LABELS[emp.lifecycleStatus] ?? emp.lifecycleStatus}</Badge>
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
