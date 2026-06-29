"use client";

import type { Invoice } from "@/types/payment";
import { OnlinePaymentsDisabledNotice } from "./OnlinePaymentsDisabledNotice";

interface PaymentCheckoutProps {
  invoice: Invoice;
  onComplete?: () => void;
}

/** Customer checkout — online card/ACH disabled until payment processor is wired. */
export function PaymentCheckout({ invoice }: PaymentCheckoutProps) {
  if (invoice.balanceDue <= 0) {
    return null;
  }

  return <OnlinePaymentsDisabledNotice />;
}
