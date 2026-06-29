"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodOption } from "@/types/payment";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { PaymentMethodIcon, getMethodBrandColor } from "./payment-ui";
import { Lock } from "lucide-react";

interface PaymentMethodSelectorProps {
  options: PaymentMethodOption[];
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  options,
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={!opt.available && !opt.placeholder}
            onClick={() => opt.available && onSelect(opt.id)}
            className={cn(
              "text-left transition-all",
              !opt.available && !opt.placeholder && "opacity-40"
            )}
          >
            <PremiumCard
              interactive={opt.available}
              className={cn(
                "relative overflow-hidden p-4",
                active && "ring-2 ring-brand-primary ring-offset-2",
                opt.placeholder && "opacity-75"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    getMethodBrandColor(opt.id)
                  )}
                >
                  <PaymentMethodIcon icon={opt.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{opt.label}</p>
                    {opt.placeholder && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </div>
              {opt.id === "card" && active && (
                <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600">
                  <Lock className="h-3 w-3" />
                  Secured checkout (mock)
                </div>
              )}
            </PremiumCard>
          </button>
        );
      })}
    </div>
  );
}
