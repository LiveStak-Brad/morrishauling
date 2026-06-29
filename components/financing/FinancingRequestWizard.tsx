"use client";

import { useMemo, useState } from "react";
import type { EmploymentStatus, PaymentFrequency } from "@/types/financing";
import { FINANCING_DISCLAIMER } from "@/types/financing";
import { useCompany } from "@/lib/company-context";
import { mutateFinancingRequest } from "@/lib/api/mutations";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  calculateFinancingBreakdown,
} from "@/lib/payment-utils";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/components/payments/payment-ui";
import { AlertTriangle, Calculator, CheckCircle2, Loader2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

interface FinancingRequestWizardProps {
  jobId: string;
  invoiceId?: string;
  totalAmount: number;
  onSubmitted?: () => void;
}

export function FinancingRequestWizard({
  jobId,
  invoiceId,
  totalAmount,
  onSubmitted,
}: FinancingRequestWizardProps) {
  const { company, companyId } = useCompany();
  const { customerId: authCustomerId } = useAuth();
  const [downPayment, setDownPayment] = useState(200);
  const [numberOfPayments, setNumberOfPayments] = useState(6);
  const [frequency, setFrequency] = useState<PaymentFrequency>("weekly");
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [employment, setEmployment] = useState<EmploymentStatus>("employed");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const breakdown = useMemo(
    () => calculateFinancingBreakdown(totalAmount, downPayment, numberOfPayments),
    [totalAmount, downPayment, numberOfPayments]
  );

  const freqLabel =
    frequency === "weekly"
      ? "weekly"
      : frequency === "biweekly"
        ? "bi-weekly"
        : "monthly";

  const handleSubmit = async () => {
    if (!termsAccepted || !company.financingOptions.inHouseEnabled || !authCustomerId) return;
    setLoading(true);
    try {
      await mutateFinancingRequest(companyId, {
        companyId,
        jobId,
        invoiceId,
        customerId: authCustomerId,
        provider: "in_house",
        totalAmount,
        downPayment,
        numberOfPayments,
        paymentFrequency: frequency,
        preferredFirstPaymentDate: firstPaymentDate,
        employmentStatus: employment,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        customerNotes: notes,
        termsAccepted,
        signaturePlaceholder: "Digital acceptance",
      });
      setSubmitted(true);
      onSubmitted?.();
    } finally {
      setLoading(false);
    }
  };

  if (!company.financingOptions.inHouseEnabled) {
    return (
      <PremiumCard className="p-6 text-center text-muted-foreground">
        In-house financing is not available for this account.
      </PremiumCard>
    );
  }

  if (submitted) {
    return (
      <PremiumCard className="border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold">Request submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Morris Hauling will review your payment plan request. You&apos;ll be notified once
          approved.
        </p>
        <ButtonLink href="/customer/payments" className="mt-6">
          Back to payments
        </ButtonLink>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-6">
      <PremiumCard className="overflow-hidden p-0">
        <div className="morris-gradient-bg px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <h2 className="font-bold">Payment plan preview</h2>
          </div>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(breakdown.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Down payment</span>
            <span className="font-semibold">{formatCurrency(breakdown.downPayment)}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-muted-foreground">Remaining balance</span>
            <span className="font-bold text-brand-primary">
              {formatCurrency(breakdown.remaining)}
            </span>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold">
              {numberOfPayments} {freqLabel} payments
            </p>
            <p className="mt-1 text-3xl font-bold text-brand-primary">
              {formatCurrency(breakdown.perPayment)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">per payment</p>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Job / invoice amount</Label>
          <Input value={totalAmount} readOnly className="mt-1.5 bg-muted" />
        </div>
        <div>
          <Label>Requested down payment</Label>
          <Input
            type="number"
            min={0}
            max={totalAmount}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Payment frequency</Label>
          <Select value={frequency} onValueChange={(v) => v && setFrequency(v as PaymentFrequency)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Number of payments</Label>
          <Input
            type="number"
            min={2}
            max={24}
            value={numberOfPayments}
            onChange={(e) => setNumberOfPayments(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Preferred first payment date</Label>
          <Input
            type="date"
            value={firstPaymentDate}
            onChange={(e) => setFirstPaymentDate(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Employment status</Label>
          <Select value={employment} onValueChange={(v) => v && setEmployment(v as EmploymentStatus)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="self_employed">Self-employed</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Monthly income (optional)</Label>
          <Input
            type="number"
            placeholder="e.g. 4500"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Notes / reason for request</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Help us understand your situation..."
            className="mt-1.5"
            rows={3}
          />
        </div>
      </div>

      <PremiumCard className="flex gap-3 border-orange-200 bg-orange-50/60 p-4 text-sm text-orange-900">
        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
        <p>{FINANCING_DISCLAIMER}</p>
      </PremiumCard>

      <div className="flex items-start gap-3">
        <Checkbox
          id="fin-terms"
          checked={termsAccepted}
          onCheckedChange={(c) => setTermsAccepted(!!c)}
        />
        <Label htmlFor="fin-terms" className="text-sm font-normal leading-relaxed">
          I have read and accept the financing terms. I understand approval is not guaranteed.
        </Label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !termsAccepted}
        className="h-12 w-full bg-brand-primary text-base font-semibold hover:bg-brand-primary/90"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit financing request
      </Button>
    </div>
  );
}
