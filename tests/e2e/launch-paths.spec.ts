/**
 * Playwright E2E smoke — highest-risk public paths.
 * Run: npx playwright test
 * Requires: app running at PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 */
import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("public booking surfaces", () => {
  test("book page offers guest estimate request", async ({ page }) => {
    await page.goto(`${base}/book`);
    await expect(page.getByRole("heading", { name: /book service/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /guest estimate request/i })).toBeVisible();
  });

  test("division status API returns junk and hauling", async ({ request }) => {
    const res = await request.get(`${base}/api/public/divisions/status`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBeTruthy();
    expect(json.data.divisions.junk_removal).toBeTruthy();
    expect(json.data.divisions.hauling).toBeTruthy();
    expect(json.data.divisions.junk_removal.launchStatus).toBeTruthy();
  });

  test("invalid public estimate token is rejected", async ({ request }) => {
    const res = await request.get(`${base}/api/public/estimates/not-a-real-token-zzzz`);
    expect([404, 410, 429]).toContain(res.status());
  });

  test("invalid public invoice token is rejected", async ({ request }) => {
    const res = await request.get(`${base}/api/public/invoices/not-a-real-token-zzzz`);
    expect([404, 410, 429]).toContain(res.status());
  });
});

test.describe("payment safety", () => {
  test("checkout without auth is rejected", async ({ request }) => {
    const res = await request.post(`${base}/api/payments/checkout`, {
      data: { companyId: "x", invoiceId: "y", amount: 1 },
    });
    expect([401, 403, 400]).toContain(res.status());
  });

  test("create payment with card method is rejected", async ({ request }) => {
    const res = await request.post(`${base}/api/payments/create`, {
      data: {
        companyId: "x",
        jobId: "y",
        amount: 10,
        method: "card",
        timing: "full",
      },
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});
