"use client";

import { useEffect, useMemo, useState } from "react";
import type { Invoice } from "@/types";

interface Props {
  value: string;
  onChange: (invoiceId: string, invoice?: Invoice) => void;
  customerId?: string;
  jobId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function InvoiceSelector({
  value,
  onChange,
  customerId,
  jobId,
  placeholder = "Search invoices…",
  disabled,
  className,
}: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/invoices")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setInvoices(d.invoices ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = invoices;
    if (customerId) list = list.filter((i) => i.customerId === customerId);
    if (jobId) list = list.filter((i) => i.jobId === jobId);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) => i.invoiceNumber.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 50);
  }, [invoices, customerId, jobId, query]);

  const selected = invoices.find((i) => i.id === value);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder={selected ? selected.invoiceNumber : placeholder}
        value={open ? query : selected?.invoiceNumber ?? ""}
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
          Balance {selected.balanceDue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </p>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-background shadow-lg">
          {filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No invoices found</p>
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(i.id, i);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-medium">{i.invoiceNumber}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · due ${i.balanceDue} · {i.status}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
