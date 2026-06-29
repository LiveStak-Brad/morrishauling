import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { DEMO_CUSTOMER_ID } from "@/lib/mock-data";

/** Returns demo customer id only when demo mode is enabled; never in production unless DEMO_DATA=true. */
export function resolveDemoCustomerId(authCustomerId?: string | null): string | null {
  if (authCustomerId) return authCustomerId;
  if (isDemoDataEnabled()) return DEMO_CUSTOMER_ID;
  return null;
}
