import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");

describe("security invariants in source", () => {
  it("payments/create never completes online methods", () => {
    const src = readFileSync(join(root, "app/api/payments/create/route.ts"), "utf8");
    expect(src).toMatch(/isOnlinePaymentMethod/);
    expect(src).toMatch(/checkout/);
    expect(src).not.toMatch(/status:\s*"completed"[\s\S]*method:\s*body\.method/);
  });

  it("webhook route verifies stripe signature", () => {
    const src = readFileSync(join(root, "app/api/payments/webhook/route.ts"), "utf8");
    expect(src).toMatch(/constructEvent/);
    expect(src).toMatch(/stripe-signature/);
  });

  it("public estimate and invoice routes enforce rate limits", () => {
    const est = readFileSync(join(root, "app/api/public/estimates/[token]/route.ts"), "utf8");
    const inv = readFileSync(join(root, "app/api/public/invoices/[token]/route.ts"), "utf8");
    expect(est).toMatch(/enforceRateLimit/);
    expect(inv).toMatch(/enforceRateLimit/);
  });

  it("invoice share access checks expiry/revoke", () => {
    const src = readFileSync(join(root, "lib/billing/share-tokens.ts"), "utf8");
    expect(src).toMatch(/share_token_revoked_at/);
    expect(src).toMatch(/share_token_expires_at/);
    expect(src).toMatch(/expired/);
  });

  it("guest request does not require auth profile", () => {
    const src = readFileSync(join(root, "app/api/public/guest-request/route.ts"), "utf8");
    expect(src).not.toMatch(/requireApiProfile|getCurrentProfile/);
    expect(src).toMatch(/findOrCreateGuestCustomer|Guest/);
  });
});
