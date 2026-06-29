"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/types/user";

interface Props {
  value: string;
  onChange: (customerId: string, customer?: Customer) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomerSelector({
  value,
  onChange,
  placeholder = "Search customers…",
  disabled,
  className,
}: Props) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCustomers(d.customers ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const selected = customers.find((c) => c.id === value);

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
          {loading && <p className="p-2 text-xs text-muted-foreground">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No customers — create one below</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(c.id, c);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">
                {c.phone ? ` · ${c.phone}` : ""}
                {c.email ? ` · ${c.email}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
