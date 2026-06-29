"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import {
  getInvoice,
  getJobByCompany,
  getCustomer,
  getPaymentsForInvoice,
  getFinancingByJob,
} from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { InvoiceDetailView } from "@/components/invoices/InvoiceDetailView";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { derivePaymentStatus } from "@/lib/payment-utils";
import { ArrowLeft } from "lucide-react";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { companyId } = useCompany();

  const invoice = getInvoice(companyId, invoiceId);
  if (!invoice) {
    return (
      <AdminPageShell title="Invoice not found">
        <Link href="/admin/invoices" className="text-brand-primary underline">
          Back to invoices
        </Link>
      </AdminPageShell>
    );
  }

  const job = getJobByCompany(companyId, invoice.jobId);
  const customer = getCustomer(companyId, invoice.customerId);
  const payments = getPaymentsForInvoice(companyId, invoice.id);
  const financing = getFinancingByJob(companyId, invoice.jobId);
  const status = derivePaymentStatus(invoice, financing);

  return (
    <AdminPageShell
      title={invoice.invoiceNumber}
      description={`${job?.address.street ?? "Job"} · Admin view`}
      action={
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All invoices
        </Link>
      }
    >
      <div className="max-w-3xl space-y-6">
        <PaymentSummaryCard
          balanceDue={invoice.balanceDue}
          total={invoice.total}
          amountPaid={invoice.amountPaid}
          status={status}
          invoiceNumber={invoice.invoiceNumber}
        />
        <InvoiceDetailView
          invoice={invoice}
          job={job}
          customer={customer}
          payments={payments}
          financing={financing}
        />
      </div>
    </AdminPageShell>
  );
}
