/** Online card/ACH processing — enable when Stripe (or other processor) is wired. */
export function isOnlineCardPaymentEnabled(): boolean {
  return false;
}

const ONLINE_METHODS = new Set(["card", "ach", "invoice"]);

export function isOnlinePaymentMethod(method: string): boolean {
  return ONLINE_METHODS.has(method);
}
