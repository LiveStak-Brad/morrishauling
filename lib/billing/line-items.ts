import type { BillingLineItem } from "@/types/billing";

export function lineItemAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function sumCustomerFacingLines(lines: BillingLineItem[]): number {
  return Math.round(
    lines.filter((l) => !l.internal).reduce((s, l) => s + l.amount, 0) * 100
  ) / 100;
}

export function customerFacingLines(lines: BillingLineItem[]): BillingLineItem[] {
  return lines.filter((l) => !l.internal).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function diffLineItems(
  previous: BillingLineItem[],
  next: BillingLineItem[]
): BillingLineItem[] {
  const prevMap = new Map(previous.map((l) => [l.id, l]));
  const changed: BillingLineItem[] = [];
  for (const line of next) {
    const old = prevMap.get(line.id);
    if (!old || old.amount !== line.amount || old.label !== line.label || old.quantity !== line.quantity) {
      changed.push(line);
    }
    prevMap.delete(line.id);
  }
  for (const removed of prevMap.values()) {
    changed.push({ ...removed, amount: -removed.amount, label: `Removed: ${removed.label}` });
  }
  return changed;
}
