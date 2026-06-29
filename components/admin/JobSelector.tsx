"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/types";

interface Props {
  value: string;
  onChange: (jobId: string, job?: Job) => void;
  customerId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function JobSelector({
  value,
  onChange,
  customerId,
  placeholder = "Search jobs…",
  disabled,
  className,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setJobs(d.jobs ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = jobs;
    if (customerId) list = list.filter((j) => j.customerId === customerId);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          j.address.street.toLowerCase().includes(q) ||
          j.address.city.toLowerCase().includes(q) ||
          j.status.includes(q)
      );
    }
    return list.slice(0, 50);
  }, [jobs, customerId, query]);

  const selected = jobs.find((j) => j.id === value);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder={selected ? `${selected.address.street}, ${selected.address.city}` : placeholder}
        value={open ? query : selected ? `${selected.address.city} — ${selected.status}` : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-background shadow-lg">
          {filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No jobs found</p>
          ) : (
            filtered.map((j) => (
              <button
                key={j.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(j.id, j);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-medium">{j.address.street}, {j.address.city}</span>
                <span className="text-muted-foreground"> · {j.status} · {j.serviceType.replace("_", " ")}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
