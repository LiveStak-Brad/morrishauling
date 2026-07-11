import type {
  CreatePaymentRequest,
  Invoice,
  PaymentIntentResult,
  PaymentResult,
  RefundResult,
} from "@/types/payment";
import type { CompanyConfig } from "@/types";

export interface PaymentProvider {
  readonly providerId: string;
  createPaymentIntent(req: CreatePaymentRequest): Promise<PaymentIntentResult>;
  capturePayment(intentId: string): Promise<PaymentResult>;
  refund(paymentId: string, amount?: number): Promise<RefundResult>;
  saveInvoice(jobId: string, companyId: string, company: CompanyConfig): Promise<Invoice>;
  processPayment(req: CreatePaymentRequest, company: CompanyConfig): Promise<PaymentResult>;
}
