import { isOnlineCardPaymentEnabled } from "@/lib/payments/online-payments-enabled";
import type { PaymentMethod } from "@/types/payment";

/** Manual payment methods available while Stripe is offline. */
export const MANUAL_PAYMENT_METHODS = [
  { id: "cash" as const, label: "Cash", description: "Pay the crew in cash on site" },
  { id: "check" as const, label: "Check", description: "Payable to Morris Junk Removal / Morris Hauling" },
  { id: "manual_card" as const, label: "Card (in person)", description: "Card terminal or phone payment with our office" },
  { id: "bank_transfer" as const, label: "Bank transfer", description: "ACH / wire — request instructions from our office" },
  { id: "other" as const, label: "Other", description: "Arrange another method with our office" },
] as const;

export type ManualPaymentMethodId = (typeof MANUAL_PAYMENT_METHODS)[number]["id"];

export function getCustomerFacingPaymentMethods(): Array<{
  id: string;
  label: string;
  description: string;
  online: boolean;
}> {
  const manual = MANUAL_PAYMENT_METHODS.map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    online: false,
  }));

  if (isOnlineCardPaymentEnabled()) {
    return [
      {
        id: "card",
        label: "Pay online with card",
        description: "Secure checkout",
        online: true,
      },
      ...manual,
    ];
  }

  return manual;
}

/** Admin recording methods (includes legacy aliases). */
export const ADMIN_RECORDABLE_METHODS: PaymentMethod[] = [
  "cash",
  "check",
  "cash_on_arrival",
  "financing",
  "invoice",
  "manual_card" as PaymentMethod,
  "bank_transfer" as PaymentMethod,
  "other" as PaymentMethod,
];

export function formatManualPaymentInstructions(phone: string): string[] {
  return [
    "Online card payment is not enabled yet. Please use one of the methods below:",
    ...MANUAL_PAYMENT_METHODS.map((m) => `• ${m.label} — ${m.description}`),
    `Questions? Call ${phone}.`,
  ];
}
