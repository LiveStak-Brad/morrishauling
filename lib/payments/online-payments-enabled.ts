/** Online card/ACH — enable when Stripe keys are present and NEXT_PUBLIC_STRIPE_ENABLED=true. */
export function isOnlineCardPaymentEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}

const ONLINE_METHODS = new Set(["card", "ach"]);

export function isOnlinePaymentMethod(method: string): boolean {
  return ONLINE_METHODS.has(method);
}
