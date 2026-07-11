import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getAppBaseUrl } from "@/lib/payments/stripe-client";
import { isOnlineCardPaymentEnabled } from "@/lib/payments/stripe-config";
import { allocatePaymentAcrossInvoices } from "@/lib/db/billing-operations";
import { billingId, receiptNumber } from "@/lib/billing/utils";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import type { PaymentTiming } from "@/types/payment";

function sb() {
  const client = createAdminClient();
  if (!client) throw new Error("Database unavailable");
  return client;
}

export async function ensureStripeCustomer(input: {
  companyId: string;
  customerId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}): Promise<string> {
  const client = sb();
  const { data: customer, error } = await client
    .from("customers")
    .select("id, email, first_name, last_name, phone, stripe_customer_id")
    .eq("company_id", input.companyId)
    .eq("id", input.customerId)
    .maybeSingle();
  if (error) throw error;
  if (!customer) throw new Error("Customer not found");

  if (customer.stripe_customer_id) return customer.stripe_customer_id as string;

  const stripe = getStripe();
  const created = await stripe.customers.create({
    email: input.email || (customer.email as string) || undefined,
    name:
      input.name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      undefined,
    phone: input.phone || (customer.phone as string) || undefined,
    metadata: {
      morris_company_id: input.companyId,
      morris_customer_id: input.customerId,
    },
  });

  await client
    .from("customers")
    .update({ stripe_customer_id: created.id })
    .eq("id", input.customerId);

  return created.id;
}

export type CheckoutAllocation = { invoiceId: string; amount: number };

/**
 * Create a Stripe Checkout Session for one or more invoices.
 * Amounts are validated server-side against current balances.
 * Payment rows stay pending until webhook confirms.
 */
export async function createInvoiceCheckoutSession(input: {
  companyId: string;
  customerId: string;
  allocations: CheckoutAllocation[];
  timing?: PaymentTiming;
  divisionId?: string;
  jobId?: string;
  successPath?: string;
  cancelPath?: string;
  actorProfileId?: string;
}): Promise<{ sessionId: string; url: string; pendingPaymentId: string }> {
  if (!isOnlineCardPaymentEnabled()) {
    throw new Error("Online card payments are not enabled");
  }

  const client = sb();
  const allocations = input.allocations.filter((a) => a.amount > 0);
  if (allocations.length === 0) throw new Error("No payment amount specified");

  let totalCents = 0;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const validated: CheckoutAllocation[] = [];

  for (const alloc of allocations) {
    const { data: invoice, error } = await client
      .from("invoices")
      .select("id, invoice_number, balance_due, customer_id, job_id, status, company_id")
      .eq("company_id", input.companyId)
      .eq("id", alloc.invoiceId)
      .maybeSingle();
    if (error) throw error;
    if (!invoice) throw new Error(`Invoice ${alloc.invoiceId} not found`);
    if (invoice.customer_id !== input.customerId) {
      throw new Error("Invoice does not belong to this customer");
    }
    if (invoice.status === "void" || invoice.status === "written_off") {
      throw new Error(`Invoice ${invoice.invoice_number} cannot accept payment`);
    }
    const balance = Number(invoice.balance_due ?? 0);
    if (alloc.amount > balance + 0.001) {
      throw new Error(
        `Payment of $${alloc.amount.toFixed(2)} exceeds balance $${balance.toFixed(2)} on ${invoice.invoice_number}`
      );
    }
    const cents = Math.round(alloc.amount * 100);
    if (cents < 50) throw new Error("Minimum online payment is $0.50");
    totalCents += cents;
    validated.push({ invoiceId: alloc.invoiceId, amount: alloc.amount });
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: cents,
        product_data: {
          name: `Invoice ${invoice.invoice_number}`,
          description: "Morris Services payment",
        },
      },
    });
  }

  const stripeCustomerId = await ensureStripeCustomer({
    companyId: input.companyId,
    customerId: input.customerId,
  });

  const pendingPaymentId = billingId("pay");
  const primaryInvoiceId = validated[0]!.invoiceId;
  const { data: primaryInvoice } = await client
    .from("invoices")
    .select("job_id, division_id")
    .eq("id", primaryInvoiceId)
    .maybeSingle();

  const jobId = input.jobId || (primaryInvoice?.job_id as string) || "unassigned";
  const timing = input.timing ?? (validated.length > 1 ? "full" : "after_completion");

  await client.from("payments").insert({
    id: pendingPaymentId,
    company_id: input.companyId,
    job_id: jobId,
    invoice_id: primaryInvoiceId,
    customer_id: input.customerId,
    amount: totalCents / 100,
    method: "card",
    timing,
    status: "pending",
    provider: "stripe",
    division_id: input.divisionId ?? primaryInvoice?.division_id ?? null,
    notes: JSON.stringify({ allocations: validated }),
  });

  const base = getAppBaseUrl();
  const successPath = input.successPath ?? `/customer/payments?paid=1&payment=${pendingPaymentId}`;
  const cancelPath = input.cancelPath ?? `/customer/payments?canceled=1`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    client_reference_id: pendingPaymentId,
    line_items: lineItems,
    success_url: `${base}${successPath}`,
    cancel_url: `${base}${cancelPath}`,
    payment_intent_data: {
      metadata: {
        morris_payment_id: pendingPaymentId,
        morris_company_id: input.companyId,
        morris_customer_id: input.customerId,
        morris_allocations: JSON.stringify(validated),
      },
    },
    metadata: {
      morris_payment_id: pendingPaymentId,
      morris_company_id: input.companyId,
      morris_customer_id: input.customerId,
      morris_allocations: JSON.stringify(validated),
      morris_timing: timing,
    },
  });

  await client
    .from("payments")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      external_reference: session.id,
      status: "processing",
    })
    .eq("id", pendingPaymentId);

  if (!session.url) throw new Error("Stripe did not return a checkout URL");

  return { sessionId: session.id, url: session.url, pendingPaymentId };
}

