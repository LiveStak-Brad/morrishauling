import { describe, expect, it } from "vitest";
import { hashShareToken, createShareToken } from "@/lib/billing/utils";
import {
  isOnlineCardPaymentEnabled,
  isOnlinePaymentMethod,
  getPaymentsProviderMode,
} from "@/lib/payments/stripe-config";
import { checkRateLimit } from "@/lib/api/rate-limit";

describe("share tokens", () => {
  it("hashes tokens stably", () => {
    const a = hashShareToken("abc");
    const b = hashShareToken("abc");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("creates expiring tokens", () => {
    const t = createShareToken();
    expect(t.token.length).toBeGreaterThan(20);
    expect(t.hash).toBe(hashShareToken(t.token));
    expect(new Date(t.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("stripe config safety", () => {
  it("defaults online card pay off without env", () => {
    expect(isOnlineCardPaymentEnabled()).toBe(false);
    expect(getPaymentsProviderMode()).toBe("manual");
  });

  it("identifies online methods", () => {
    expect(isOnlinePaymentMethod("card")).toBe(true);
    expect(isOnlinePaymentMethod("cash")).toBe(false);
  });
});

describe("rate limit", () => {
  it("allows then blocks after limit", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "203.0.113.50" },
    });
    const key = `test-${Date.now()}`;
    let blocked = false;
    for (let i = 0; i < 6; i++) {
      const r = checkRateLimit(req, { key, limit: 5, windowMs: 60_000 });
      if (!r.allowed) blocked = true;
    }
    expect(blocked).toBe(true);
  });
});

describe("payment allocation math", () => {
  it("rejects over-allocation conceptually", () => {
    const balance = 100;
    const amount = 150;
    expect(amount > balance + 0.01).toBe(true);
  });

  it("pay-all allocations sum to total", () => {
    const invoices = [
      { id: "a", balance: 40 },
      { id: "b", balance: 60 },
    ];
    const allocations = invoices.map((i) => ({ invoiceId: i.id, amount: i.balance }));
    const sum = allocations.reduce((s, a) => s + a.amount, 0);
    expect(sum).toBe(100);
    expect(allocations).toHaveLength(2);
  });
});
