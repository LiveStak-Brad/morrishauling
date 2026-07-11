"use client";

import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { ESTIMATE_STATUS_LABELS } from "@/types/billing";

/** Shared customer-facing estimate layout (public link + admin preview). */
export function EstimateCustomerView(props: {
  estimateNumber: string;
  status: keyof typeof ESTIMATE_STATUS_LABELS | string;
  estimatedTotal: number;
  lineItems: Array<{ id: string; label: string; quantity: number; amount: number; internal?: boolean }>;
  customerNotes?: string | null;
  customerName?: string | null;
  expiresAt?: string | null;
  children?: React.ReactNode;
}) {
  const lines = props.lineItems.filter((l) => !l.internal);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <CompanyLogo />
        <StatusChip
          label={ESTIMATE_STATUS_LABELS[props.status as keyof typeof ESTIMATE_STATUS_LABELS] ?? String(props.status)}
          variant="info"
        />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">
          {props.customerName ? `Estimate for ${props.customerName}` : "Your estimate"}
        </p>
        <h1 className="text-2xl font-bold">{props.estimateNumber}</h1>
      </div>
      <PremiumCard className="p-5">
        <p className="text-sm text-muted-foreground">Estimated project total</p>
        <p className="text-3xl font-bold text-brand-primary">${props.estimatedTotal.toFixed(2)}</p>
        <ul className="mt-4 space-y-2">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between text-sm">
              <span>
                {l.label}
                {l.quantity !== 1 ? ` × ${l.quantity}` : ""}
              </span>
              <span className="font-medium">${l.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        {props.customerNotes ? (
          <p className="mt-4 text-sm text-muted-foreground">{props.customerNotes}</p>
        ) : null}
        {props.expiresAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Valid through {props.expiresAt.slice(0, 10)}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          Estimated based on the information provided. Final pricing may change if on-site conditions
          differ.
        </p>
      </PremiumCard>
      {props.children}
    </div>
  );
}
