"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OnboardingWizard } from "@/components/hr/OnboardingWizard";
import type { HrEmployee } from "@/types/hr/employee";
import type { OnboardingProgress } from "@/types/hr/onboarding";
import Link from "next/link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, OnboardingProgress>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hr/employees?lifecycleStatus=onboarding")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.ok) return;
        setEmployees(d.employees);
        const map: Record<string, OnboardingProgress> = {};
        await Promise.all(
          d.employees.map(async (emp: HrEmployee) => {
            const res = await fetch(`/api/hr/employees/${emp.id}/onboarding`);
            const od = await res.json();
            if (od.ok) map[emp.id] = od.progress;
          })
        );
        setProgressMap(map);
      });
  }, []);

  return (
    <AdminPageShell title="Onboarding" description="Employees completing onboarding checklists">
      <div className="space-y-4">
        {employees.length === 0 ? (
          <p className="text-muted-foreground">No employees currently in onboarding.</p>
        ) : (
          employees.map((emp) => {
            const progress = progressMap[emp.id];
            const expanded = expandedId === emp.id;
            return (
              <PremiumCard key={emp.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/admin/hr/employees/${emp.id}`} className="font-medium hover:underline">
                      {emp.firstName} {emp.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {emp.employeeNumber} · {emp.employmentType?.replace(/_/g, " ")} · Hired {emp.hireDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{progress?.percentComplete ?? 0}%</span>
                      </div>
                      <Progress value={progress?.percentComplete ?? 0} className="h-2" />
                    </div>
                    <Badge variant={progress?.canActivate ? "default" : "secondary"}>
                      {progress?.requiredComplete ?? 0}/{progress?.requiredItems ?? 0} required
                    </Badge>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-brand-primary hover:underline"
                    onClick={() => setExpandedId(expanded ? null : emp.id)}
                  >
                    {expanded ? "Hide checklist" : "View checklist"}
                  </button>
                </div>
                {expanded && (
                  <div className="mt-4 border-t pt-4">
                    <OnboardingWizard employeeId={emp.id} />
                  </div>
                )}
              </PremiumCard>
            );
          })
        )}
      </div>
    </AdminPageShell>
  );
}
