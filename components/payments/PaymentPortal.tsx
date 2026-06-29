"use client";

import { useState } from "react";
import type { PaymentMethod, PaymentTiming } from "@/types/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockPaymentProvider } from "@/lib/payment-provider";
import { useCompany } from "@/lib/company-context";
import { Loader2 } from "lucide-react";

interface PaymentPortalProps {
  jobId: string;
  total: number;
  balanceDue: number;
  amountPaid?: number;
  onPaymentComplete?: () => void;
}

export function PaymentPortal({
  jobId,
  total,
  balanceDue,
  amountPaid = 0,
  onPaymentComplete,
}: PaymentPortalProps) {
  const { company, companyId } = useCompany();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [timing, setTiming] = useState<PaymentTiming>("deposit");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const depositAmount = Math.max(
    company.paymentOptions.depositMinAmount,
    Math.round(total * (company.paymentOptions.depositPercent / 100))
  );

  const payAmount =
    timing === "deposit"
      ? depositAmount
      : timing === "full"
        ? balanceDue
        : 0;

  const handlePay = async () => {
    if (payAmount <= 0) return;
    setLoading(true);
    try {
      const result = await mockPaymentProvider.processPayment(
        {
          companyId,
          jobId,
          amount: payAmount,
          method,
          timing,
        },
        company
      );
      setReceipt(`Payment ${result.paymentId} — $${payAmount} (${result.status})`);
      onPaymentComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    setLoading(true);
    try {
      const inv = await mockPaymentProvider.saveInvoice(jobId, companyId, company);
      setReceipt(`Invoice saved: ${inv.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Portal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-muted p-2">
            <div className="text-muted-foreground">Total</div>
            <div className="font-bold">${total}</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <div className="text-muted-foreground">Paid</div>
            <div className="font-bold text-green-600">${amountPaid}</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <div className="text-muted-foreground">Balance</div>
            <div className="font-bold text-brand-primary">${balanceDue}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["deposit", "full", "after_completion"] as PaymentTiming[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={timing === t ? "default" : "outline"}
              className={timing === t ? "bg-brand-primary hover:bg-brand-primary/90" : ""}
              onClick={() => setTiming(t)}
            >
              {t === "deposit" ? `Deposit ($${depositAmount})` : t === "full" ? "Pay full" : "Pay later"}
            </Button>
          ))}
        </div>

        <div>
          <Label>Payment method</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {company.paymentOptions.methods.map((m) => (
              <Badge
                key={m}
                variant={method === m ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setMethod(m)}
              >
                {m.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {method === "card" && timing !== "after_completion" && (
          <div className="space-y-2 rounded-lg border p-3">
            <Label>Card details (placeholder)</Label>
            <Input placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVC" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {timing !== "after_completion" && (
            <Button
              onClick={handlePay}
              disabled={loading || payAmount <= 0}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay ${payAmount}
            </Button>
          )}
          <Button variant="outline" onClick={handleSaveInvoice} disabled={loading}>
            Save invoice
          </Button>
          <Button variant="ghost" disabled title="Refund placeholder">
            Refund / adjustment
          </Button>
        </div>

        {receipt && (
          <p className="text-sm text-green-600">{receipt}</p>
        )}
      </CardContent>
    </Card>
  );
}
