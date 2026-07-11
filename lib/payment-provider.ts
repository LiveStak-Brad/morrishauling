/**
 * Server payment providers. Do not import this module from Client Components.
 * Client/demo code should use `@/lib/payment-provider-mock` only.
 */
import type {
  CreatePaymentRequest,
  Invoice,
  PaymentIntentResult,
  PaymentResult,
  RefundResult,
} from "@/types/payment";
import { isStripeServerReady } from "@/lib/payments/stripe-config";
import type { PaymentProvider } from "@/lib/payment-provider-types";
import { mockPaymentProvider, MockPaymentProvider } from "@/lib/payment-provider-mock";

export type { PaymentProvider } from "@/lib/payment-provider-types";
export { mockPaymentProvider, MockPaymentProvider };

/**
 * Real Stripe provider — Checkout Sessions only.
 * Completion happens exclusively via webhook reconciliation.
 */
export class StripeProvider implements PaymentProvider {
  readonly providerId = "stripe";

  async createPaymentIntent(req: CreatePaymentRequest): Promise<PaymentIntentResult> {
    if (!isStripeServerReady()) {
      throw new Error("Stripe is not configured");
    }
    const customerId = (req as CreatePaymentRequest & { customerId?: string }).customerId;
    if (!req.invoiceId) throw new Error("invoiceId required for Stripe checkout");
    if (!customerId) throw new Error("customerId required for Stripe checkout");

    const { createInvoiceCheckoutSession } = await import("@/lib/payments/stripe-service");
    const session = await createInvoiceCheckoutSession({
      companyId: req.companyId,
      customerId,
      allocations: [{ invoiceId: req.invoiceId, amount: req.amount }],
      timing: req.timing,
      jobId: req.jobId,
    });

    return {
      intentId: session.sessionId,
      clientSecret: session.url,
      status: "pending",
      amount: req.amount,
    };
  }

  async capturePayment(): Promise<PaymentResult> {
    throw new Error("Stripe payments are captured by webhook only — do not capture from the client");
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    if (!isStripeServerReady()) throw new Error("Stripe is not configured");
    const { getStripe } = await import("@/lib/payments/stripe-client");
    const stripe = getStripe();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const sb = createAdminClient();
    if (!sb) throw new Error("Database unavailable");
    const { data: payment } = await sb.from("payments").select("*").eq("id", paymentId).maybeSingle();
    if (!payment?.stripe_payment_intent_id) {
      throw new Error("Payment has no Stripe payment intent");
    }
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id as string,
      amount: amount != null ? Math.round(amount * 100) : undefined,
    });
    return {
      refundId: refund.id,
      status: "refunded",
      amount: (refund.amount ?? 0) / 100,
    };
  }

  async saveInvoice(): Promise<Invoice> {
    throw new Error("Use billing-operations createInvoiceFromEstimate for production invoices");
  }

  async processPayment(): Promise<PaymentResult> {
    throw new Error("Use /api/payments/checkout — browser return must not finalize payment");
  }
}

export class SquareProvider implements PaymentProvider {
  readonly providerId = "square";
  createPaymentIntent(): Promise<PaymentIntentResult> {
    return Promise.reject(new Error("Square integration not configured"));
  }
  capturePayment(): Promise<PaymentResult> {
    return Promise.reject(new Error("Square integration not configured"));
  }
  refund(): Promise<RefundResult> {
    return Promise.reject(new Error("Square integration not configured"));
  }
  saveInvoice(): Promise<Invoice> {
    return Promise.reject(new Error("Square integration not configured"));
  }
  processPayment(): Promise<PaymentResult> {
    return Promise.reject(new Error("Square integration not configured"));
  }
}

export class PayPalProvider implements PaymentProvider {
  readonly providerId = "paypal";
  createPaymentIntent(): Promise<PaymentIntentResult> {
    return Promise.reject(new Error("PayPal integration not configured"));
  }
  capturePayment(): Promise<PaymentResult> {
    return Promise.reject(new Error("PayPal integration not configured"));
  }
  refund(): Promise<RefundResult> {
    return Promise.reject(new Error("PayPal integration not configured"));
  }
  saveInvoice(): Promise<Invoice> {
    return Promise.reject(new Error("PayPal integration not configured"));
  }
  processPayment(): Promise<PaymentResult> {
    return Promise.reject(new Error("PayPal integration not configured"));
  }
}

export const stripePaymentProvider = new StripeProvider();

export function getActivePaymentProvider(): PaymentProvider {
  if (isStripeServerReady()) return stripePaymentProvider;
  return mockPaymentProvider;
}
