"use client";

import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { getInvoices, getJobByCompany, getFinancingByJob } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import {
  derivePaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { formatCurrency, formatDate } from "@/components/payments/payment-ui";
import { ArrowRight, FileText } from "lucide-react";

export default function AdminInvoicesPage() {
  const { companyId } = useCompany();
  const invoices = getInvoices(companyId);

  const stats = {
    outstanding: invoices.reduce((s, i) => s + i.balanceDue, 0),
    paid: invoices.filter((i) => i.status === "paid").length,
    partial: invoices.filter((i) => i.status === "partial").length,
  };

  return (
    <AdminPageShell
      title="Invoices"
      description={`${invoices.length} invoices · ${formatCurrency(stats.outstanding)} outstanding`}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-brand-primary">
            {formatCurrency(stats.outstanding)}
          </p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Paid in full</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Partial payments</p>
          <p className="text-2xl font-bold">{stats.partial}</p>
        </PremiumCard>
      </div>

      <div className="space-y-3">
        {invoices.map((inv) => {
          const job = getJobByCompany(companyId, inv.jobId);
          const financing = getFinancingByJob(companyId, inv.jobId);
          const status = derivePaymentStatus(inv, financing);
          return (
            <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
              <PremiumCard interactive className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <FileText className="h-6 w-6 text-brand-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{inv.invoiceNumber}</p>
                    <StatusChip
                      label={getPaymentStatusLabel(status)}
                      variant={getPaymentStatusVariant(status)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job?.address.street} · {job?.junkType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(inv.total)}</p>
                  <p className="text-sm text-brand-primary">
                    Due {formatCurrency(inv.balanceDue)}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </PremiumCard>
            </Link>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
