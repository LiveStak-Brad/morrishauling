"use client";

import { useEffect, useMemo, useState } from "react";
import type { HrEmployee } from "@/types/hr/employee";

export interface EmployeeOption extends HrEmployee {
  onboardingPercent?: number;
}

interface Props {
  value: string;
  onChange: (employeeId: string, employee?: EmployeeOption) => void;
  placeholder?: string;
  lifecycleFilter?: string;
  disabled?: boolean;
  className?: string;
}

export function EmployeeSelector({
  value,
  onChange,
  placeholder = "Search employees…",
  lifecycleFilter,
  disabled,
  className,
}: Props) {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (lifecycleFilter) params.set("lifecycleStatus", lifecycleFilter);
    fetch(`/api/hr/employees?${params}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.ok) return;
        const list: EmployeeOption[] = d.employees ?? [];
        const onboarding = list.filter((e) => e.lifecycleStatus === "onboarding");
        if (onboarding.length) {
          const percents = await Promise.all(
            onboarding.map((e) =>
              fetch(`/api/hr/employees/${e.id}/onboarding`)
                .then((r) => r.json())
                .then((o) => (o.ok ? o.progress?.percentComplete : undefined))
                .catch(() => undefined)
            )
          );
          onboarding.forEach((e, i) => {
            e.onboardingPercent = percents[i];
          });
        }
        setEmployees(list);
      })
      .finally(() => setLoading(false));
  }, [query, lifecycleFilter]);

  const selected = useMemo(() => employees.find((e) => e.id === value), [employees, value]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder={selected ? `${selected.firstName} ${selected.lastName}` : placeholder}
        value={open ? query : selected ? `${selected.firstName} ${selected.lastName}` : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
      />
      {selected && !open && (
        <p className="text-xs text-muted-foreground mt-1">
          {selected.employeeNumber ?? selected.id} · {selected.role}
          {selected.lifecycleStatus !== "active" && ` · ${selected.lifecycleStatus}`}
          {selected.onboardingPercent != null && ` · onboarding ${selected.onboardingPercent}%`}
        </p>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-background shadow-lg">
          {loading && <p className="p-2 text-xs text-muted-foreground">Loading…</p>}
          {!loading && employees.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No employees found</p>
          )}
          {employees.map((e) => (
            <button
              key={e.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(e.id, e);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium">
                {e.firstName} {e.lastName}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {e.employeeNumber ?? "—"} · {e.role} · {e.lifecycleStatus}
                {e.onboardingPercent != null ? ` · ${e.onboardingPercent}%` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
