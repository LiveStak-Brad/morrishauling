"use client";

import { useState } from "react";
import type { PaymentFrequency } from "@/types/financing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/lib/company-context";
import { useAuth } from "@/components/auth/AuthProvider";
import { getFinancingProviders } from "@/lib/financing-provider";
import { Loader2 } from "lucide-react";

interface FinancingRequestFormProps {
  jobId: string;
  totalAmount: number;
  customerId?: string;
  onSubmitted?: () => void;
}

export function FinancingRequestForm({
  jobId,
  totalAmount,
  customerId: customerIdProp,
  onSubmitted,
}: FinancingRequestFormProps) {
  const { company, companyId } = useCompany();
  const { customerId: authCustomerId } = useAuth();
  const customerId = customerIdProp ?? authCustomerId;
  const [downPayment, setDownPayment] = useState(100);
  const [numberOfPayments, setNumberOfPayments] = useState(4);
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [signature, setSignature] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const providers = getFinancingProviders(company.financingOptions.inHouseEnabled);
  const activeProvider = providers.find((p) => p.isAvailable()) ?? providers[0];

  const handleSubmit = async () => {
    if (!termsAccepted || !customerId) return;
    setLoading(true);
    try {
      await activeProvider.requestPlan({
        companyId,
        jobId,
        customerId,
        provider: company.financingOptions.inHouseEnabled ? "in_house" : "klarna",
        totalAmount,
        downPayment,
        numberOfPayments,
        paymentFrequency: frequency,
        termsAccepted,
        signaturePlaceholder: signature,
      });
      setMessage("Financing request submitted — pending admin approval.");
      onSubmitted?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request Payment Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!company.financingOptions.inHouseEnabled && (
          <p className="text-sm text-muted-foreground">
            In-house financing not enabled. Third-party options:
            {company.financingOptions.thirdPartyProviders.map((p) => (
              <span key={p} className="ml-1 capitalize">{p}</span>
            ))}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Total amount</Label>
            <Input value={totalAmount} readOnly />
          </div>
          <div>
            <Label>Down payment</Label>
            <Input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Number of payments</Label>
            <Input
              type="number"
              min={2}
              max={24}
              value={numberOfPayments}
              onChange={(e) => setNumberOfPayments(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Payment frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as PaymentFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Customer signature (placeholder)</Label>
          <Input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type full name"
          />
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="fin-terms"
            checked={termsAccepted}
            onCheckedChange={(c) => setTermsAccepted(!!c)}
          />
          <Label htmlFor="fin-terms" className="text-sm font-normal">
            I accept the financing terms. Payments are subject to approval.
          </Label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !termsAccepted}
          className="bg-brand-primary hover:bg-brand-primary/90"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit financing request
        </Button>

        {message && <p className="text-sm text-green-600">{message}</p>}
      </CardContent>
    </Card>
  );
}
