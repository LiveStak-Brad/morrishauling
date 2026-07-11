/**
 * Stripe / payments configuration.
 * Manual payments always work. Online card requires explicit enable + secret key.
 */

export type PaymentsProviderMode = "manual" | "stripe";

export function getPaymentsProviderMode(): PaymentsProviderMode {
  const raw = (process.env.PAYMENTS_PROVIDER ?? "manual").toLowerCase();
  if (raw === "stripe") return "stripe";
  return "manual";
}

export function isStripeSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isStripePublishableConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

/** Server: Stripe can create sessions / intents. */
export function isStripeServerReady(): boolean {
  return (
    getPaymentsProviderMode() === "stripe" &&
    process.env.STRIPE_ENABLED === "true" &&
    isStripeSecretConfigured()
  );
}

/**
 * Customer-facing online card/ACH.
 * Requires provider mode stripe, server enable, public enable, and publishable key.
 */
export function isOnlineCardPaymentEnabled(): boolean {
  return (
    isStripeServerReady() &&
    process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true" &&
    isStripePublishableConfigured()
  );
}

export function getStripePublishableKey(): string | null {
  if (!isOnlineCardPaymentEnabled()) return null;
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? null;
}

export function stripeConfigStatus(): {
  mode: PaymentsProviderMode;
  serverReady: boolean;
  onlineEnabled: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (getPaymentsProviderMode() !== "stripe") missing.push("PAYMENTS_PROVIDER=stripe");
  if (process.env.STRIPE_ENABLED !== "true") missing.push("STRIPE_ENABLED=true");
  if (!isStripeSecretConfigured()) missing.push("STRIPE_SECRET_KEY");
  if (process.env.NEXT_PUBLIC_STRIPE_ENABLED !== "true") missing.push("NEXT_PUBLIC_STRIPE_ENABLED=true");
  if (!isStripePublishableConfigured()) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!isStripeWebhookConfigured()) missing.push("STRIPE_WEBHOOK_SECRET");
  return {
    mode: getPaymentsProviderMode(),
    serverReady: isStripeServerReady(),
    onlineEnabled: isOnlineCardPaymentEnabled(),
    missing,
  };
}

const ONLINE_METHODS = new Set(["card", "ach"]);

export function isOnlinePaymentMethod(method: string): boolean {
  return ONLINE_METHODS.has(method);
}
