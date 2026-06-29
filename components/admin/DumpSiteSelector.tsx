"use client";

import { useEffect, useMemo, useState } from "react";
import type { OperationalDumpSite } from "@/types/operations-depth";

interface Props {
  value: string;
  onChange: (siteId: string, site?: OperationalDumpSite) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DumpSiteSelector({
  value,
  onChange,
  placeholder = "Search dump sites…",
  disabled,
  className,
}: Props) {
  const [sites, setSites] = useState<OperationalDumpSite[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dump-sites")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setSites(d.sites ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return sites;
    const q = query.toLowerCase();
    return sites.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [sites, query]);

  const selected = sites.find((s) => s.id === value);

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
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-background shadow-lg">
          {filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No dump sites — add one in Admin</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.id, s);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground"> · {s.address}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
