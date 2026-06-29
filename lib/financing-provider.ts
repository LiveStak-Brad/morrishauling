import type {
  FinancingRequest,
  FinancingRequestInput,
  FinancingSchedulePayment,
} from "@/types/financing";
import {
  createFinancingRequest,
  getFinancingRequest,
  updateFinancingRequest,
  updateInvoice,
} from "@/lib/mock-data";
import { generatePaymentSchedule } from "@/lib/payment-utils";

export interface ApproveFinancingOptions {
  downPayment?: number;
  numberOfPayments?: number;
  internalNotes?: string;
}

export interface FinancingProvider {
  readonly providerId: string;
  requestPlan(req: FinancingRequestInput): Promise<FinancingRequest>;
  approve(id: string, companyId: string, options?: ApproveFinancingOptions): Promise<FinancingRequest>;
  deny(id: string, companyId: string, reason?: string, internalNotes?: string): Promise<FinancingRequest>;
  updateInternalNotes(id: string, companyId: string, notes: string): Promise<FinancingRequest>;
  markPaymentReceived(
    id: string,
    companyId: string,
    schedulePaymentId: string
  ): Promise<FinancingRequest>;
  markPaymentLate(
    id: string,
    companyId: string,
    schedulePaymentId: string
  ): Promise<FinancingRequest>;
  isAvailable(): boolean;
  getPlaceholderMessage(): string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSchedule(req: FinancingRequest): FinancingSchedulePayment[] {
  const remaining = Math.max(0, req.totalAmount - req.downPayment);
  const start =
    req.preferredFirstPaymentDate ?? new Date().toISOString().split("T")[0];
  return generatePaymentSchedule(
    remaining,
    req.numberOfPayments,
    req.paymentFrequency,
    start
  );
}

export class InHouseFinancingProvider implements FinancingProvider {
  readonly providerId = "in_house";

  isAvailable() {
    return true;
  }

  getPlaceholderMessage() {
    return "In-house financing — admin approval required";
  }

  async requestPlan(req: FinancingRequestInput): Promise<FinancingRequest> {
    await delay(400);
    const created = createFinancingRequest(req.companyId, {
      ...req,
      status: "pending",
      riskScore: Math.floor(Math.random() * 40) + 50,
    });
    if (req.invoiceId) {
      updateInvoice(req.companyId, req.invoiceId, {
        paymentStatus: "financing_requested",
      });
    }
    return created;
  }

  async approve(
    id: string,
    companyId: string,
    options?: ApproveFinancingOptions
  ): Promise<FinancingRequest> {
    await delay(300);
    const existing = getFinancingRequest(companyId, id);
    if (!existing) throw new Error("Financing request not found");

    const merged: FinancingRequest = {
      ...existing,
      downPayment: options?.downPayment ?? existing.downPayment,
      numberOfPayments: options?.numberOfPayments ?? existing.numberOfPayments,
      internalNotes: options?.internalNotes ?? existing.internalNotes,
    };
    const paymentSchedule = buildSchedule(merged);

    const updated = updateFinancingRequest(companyId, id, {
      status: "approved",
      downPayment: merged.downPayment,
      numberOfPayments: merged.numberOfPayments,
      internalNotes: merged.internalNotes,
      paymentSchedule,
    });
    if (!updated) throw new Error("Financing request not found");

    if (updated.invoiceId) {
      updateInvoice(companyId, updated.invoiceId, {
        paymentStatus: "financing_approved",
      });
    }
    return updated;
  }

  async deny(
    id: string,
    companyId: string,
    reason?: string,
    internalNotes?: string
  ): Promise<FinancingRequest> {
    await delay(300);
    const updated = updateFinancingRequest(companyId, id, {
      status: "denied",
      denialReason: reason ?? "Not approved",
      internalNotes,
    });
    if (!updated) throw new Error("Financing request not found");
    if (updated.invoiceId) {
      updateInvoice(companyId, updated.invoiceId, {
        paymentStatus: "financing_denied",
      });
    }
    return updated;
  }

