"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import {
  DEMO_CUSTOMER_IDS,
  getFinancingByJob,
  getInvoicesForCustomer,
  getJobByCompany,
  getPaymentsForCustomer,
} from "@/lib/mock-data";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { InvoiceCard } from "@/components/payments/InvoiceCard";
import { PaymentActivityTimeline } from "@/components/payments/PaymentActivityTimeline";
import { TrustBadgeRow } from "@/components/payments/payment-ui";
import { PremiumCard } from "@/components/morris/PremiumCard";
import {
  derivePaymentStatus,
  buildPaymentActivity,
} from "@/lib/payment-utils";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Landmark, Receipt, ShieldCheck } from "lucide-react";

export default function CustomerPaymentsPage() {
  const { company, companyId } = useCompany();
  const [tick, setTick] = useState(0);
  const customerId = DEMO_CUSTOMER_IDS[companyId];
  const invoices = getInvoicesForCustomer(companyId, customerId);
  const payments = getPaymentsForCustomer(companyId, customerId);

  const totals = useMemo(() => {
    const balanceDue = invoices.reduce((s, i) => s + i.balanceDue, 0);
    const total = invoices.reduce((s, i) => s + i.total, 0);
    const amountPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const primary = invoices.find((i) => i.balanceDue > 0) ?? invoices[0];
    const financing = primary
      ? getFinancingByJob(companyId, primary.jobId)
      : undefined;
    const status = primary
      ? derivePaymentStatus(primary, financing)
      : ("paid_in_full" as const);
    return { balanceDue, total, amountPaid, primary, financing, status };
  }, [companyId, customerId, invoices, tick]);

  const allActivity = useMemo(() => {
    const events = invoices.flatMap((inv) => {
      const fin = getFinancingByJob(companyId, inv.jobId);
      const invPayments = payments.filter(
        (p) => p.invoiceId === inv.id || p.jobId === inv.jobId
      );
      return buildPaymentActivity(inv, invPayments, fin);
    });
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, payments, companyId]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6">
        <p className="text-sm font-medium text-muted-foreground">Payments</p>
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">{company.companyName}</p>
      </div>

      <div className="mt-6 space-y-6 px-4">
        <PaymentSummaryCard
          balanceDue={totals.balanceDue}
          total={totals.total}
          amountPaid={totals.amountPaid}
          status={totals.status}
          invoiceNumber={totals.primary?.invoiceNumber}
        />

        <div className="flex gap-2">
          <ButtonLink
            href="/customer/financing"
            variant="outline"
            className="flex-1"
          >
            <Landmark className="mr-2 h-4 w-4" />
            Financing
          </ButtonLink>
          <Button variant="outline" className="flex-1" disabled title="Coming soon">
            <Receipt className="mr-2 h-4 w-4" />
            Receipts
          </Button>
        </div>

        <TrustBadgeRow />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Invoices</h2>
            <span className="text-sm text-muted-foreground">{invoices.length} total</span>
          </div>
          {invoices.length === 0 ? (
            <PremiumCard className="p-8 text-center text-muted-foreground">
              No invoices yet
            </PremiumCard>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv, i) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  job={getJobByCompany(companyId, inv.jobId)}
                  financing={getFinancingByJob(companyId, inv.jobId)}
                  href={`/customer/payments/${inv.id}`}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-bold">Recent activity</h2>
          <PaymentActivityTimeline events={allActivity.slice(0, 8)} />
        </section>

        <PremiumCard className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-600" />
          <p>
            Payments are processed securely. Morris Hauling never stores your full card number on
            this device.
          </p>
        </PremiumCard>
      </div>
    </div>
  );
}
