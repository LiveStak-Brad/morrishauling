"use client";

import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import type { Invoice, Payment } from "@/types/payment";

/** Shared customer-facing invoice layout (public link + admin preview). */
export function InvoiceCustomerView(props: {
  invoice: Invoice;
  payments?: Payment[];
  customerName?: string | null;
  children?: React.ReactNode;
}) {
  const { invoice, payments = [], customerName } = props;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <CompanyLogo />
        <StatusChip label={invoice.status.replace(/_/g, " ")} variant="info" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">
          {customerName ? `Invoice for ${customerName}` : "Your invoice"}
        </p>
        <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
      </div>
      <PremiumCard className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-brand-primary">${invoice.total.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance due</p>
            <p className="text-2xl font-bold">${invoice.balanceDue.toFixed(2)}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {(invoice.adjustments ?? []).map((l) => (
            <li key={l.id} className="flex justify-between text-sm">
              <span>{l.label}</span>
              <span className="font-medium">${l.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        {invoice.finalPriceNotes ? (
          <p className="mt-4 text-sm text-muted-foreground">{invoice.finalPriceNotes}</p>
        ) : null}
      </PremiumCard>
      {payments.length > 0 && (
        <PremiumCard className="p-5">
          <h3 className="font-bold">Payments</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {payments
              .filter((p) => !p.reversedAt)
              .map((p) => (
                <li key={p.id} className="flex justify-between text-muted-foreground">
                  <span>{p.method}{p.receiptNumber ? ` · ${p.receiptNumber}` : ""}</span>
                  <span>${p.amount.toFixed(2)}</span>
                </li>
              ))}
          </ul>
        </PremiumCard>
      )}
      {props.children}
    </div>
  );
}
