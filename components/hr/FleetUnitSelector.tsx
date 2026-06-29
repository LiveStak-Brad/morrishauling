"use client";

import { useEffect, useMemo, useState } from "react";

export interface FleetUnit {
  id: string;
  name: string;
  kind: "truck" | "trailer";
  status?: string;
  licensePlate?: string;
}

interface Props {
  value: string;
  onChange: (unitId: string, unit?: FleetUnit) => void;
  kind?: "truck" | "trailer" | "all";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FleetUnitSelector({
  value,
  onChange,
  kind = "all",
  placeholder = "Search trucks / trailers…",
  disabled,
  className,
}: Props) {
  const [units, setUnits] = useState<FleetUnit[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/hr/fleet/units")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setUnits(d.units ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = units;
    if (kind !== "all") list = list.filter((u) => u.kind === kind);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    return list;
  }, [units, kind, query]);

  const selected = units.find((u) => u.id === value);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder={selected ? selected.name : placeholder}
        value={open ? query : selected?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-background shadow-lg">
          {filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No units — add trucks/trailers in Fleet</p>
          ) : (
            filtered.map((u) => (
              <button
                key={`${u.kind}-${u.id}`}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                onClick={() => {
                  onChange(u.id, u);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-medium">{u.name}</span>
                <span className="text-muted-foreground capitalize">
                  {" "}
                  · {u.kind}
                  {u.licensePlate ? ` · ${u.licensePlate}` : ""}
                  {u.status ? ` · ${u.status}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