  async updateInternalNotes(
    id: string,
    companyId: string,
    notes: string
  ): Promise<FinancingRequest> {
    const updated = updateFinancingRequest(companyId, id, { internalNotes: notes });
    if (!updated) throw new Error("Financing request not found");
    return updated;
  }

  async markPaymentReceived(
    id: string,
    companyId: string,
    schedulePaymentId: string
  ): Promise<FinancingRequest> {
    const req = getFinancingRequest(companyId, id);
    if (!req?.paymentSchedule) throw new Error("Financing request not found");

    const paymentSchedule = req.paymentSchedule.map((p) =>
      p.id === schedulePaymentId
        ? { ...p, status: "paid" as const, paidAt: new Date().toISOString() }
        : p
    );
    const updated = updateFinancingRequest(companyId, id, {
      paymentSchedule,
      status: paymentSchedule.every((p) => p.status === "paid") ? "completed" : "active",
    });
    if (!updated) throw new Error("Financing request not found");
    return updated;
  }

  async markPaymentLate(
    id: string,
    companyId: string,
    schedulePaymentId: string
  ): Promise<FinancingRequest> {
    const req = getFinancingRequest(companyId, id);
    if (!req?.paymentSchedule) throw new Error("Financing request not found");

    const paymentSchedule = req.paymentSchedule.map((p) =>
      p.id === schedulePaymentId ? { ...p, status: "late" as const } : p
    );
    const updated = updateFinancingRequest(companyId, id, {
      paymentSchedule,
      status: "active",
    });
    if (!updated) throw new Error("Financing request not found");
    return updated;
  }
}

abstract class ThirdPartyFinancingProvider implements FinancingProvider {
  abstract readonly providerId: string;
  abstract readonly name: string;

  isAvailable() {
    return false;
  }

  getPlaceholderMessage() {
    return `${this.name} integration — connect API to enable`;
  }

  async requestPlan(req: FinancingRequestInput): Promise<FinancingRequest> {
    await delay(200);
    return createFinancingRequest(req.companyId, {
      ...req,
      provider: this.providerId as FinancingRequest["provider"],
      status: "pending",
    });
  }

  async approve(id: string, companyId: string): Promise<FinancingRequest> {
    const req = getFinancingRequest(companyId, id);
    if (!req) throw new Error("Not found");
    return req;
  }

  async deny(id: string, companyId: string, reason?: string): Promise<FinancingRequest> {
    const req = getFinancingRequest(companyId, id);
    if (!req) throw new Error("Not found");
    return updateFinancingRequest(companyId, id, { status: "denied", denialReason: reason })!;
  }

  async updateInternalNotes(): Promise<FinancingRequest> {
    throw new Error("Not supported for third-party providers");
  }

  async markPaymentReceived(): Promise<FinancingRequest> {
    throw new Error("Not supported for third-party providers");
  }

  async markPaymentLate(): Promise<FinancingRequest> {
    throw new Error("Not supported for third-party providers");
  }
}

export class KlarnaProvider extends ThirdPartyFinancingProvider {
  readonly providerId = "klarna";
  readonly name = "Klarna";
}

export class AffirmProvider extends ThirdPartyFinancingProvider {
  readonly providerId = "affirm";
  readonly name = "Affirm";
}

export class AfterpayProvider extends ThirdPartyFinancingProvider {
  readonly providerId = "afterpay";
  readonly name = "Afterpay";
}

export const inHouseFinancingProvider = new InHouseFinancingProvider();
export const klarnaProvider = new KlarnaProvider();
export const affirmProvider = new AffirmProvider();
export const afterpayProvider = new AfterpayProvider();

export function getFinancingProviders(inHouseEnabled: boolean) {
  const providers: FinancingProvider[] = [];
  if (inHouseEnabled) providers.push(inHouseFinancingProvider);
  providers.push(klarnaProvider, affirmProvider, afterpayProvider);
  return providers;
}
