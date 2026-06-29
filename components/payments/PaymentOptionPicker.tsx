"use client";

import type { PaymentMethod, PaymentTiming } from "@/types/payment";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/lib/company-context";

const METHOD_LABELS: Partial<Record<PaymentMethod, string>> = {
  card: "Card payment",
  cash_on_arrival: "Cash on arrival",
  cash: "Cash",
  check: "Check",
  invoice: "Invoice",
  financing: "Financing / Pay over time",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

function methodLabel(m: PaymentMethod) {
  return METHOD_LABELS[m] ?? m.replace(/_/g, " ");
}

const TIMING_LABELS: Record<PaymentTiming, string> = {
  deposit: "Pay deposit now",
  full: "Pay full amount now",
  after_completion: "Pay after job completion",
};

interface PaymentOptionPickerProps {
  method: PaymentMethod;
  timing: PaymentTiming;
  onMethodChange: (m: PaymentMethod) => void;
  onTimingChange: (t: PaymentTiming) => void;
}

export function PaymentOptionPicker({
  method,
  timing,
  onMethodChange,
  onTimingChange,
}: PaymentOptionPickerProps) {
  const { company } = useCompany();
  const { paymentOptions } = company;

  return (
    <div className="space-y-4">
      <div>
        <Label>Payment method</Label>
        <Select value={method} onValueChange={(v) => onMethodChange(v as PaymentMethod)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentOptions.methods.map((m) => (
              <SelectItem key={m} value={m}>
                {methodLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>When to pay</Label>
        <Select value={timing} onValueChange={(v) => onTimingChange(v as PaymentTiming)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deposit">{TIMING_LABELS.deposit}</SelectItem>
            <SelectItem value="full">{TIMING_LABELS.full}</SelectItem>
            {paymentOptions.allowPayAfterCompletion && (
              <SelectItem value="after_completion">
                {TIMING_LABELS.after_completion}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
