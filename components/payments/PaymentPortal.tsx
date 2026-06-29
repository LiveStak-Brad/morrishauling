"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnlinePaymentsDisabledNotice } from "@/components/payments/OnlinePaymentsDisabledNotice";

interface PaymentPortalProps {
  jobId: string;
  total: number;
  balanceDue: number;
  amountPaid?: number;
  onPaymentComplete?: () => void;
}

export function PaymentPortal({
  total,
  balanceDue,
  amountPaid = 0,
}: PaymentPortalProps) {
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

        {balanceDue > 0 && <OnlinePaymentsDisabledNotice className="border-0 bg-transparent p-0 shadow-none" />}
      </CardContent>
    </Card>
  );
}
