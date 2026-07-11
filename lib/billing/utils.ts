import { createHash, randomBytes } from "crypto";
import type { BillingLineItem } from "@/types/billing";
import { lineItemAmount } from "@/lib/billing/line-items";

export {
  customerFacingLines,
  diffLineItems,
  lineItemAmount,
  sumCustomerFacingLines,
} from "@/lib/billing/line-items";

export function billingId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomBytes(3).toString("hex")}`;
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createShareToken(): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString();
  return { token, hash: hashShareToken(token), expiresAt };
}

export function normalizeLineItem(
  input: Partial<BillingLineItem> & { label: string; unitPrice: number },
  index = 0
): BillingLineItem {
  const quantity = input.quantity ?? 1;
  const unitPrice = input.unitPrice;
  return {
    id: input.id ?? billingId("li"),
    label: input.label,
    description: input.description,
    quantity,
    unitPrice,
    amount: input.amount ?? lineItemAmount(quantity, unitPrice),
    category: input.category ?? "custom",
    taxable: input.taxable ?? false,
    internal: input.internal ?? false,
    sortOrder: input.sortOrder ?? index,
  };
}

export function isEmailDeliveryConfigured(): boolean {
  return (
    process.env.NOTIFICATIONS_EMAIL_ENABLED === "true" &&
    Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST)
  );
}

export function estimateNumber(): string {
  return `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export function invoiceNumber(): string {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export function receiptNumber(): string {
  return `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
