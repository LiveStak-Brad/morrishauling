"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Radio, Receipt, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { href: "/book", label: "New Booking", icon: Plus },
  { href: "/planner", label: "Dispatch", icon: Radio },
  { href: "/admin/invoices", label: "Invoice", icon: Receipt },
  { href: "/admin/payments", label: "Payment", icon: CreditCard },
];

export function FloatingQuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6">
      {open && (
        <div className="mb-1 flex flex-col gap-2 animate-fade-in">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl border-2 border-brand-primary/30 bg-white px-4 py-3 shadow-lg transition-transform hover:scale-[1.02] dark:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="pr-2 text-sm font-bold">{a.label}</span>
              </Link>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close quick actions" : "Quick actions"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-[#6B0F1F] text-white shadow-xl transition-transform hover:scale-105",
          open && "rotate-45"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
      </button>
    </div>
  );
}