export async function createPublicInvoiceCheckout(input: {
  companyId: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  shareToken: string;
}): Promise<{ sessionId: string; url: string }> {
  const result = await createInvoiceCheckoutSession({
    companyId: input.companyId,
    customerId: input.customerId,
    allocations: [{ invoiceId: input.invoiceId, amount: input.amount }],
    successPath: `/i/${input.shareToken}?paid=1`,
    cancelPath: `/i/${input.shareToken}?canceled=1`,
  });
  return { sessionId: result.sessionId, url: result.url };
}

async function alreadyProcessedEvent(eventId: string): Promise<boolean> {
  const client = sb();
  const { data } = await client
    .from("stripe_webhook_events")
    .select("id, processed_at")
    .eq("id", eventId)
    .maybeSingle();
  return Boolean(data?.processed_at);
}

async function markEvent(event: Stripe.Event, errorMessage?: string) {
  const client = sb();
  await client.from("stripe_webhook_events").upsert({
    id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    payload: event as unknown as Record<string, unknown>,
    processed_at: errorMessage ? null : new Date().toISOString(),
    error_message: errorMessage ?? null,
  });
}

function parseAllocations(raw: string | null | undefined): CheckoutAllocation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CheckoutAllocation[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((a) => a.invoiceId && typeof a.amount === "number" && a.amount > 0);
  } catch {
    return [];
  }
}

/**
 * Finalize a pending Stripe payment after verified webhook.
 * Idempotent on provider_event_id and payment status.
 */
export async function finalizeStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  const client = sb();
  const paymentId = session.metadata?.morris_payment_id || session.client_reference_id;
  if (!paymentId) throw new Error("Missing morris_payment_id on session");

  const { data: existing } = await client
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!existing) throw new Error(`Pending payment ${paymentId} not found`);
  if (existing.status === "completed") return;
  if (existing.provider_event_id === eventId) return;

  const companyId = (session.metadata?.morris_company_id || existing.company_id) as string;
  const customerId = (session.metadata?.morris_customer_id || existing.customer_id) as string;
  let allocations = parseAllocations(session.metadata?.morris_allocations);
  if (allocations.length === 0 && existing.notes) {
    try {
      const notes = JSON.parse(existing.notes as string) as { allocations?: CheckoutAllocation[] };
      allocations = notes.allocations ?? [];
    } catch {
      /* ignore */
    }
  }
  if (allocations.length === 0 && existing.invoice_id) {
    allocations = [{ invoiceId: existing.invoice_id as string, amount: Number(existing.amount) }];
  }

  const amountTotal = (session.amount_total ?? Math.round(Number(existing.amount) * 100)) / 100;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? (existing.stripe_payment_intent_id as string | null);

  await allocatePaymentAcrossInvoices(companyId, {
    customerId,
    amount: amountTotal,
    method: "card",
    allocations,
    timing: (session.metadata?.morris_timing as PaymentTiming) || "after_completion",
    notes: `Stripe Checkout ${session.id}`,
    existingPaymentId: paymentId,
    provider: "stripe",
    providerEventId: eventId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId ?? undefined,
    externalReference: session.id,
  });

  await enqueueNotification({
    companyId,
    customerId,
    jobId: existing.job_id as string,
    eventType: "payment_received",
    channel: "email",
    payload: {
      paymentId,
      amount: amountTotal,
      receipt: true,
    },
  });
}

