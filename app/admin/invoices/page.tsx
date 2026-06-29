"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  derivePaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { formatCurrency, formatDate } from "@/components/payments/payment-ui";
import type { Invoice, Job } from "@/types";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ArrowRight, FileText, Plus } from "lucide-react";

export default function AdminInvoicesPage() {
  const { companyId } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/jobs").then((r) => r.json()),
    ])
      .then(([inv, jobRes]) => {
        if (inv.ok) setInvoices(inv.invoices ?? []);
        if (jobRes.ok) setJobs(jobRes.jobs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const stats = {
    outstanding: invoices.reduce((s, i) => s + i.balanceDue, 0),
    paid: invoices.filter((i) => i.status === "paid").length,
    partial: invoices.filter((i) => i.status === "partial").length,
  };

  return (
    <AdminPageShell
      title="Invoices"
      description={`${invoices.length} invoices · ${formatCurrency(stats.outstanding)} outstanding`}
      action={
        <ButtonLink href="/admin/invoices/new" size="sm">
          <Plus className="h-4 w-4 mr-1" /> New invoice
        </ButtonLink>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-brand-primary">{formatCurrency(stats.outstanding)}</p>
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

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && invoices.length === 0 && (
        <AdminEmptyState
          icon={FileText}
          title="No invoices have been created."
          description="Create an invoice when a job is complete or when billing a customer directly."
          action={
            <ButtonLink href="/admin/invoices/new" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New invoice
            </ButtonLink>
          }
        />
      )}

      <div className="space-y-3">
        {invoices.map((inv) => {
          const job = jobMap.get(inv.jobId);
          const status = derivePaymentStatus(inv);
          return (
            <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
              <PremiumCard interactive className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <FileText className="h-6 w-6 text-brand-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{inv.invoiceNumber}</p>
                    <StatusChip label={getPaymentStatusLabel(status)} variant={getPaymentStatusVariant(status)} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job ? `${job.address.street} · ${job.junkType}` : "Admin billing job"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(inv.total)}</p>
                  <p className="text-sm text-brand-primary">Due {formatCurrency(inv.balanceDue)}</p>
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
