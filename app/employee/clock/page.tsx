"use client";

import { useEffect, useState, useCallback } from "react";
import { EmployeeTimeCard } from "@/components/employee/EmployeeTimeCard";
import type { EmployeeDashboardData } from "@/types/hr/employee-portal";

export default function EmployeeClockPage() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);

  const load = useCallback(() => {
    fetch("/api/me/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d.dashboard); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-2xl font-bold">Time Clock</h1>
      {data ? (
        <EmployeeTimeCard
          clock={data.clock}
          employeeId={data.employee.id}
          onPunch={load}
        />
      ) : (
        <p className="text-muted-foreground">Loading…</p>
      )}
    </div>
  );
}