export async function markStripePaymentFailed(input: {
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
  eventId: string;
  code?: string;
  message?: string;
}) {
  const client = sb();
  let query = client.from("payments").select("id, status").eq("provider", "stripe");
  if (input.paymentIntentId) {
    query = query.eq("stripe_payment_intent_id", input.paymentIntentId);
  } else if (input.checkoutSessionId) {
    query = query.eq("stripe_checkout_session_id", input.checkoutSessionId);
  } else {
    return;
  }
  const { data } = await query.maybeSingle();
  if (!data || data.status === "completed") return;

  await client
    .from("payments")
    .update({
      status: "failed",
      provider_event_id: input.eventId,
      failure_code: input.code ?? null,
      failure_message: input.message ?? null,
    })
    .eq("id", data.id);
}

export async function applyStripeRefund(input: {
  paymentIntentId: string;
  refundId: string;
  amountCents: number;
  eventId: string;
  partial: boolean;
}) {
  const client = sb();
  const { data: payment } = await client
    .from("payments")
    .select("*")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .maybeSingle();
  if (!payment) return;
  if (payment.provider_event_id === input.eventId) return;

  const refundAmount = input.amountCents / 100;
  const companyId = payment.company_id as string;

  // Reverse allocations proportionally / restore invoice balances
  const { data: allocations } = await client
    .from("payment_allocations")
    .select("*")
    .eq("payment_id", payment.id);

  if (allocations && allocations.length > 0) {
    const paymentTotal = Number(payment.amount);
    for (const alloc of allocations) {
      const share =
        paymentTotal > 0 ? (Number(alloc.amount) / paymentTotal) * refundAmount : refundAmount;
      const { data: inv } = await client
        .from("invoices")
        .select("amount_paid, balance_due, total, status")
        .eq("id", alloc.invoice_id)
        .maybeSingle();
      if (!inv) continue;
      const amountPaid = Math.max(0, Number(inv.amount_paid) - share);
      const balanceDue = Math.min(Number(inv.total), Number(inv.balance_due) + share);
      await client
        .from("invoices")
        .update({
          amount_paid: amountPaid,
          balance_due: balanceDue,
          status: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partially_paid" : "sent",
          payment_status: balanceDue <= 0 ? "paid_in_full" : "balance_due",
        })
        .eq("id", alloc.invoice_id);
    }
  } else if (payment.invoice_id) {
    const { data: inv } = await client
      .from("invoices")
      .select("amount_paid, balance_due, total")
      .eq("id", payment.invoice_id)
      .maybeSingle();
    if (inv) {
      const amountPaid = Math.max(0, Number(inv.amount_paid) - refundAmount);
      const balanceDue = Math.min(Number(inv.total), Number(inv.balance_due) + refundAmount);
      await client
        .from("invoices")
        .update({
          amount_paid: amountPaid,
          balance_due: balanceDue,
          status: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partially_paid" : "sent",
          payment_status: balanceDue <= 0 ? "paid_in_full" : "balance_due",
        })
        .eq("id", payment.invoice_id);
    }
  }

  await client
    .from("payments")
    .update({
      status: input.partial ? "partially_refunded" : "refunded",
      stripe_refund_id: input.refundId,
      provider_event_id: input.eventId,
      reversed_at: new Date().toISOString(),
      reversal_reason: input.partial ? `Partial refund ${input.refundId}` : `Refund ${input.refundId}`,
    })
    .eq("id", payment.id);
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  if (await alreadyProcessedEvent(event.id)) return;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await finalizeStripeCheckoutSession(session, event.id);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markStripePaymentFailed({
          checkoutSessionId: session.id,
          eventId: event.id,
          message: event.type,
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markStripePaymentFailed({
          paymentIntentId: pi.id,
          eventId: event.id,
          code: pi.last_payment_error?.code,
          message: pi.last_payment_error?.message,
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!pi) break;
        const refunds = charge.refunds?.data ?? [];
        const latest = refunds[0];
        const amountRefunded = charge.amount_refunded ?? 0;
        await applyStripeRefund({
          paymentIntentId: pi,
          refundId: latest?.id ?? `re_${event.id}`,
          amountCents: latest?.amount ?? amountRefunded,
          eventId: event.id,
          partial: amountRefunded < (charge.amount ?? 0),
        });
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const pi =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        if (!pi) break;
        const client = sb();
        const { data: payment } = await client
          .from("payments")
          .select("id, invoice_id, company_id")
          .eq("stripe_payment_intent_id", pi)
          .maybeSingle();
        if (payment?.invoice_id) {
          await client
            .from("invoices")
            .update({ status: "disputed" })
            .eq("id", payment.invoice_id);
        }
        break;
      }
      default:
        break;
    }
    await markEvent(event);
  } catch (e) {
    await markEvent(event, e instanceof Error ? e.message : "webhook handler failed");
    throw e;
  }
}
