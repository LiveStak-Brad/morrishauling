/**
 * Client-safe mock payment provider for demo/local flows.
 * Must not import stripe-service, supabase/server, or other next/headers modules.
 */
import type {
  CreatePaymentRequest,
  Invoice,
  PaymentIntentResult,
  PaymentResult,
  RefundResult,
} from "@/types/payment";
import {
  createInvoice,
  createPayment,
  getJob,
  getInvoices,
  updateInvoice,
} from "@/lib/mock-data";
import { computeDepositAmount, derivePaymentStatus } from "@/lib/payment-utils";
import type { CompanyConfig } from "@/types";
import type { PaymentProvider } from "@/lib/payment-provider-types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockPaymentProvider implements PaymentProvider {
  readonly providerId = "mock";

  async createPaymentIntent(req: CreatePaymentRequest): Promise<PaymentIntentResult> {
    await delay(600);
    return {
      intentId: `pi_mock_${Date.now()}`,
      clientSecret: "mock_secret",
      status: "pending",
      amount: req.amount,
    };
  }

  async capturePayment(intentId: string): Promise<PaymentResult> {
    await delay(800);
    return {
      paymentId: `pay_${intentId}`,
      status: "completed",
      amount: 0,
    };
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    await delay(500);
    return {
      refundId: `ref_${paymentId}`,
      status: "refunded",
      amount: amount ?? 0,
    };
  }

  async saveInvoice(jobId: string, companyId: string, company: CompanyConfig): Promise<Invoice> {
    const job = getJob(jobId);
    if (!job?.estimate) throw new Error("Job or estimate not found");
    const existing = getInvoices(companyId).find((i) => i.jobId === jobId);
    if (existing) return existing;

    const total = job.estimate.total + (job.extraFees ?? 0) + (job.finalPriceAdjustment ?? 0);
    const depositAmount = computeDepositAmount(total, company);

    return createInvoice(companyId, {
      invoiceNumber: `MH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      companyId,
      jobId,
      customerId: job.customerId,
      estimateAmount: job.estimate.total,
      adjustments: [],
      subtotal: job.estimate.total,
      fees: job.extraFees ?? 0,
      depositAmount,
      depositPaid: 0,
      total,
      amountPaid: 0,
      balanceDue: total,
      status: "sent",
      paymentStatus: depositAmount > 0 ? "deposit_due" : "balance_due",
      terms: "Payment due upon completion unless deposit required to schedule.",
    });
  }

  async processPayment(req: CreatePaymentRequest, company: CompanyConfig): Promise<PaymentResult> {
    void company;
    const intent = await this.createPaymentIntent(req);
    const result = await this.capturePayment(intent.intentId);

    const receiptNumber = `RCP-${Math.floor(Math.random() * 90000) + 10000}`;
    const payment = createPayment(req.companyId, {
      companyId: req.companyId,
      jobId: req.jobId,
      invoiceId: req.invoiceId,
      amount: req.amount,
      method: req.method,
      timing: req.timing,
      status: "completed",
      receiptNumber,
    });

    const invoices = getInvoices(req.companyId);
    const invoice = req.invoiceId
      ? invoices.find((i) => i.id === req.invoiceId)
      : invoices.find((i) => i.jobId === req.jobId);

    if (invoice) {
      const amountPaid = invoice.amountPaid + req.amount;
      const depositPaid =
        req.timing === "deposit" ? invoice.depositPaid + req.amount : invoice.depositPaid;
      const balanceDue = Math.max(0, invoice.total - amountPaid);
      const updated: Partial<Invoice> = {
        amountPaid,
        depositPaid,
        balanceDue,
        status: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : invoice.status,
      };
      const draft = { ...invoice, ...updated };
      updated.paymentStatus = derivePaymentStatus(draft);
      updateInvoice(req.companyId, invoice.id, updated);
    }

    return { ...result, paymentId: payment.id, amount: req.amount, receiptNumber };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
