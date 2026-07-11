"use client";

import { Phone } from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

/** Persistent mobile call bar — primary conversion path while booking is closed. */
export function StickyMobileConcierge({ className }: { className?: string }) {
  const { company } = useCompany();
  const tel = company.phone.replace(/\D/g, "");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <a
        href={`tel:${tel}`}
        className="flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-base font-semibold text-white shadow-md transition hover:bg-brand-primary/90 active:scale-[0.99]"
      >
        <Phone className="h-5 w-5" aria-hidden />
        Call {company.phone}
      </a>
    </div>
  );
}
