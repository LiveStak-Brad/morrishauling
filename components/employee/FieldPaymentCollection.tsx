"use client";

import { useState } from "react";
import type { Job } from "@/types/job";
import type { Invoice } from "@/types/payment";
import { useCompany } from "@/lib/company-context";
import { updateJob } from "@/lib/mock-data";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/components/payments/payment-ui";
import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  PenLine,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldPaymentCollectionProps {
  job: Job;
  invoice?: Invoice;
  onUpdate?: () => void;
}

const METHODS = [
  { id: "cash" as const, label: "Cash collected", icon: Banknote, color: "emerald" },
  { id: "check" as const, label: "Check collected", icon: Building2, color: "blue" },
  { id: "card_pending" as const, label: "Card pending", icon: CreditCard, color: "orange" },
  {
    id: "financing_requested" as const,
    label: "Financing requested",
    icon: Landmark,
    color: "brand",
  },
] as const;

export function FieldPaymentCollection({
  job,
  invoice,
  onUpdate,
}: FieldPaymentCollectionProps) {
  const { companyId } = useCompany();
  const [adjustment, setAdjustment] = useState(job.finalPriceAdjustment ?? 0);
  const [reason, setReason] = useState(job.finalPriceAdjustmentReason ?? "");
  const [approvalCaptured, setApprovalCaptured] = useState(
    job.customerApprovalCaptured ?? false
  );
  const [saved, setSaved] = useState(false);

  const baseTotal = invoice?.total ?? job.estimate?.total ?? 0;
  const adjustedTotal = baseTotal + adjustment;

  const selectMethod = (method: Job["fieldPaymentMethod"]) => {
    updateJob(companyId, job.id, {
      fieldPaymentMethod: method,
      paymentCollected: method === "cash" || method === "check",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onUpdate?.();
  };

  const saveAdjustment = () => {
    updateJob(companyId, job.id, {
      finalPriceAdjustment: adjustment,
      finalPriceAdjustmentReason: reason,
      extraFees: adjustment,
      priceAdjustmentNotes: reason,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onUpdate?.();
  };

  const captureApproval = () => {
    updateJob(companyId, job.id, { customerApprovalCaptured: true });
    setApprovalCaptured(true);
    onUpdate?.();
  };

  return (
    <div className="space-y-5">
      <PremiumCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Collect payment
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = job.fieldPaymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMethod(m.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-semibold transition-all",
                  active
                    ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    active ? "text-brand-primary" : "text-muted-foreground"
                  )}
                />
                {m.label}
              </button>
            );
          })}
        </div>
        {job.fieldPaymentMethod && (
          <p className="mt-3 text-center text-sm font-medium text-emerald-600">
            Recorded: {job.fieldPaymentMethod.replace(/_/g, " ")}
          </p>
        )}
      </PremiumCard>

      <PremiumCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Final price adjustment
        </p>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Base total</span>
            <span className="font-semibold">{formatCurrency(baseTotal)}</span>
          </div>
          <div>
            <Label>Adjustment (+/-)</Label>
            <Input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason for adjustment</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Extra items, longer carry, etc."
              rows={2}
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between border-t pt-3 font-bold">
            <span>Adjusted total</span>
            <span className="text-brand-primary">{formatCurrency(adjustedTotal)}</span>
          </div>
          <Button
            onClick={saveAdjustment}
            className="w-full bg-brand-primary hover:bg-brand-primary/90"
          >
            Save adjustment
          </Button>
        </div>
      </PremiumCard>

      <PremiumCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Customer approval
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Capture customer sign-off on final price before leaving site.
        </p>
        {approvalCaptured || job.customerApprovalCaptured ? (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            Approval captured (placeholder)
          </div>
        ) : (
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={captureApproval}
          >
            <PenLine className="mr-2 h-4 w-4" />
            Capture customer approval
          </Button>
        )}
      </PremiumCard>

      {saved && (
        <p className="text-center text-sm font-medium text-emerald-600">Saved</p>
      )}
    </div>
  );
}
