"use client";

import { useState } from "react";
import type { Invoice, Payment } from "@/types/payment";
import type { Job } from "@/types/job";
import type { Customer } from "@/types/user";
import type { FinancingRequest } from "@/types/financing";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import {
  derivePaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { PaymentActivityTimeline } from "@/components/payments/PaymentActivityTimeline";
import { buildPaymentActivity } from "@/lib/payment-utils";
import { formatCurrency, formatDate } from "@/components/payments/payment-ui";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  Camera,
  Download,
  MapPin,
  Send,
  User,
} from "lucide-react";

interface InvoiceDetailViewProps {
  invoice: Invoice;
  job?: Job;
  customer?: Customer;
  payments: Payment[];
  financing?: FinancingRequest | null;
  showActions?: boolean;
  showSendAction?: boolean;
  pdfDownloadPath?: string;
}

export function InvoiceDetailView({
  invoice,
  job,
  customer,
  payments,
  financing,
  showActions = true,
  showSendAction = true,
  pdfDownloadPath,
}: InvoiceDetailViewProps) {
  const status = derivePaymentStatus(invoice, financing);
  const activity = buildPaymentActivity(invoice, payments, financing);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    const path = pdfDownloadPath ?? `/api/admin/invoices/${invoice.id}/pdf`;
    setPdfLoading(true);
    try {
      const res = await fetch(path);
      const data = await res.json();
      if (data.ok && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(data.error ?? "Failed to generate PDF");
      }
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const sendInvoice = async () => {
    await downloadPdf();
    toast.info("Email provider not connected yet — PDF generated for download.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Invoice</p>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <StatusChip
            className="mt-2"
            label={getPaymentStatusLabel(status)}
            variant={getPaymentStatusVariant(status)}
            pulse={status === "financing_requested"}
          />
        </div>
        {showActions && (
          <div className="flex flex-wrap gap-2">
            {showSendAction && (
              <Button variant="outline" size="sm" onClick={() => void sendInvoice()} disabled={pdfLoading}>
                <Send className="mr-2 h-4 w-4" />
                Send invoice
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void downloadPdf()} disabled={pdfLoading}>
              <Download className="mr-2 h-4 w-4" />
              {pdfLoading ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PremiumCard className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4" />
            Customer
          </h3>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-medium">{customer?.name ?? "—"}</p>
            <p className="text-muted-foreground">{customer?.email}</p>
            <p className="text-muted-foreground">{customer?.phone}</p>
          </div>
        </PremiumCard>

        <PremiumCard className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            Service address
          </h3>
          <div className="mt-3 text-sm">
            <p className="font-medium">{job?.address.street}</p>
            <p className="text-muted-foreground">
              {job?.address.city}, {job?.address.state} {job?.address.zip}
            </p>
            {job && (
              <p className="mt-2 text-muted-foreground">
                {job.junkType} · {job.loadSizeTier} load
              </p>
            )}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="p-5">
        <h3 className="font-semibold">Line items</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimate amount</span>
            <span>{formatCurrency(invoice.estimateAmount)}</span>
          </div>
          {invoice.adjustments.map((adj) => (
            <div key={adj.id} className="flex justify-between">
              <span className="text-muted-foreground">{adj.label}</span>
              <span>+{formatCurrency(adj.amount)}</span>
            </div>
          ))}
          {invoice.fees > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fees</span>
              <span>{formatCurrency(invoice.fees)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Deposit paid</span>
            <span>-{formatCurrency(invoice.depositPaid)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-brand-primary">
            <span>Balance due</span>
            <span>{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>
      </PremiumCard>

      {invoice.finalPriceNotes && (
        <PremiumCard className="border-orange-200 bg-orange-50/40 p-4 text-sm">
          <p className="font-semibold">Final price notes</p>
          <p className="mt-1 text-muted-foreground">{invoice.finalPriceNotes}</p>
        </PremiumCard>
      )}

      <PremiumCard className="p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <Camera className="h-4 w-4" />
          Job photos
        </h3>
        {job?.photos && job.photos.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {job.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-xl border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption ?? "Job photo"} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No photos attached to this job.</p>
        )}
      </PremiumCard>

      {invoice.terms && (
        <PremiumCard className="p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Terms</p>
          <p className="mt-2">{invoice.terms}</p>
          {invoice.dueDate && (
            <p className="mt-2">Due date: {formatDate(invoice.dueDate)}</p>
          )}
        </PremiumCard>
      )}

      <section>
        <h3 className="mb-4 font-semibold">Payment history</h3>
        <PaymentActivityTimeline events={activity} />
      </section>
    </div>
  );
}
