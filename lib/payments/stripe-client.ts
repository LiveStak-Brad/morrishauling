import Stripe from "stripe";
import { isStripeServerReady } from "@/lib/payments/stripe-config";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeServerReady()) {
    throw new Error("Stripe is not configured. Set PAYMENTS_PROVIDER=stripe, STRIPE_ENABLED=true, and STRIPE_SECRET_KEY.");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "http://localhost:3000";
  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}
