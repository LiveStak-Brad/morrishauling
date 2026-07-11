/** Re-export Stripe-aware online payment gates (legacy import path). */
export {
  isOnlineCardPaymentEnabled,
  isOnlinePaymentMethod,
  getPaymentsProviderMode,
  isStripeServerReady,
  stripeConfigStatus,
} from "@/lib/payments/stripe-config";
