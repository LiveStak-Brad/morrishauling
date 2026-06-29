"use client";

import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/morris/PremiumCard";
import {
  ArrowDownLeft,
  FileText,
  Landmark,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "./payment-ui";

export interface PaymentActivityEvent {
  id: string;
  label: string;
  amount?: number;
  date: string;
  type: string;
}

interface PaymentActivityTimelineProps {
  events: PaymentActivityEvent[];
  className?: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  payment: ArrowDownLeft,
  invoice: FileText,
  financing: Landmark,
  receipt: Receipt,
};

export function PaymentActivityTimeline({
  events,
  className,
}: PaymentActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No payment activity yet.</p>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, i) => {
        const Icon = TYPE_ICONS[event.type] ?? Receipt;
        return (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  event.type === "payment"
                    ? "bg-emerald-100 text-emerald-700"
                    : event.type === "financing"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "bg-gray-100 text-gray-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {i < events.length - 1 && (
                <div className="my-1 min-h-[1.5rem] w-px flex-1 bg-gray-200" />
              )}
            </div>
            <PremiumCard className="mb-3 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{event.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.date)}
                  </p>
                </div>
                {event.amount != null && (
                  <p
                    className={cn(
                      "text-sm font-bold",
                      event.type === "payment" ? "text-emerald-600" : ""
                    )}
                  >
                    {event.type === "payment" ? "-" : ""}
                    {formatCurrency(event.amount)}
                  </p>
                )}
              </div>
            </PremiumCard>
          </div>
        );
      })}
    </div>
  );
}
