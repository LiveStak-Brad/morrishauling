"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DispatchReadyEmployee } from "@/types/hr/nav";

interface PlannerCrewPanelProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelect?: number;
}

export function PlannerCrewPanel({ selectedIds, onChange, maxSelect = 4 }: PlannerCrewPanelProps) {
  const [employees, setEmployees] = useState<DispatchReadyEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hr/dispatch-ready")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setEmployees(d.employees); })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (emp: DispatchReadyEmployee) => {
    if (selectedIds.includes(emp.id)) {
      onChange(selectedIds.filter((id) => id !== emp.id));
      return;
    }
    if (selectedIds.length >= maxSelect) return;
    onChange([...selectedIds, emp.id]);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading crew from HR…</p>;

  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active HR employees. Add employees in HR Platform first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Crew (HR active employees)</p>
      <div className="flex flex-wrap gap-2">
        {employees.map((emp) => {
          const selected = selectedIds.includes(emp.id);
          const hasWarnings = emp.warnings.length > 0;
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => toggle(emp)}
              className={cn(
                "inline-flex max-w-full flex-col items-start gap-1 rounded-xl border-2 px-3 py-2 text-left text-xs transition-all",
                selected
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-transparent bg-muted hover:border-border"
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <User className="h-3 w-3 shrink-0" />
                {emp.name}
                <Badge variant="outline" className="text-[10px] capitalize">{emp.role}</Badge>
              </span>
              {hasWarnings ? (
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {emp.warnings[0]}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Cleared for dispatch
                </span>
              )}
              {!emp.onboardingComplete && (
                <span className="text-amber-600">Onboarding {emp.onboardingPercent}%</span>
              )}
              {emp.licenseWarning && (
                <span className="text-red-600">{emp.licenseWarning}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {selectedIds.length} of {maxSelect} selected · Only active HR employees shown
      </p>
    </div>
  );
}
