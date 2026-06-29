"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { CustomerLoginPrompt } from "@/components/customer/CustomerLoginPrompt";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaymentStatusStepper } from "@/components/payments/PaymentStatusStepper";
import { PaymentCheckout } from "@/components/payments/PaymentCheckout";
import { InvoiceDetailView } from "@/components/invoices/InvoiceDetailView";
import { derivePaymentStatus } from "@/lib/payment-utils";
import { ArrowLeft } from "lucide-react";
import { PremiumCard } from "@/components/morris/PremiumCard";

export default function CustomerPaymentDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { data, loading, requiresLogin, refresh } = useCustomerPortal();
  const [tick, setTick] = useState(0);

  const invoice = data?.invoices.find((i) => i.id === invoiceId);
  const job = invoice ? data?.jobs.find((j) => j.id === invoice.jobId) : undefined;
  const payments =
    data?.payments.filter(
      (p) => p.invoiceId === invoiceId || (invoice && p.jobId === invoice.jobId)
    ) ?? [];
  const financing = invoice
    ? data?.financing.find((f) => f.jobId === invoice.jobId)
    : undefined;

  useEffect(() => {
    void tick;
  }, [tick]);

  if (requiresLogin) {
    return (
      <main className="p-6">
        <CustomerLoginPrompt redirectPath={`/customer/payments/${invoiceId}`} />
      </main>
    );
  }

  if (loading) {
    return <main className="p-6 text-muted-foreground">Loading invoice…</main>;
  }

  if (!invoice) {
    return (
      <main className="p-6 text-center">
        <p>Invoice not found</p>
        <Link href="/customer/payments" className="text-brand-primary underline">
          Back to payments
        </Link>
      </main>
    );
  }

  const status = derivePaymentStatus(invoice, financing);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6">
        <Link
          href="/customer/payments"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Payments
        </Link>
        <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
        <p className="text-sm text-muted-foreground">
          {job?.address.street}, {job?.address.city}
        </p>
      </div>

      <div className="mt-6 space-y-6 px-4">
        <PaymentSummaryCard
          balanceDue={invoice.balanceDue}
          total={invoice.total}
          amountPaid={invoice.amountPaid}
          status={status}
          invoiceNumber={invoice.invoiceNumber}
        />

        <PremiumCard className="p-5">
          <h2 className="mb-4 font-bold">Payment progress</h2>
          <PaymentStatusStepper status={status} />
        </PremiumCard>

        {invoice.balanceDue > 0 && (
          <section>
            <h2 className="mb-4 font-bold">Pay now</h2>
            <PaymentCheckout
              key={tick}
              invoice={invoice}
              onComplete={() => {
                setTick((t) => t + 1);
                refresh();
              }}
            />
          </section>
        )}

        <section>
          <h2 className="mb-4 font-bold">Invoice details</h2>
          <InvoiceDetailView
            invoice={invoice}
            job={job}
            payments={payments}
            financing={financing}
            showActions
            showSendAction={false}
            pdfDownloadPath={`/api/customer/invoices/${invoiceId}/pdf`}
          />
        </section>
      </div>
    </div>
  );
}
