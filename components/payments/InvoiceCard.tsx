"use client";

import Link from "next/link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import type { Invoice } from "@/types/payment";
import {
  derivePaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { formatCurrency, formatDate } from "./payment-ui";
import { ArrowRight, MapPin } from "lucide-react";
import type { Job } from "@/types/job";
import type { FinancingRequest } from "@/types/financing";

interface InvoiceCardProps {
  invoice: Invoice;
  job?: Job;
  financing?: FinancingRequest | null;
  href: string;
  index?: number;
}

export function InvoiceCard({
  invoice,
  job,
  financing,
  href,
  index = 0,
}: InvoiceCardProps) {
  const status = derivePaymentStatus(invoice, financing);

  return (
    <Link href={href}>
      <PremiumCard
        interactive
        className="p-4 animate-slide-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
            <p className="mt-1 font-semibold">
              {job?.junkType ?? "Junk removal"} · {job?.address.city ?? "—"}
            </p>
            {job && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {job.address.street}
              </p>
            )}
          </div>
          <StatusChip
            label={getPaymentStatusLabel(status)}
            variant={getPaymentStatusVariant(status)}
            pulse={status === "financing_requested"}
          />
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className="text-xl font-bold text-brand-primary">
              {formatCurrency(invoice.balanceDue)}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Total {formatCurrency(invoice.total)}</p>
            {invoice.dueDate && <p>Due {formatDate(invoice.dueDate)}</p>}
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </PremiumCard>
    </Link>
  );
}
