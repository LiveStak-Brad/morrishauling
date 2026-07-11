import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/route-utils";
import { getStripe } from "@/lib/payments/stripe-client";
import { handleStripeWebhookEvent } from "@/lib/payments/stripe-service";
import { isStripeServerReady, isStripeWebhookConfigured } from "@/lib/payments/stripe-config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeServerReady() || !isStripeWebhookConfigured()) {
    return apiError("Stripe webhooks are not configured", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return apiError("Missing stripe-signature", 400);

  const rawBody = await request.text();
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!.trim()
    );
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Invalid webhook signature", 400);
  }

  try {
    await handleStripeWebhookEvent(event);
    return apiOk({ received: true });
  } catch (e) {
    console.error("[stripe webhook]", e);
    return apiError(e instanceof Error ? e.message : "Webhook processing failed", 500);
  }
}
