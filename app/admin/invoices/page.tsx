"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { ButtonLink } from "@/components/ui/button-link";
import {
  derivePaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { formatCurrency, formatDate } from "@/components/payments/payment-ui";
import { invoiceQueueGroup, type InvoiceQueueGroup } from "@/lib/billing/workflow";
import type { Invoice, Job } from "@/types";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ArrowRight, FileText, Plus } from "lucide-react";

const TABS: Array<{ key: InvoiceQueueGroup | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "ready_to_send", label: "Ready to Send" },
  { key: "sent_unpaid", label: "Sent / Unpaid" },
  { key: "partially_paid", label: "Partially Paid" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "void", label: "Void" },
];

export default function AdminInvoicesPage() {
  const { companyId } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queues, setQueues] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<InvoiceQueueGroup | "all">("all");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/workflow-queues").then((r) => r.json()),
    ])
      .then(([inv, jobRes, q]) => {
        if (inv.ok) setInvoices(inv.invoices ?? []);
        if (jobRes.ok) setJobs(jobRes.jobs ?? []);
        if (q.ok && q.invoices) {
          setQueues({
            draft: q.invoices.draft ?? 0,
            ready_to_send: q.invoices.readyToSend ?? 0,
            sent_unpaid: q.invoices.sentUnpaid ?? 0,
            partially_paid: q.invoices.partiallyPaid ?? 0,
            paid: q.invoices.paid ?? 0,
            overdue: q.invoices.overdue ?? 0,
            void: q.invoices.void ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const filtered = useMemo(() => {
    if (tab === "all") return invoices;
    return invoices.filter((i) => invoiceQueueGroup(i) === tab);
  }, [invoices, tab]);

  const outstanding = invoices.reduce((s, i) => s + (i.balanceDue > 0 ? i.balanceDue : 0), 0);

  return (
    <AdminPageShell
      title="Invoices"
      description="Create only after a job is completed with proof — pay one or pay all outstanding"
      action={
        <ButtonLink href="/admin/jobs?tab=ready_to_invoice" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Invoice from completed job
        </ButtonLink>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-brand-primary">{formatCurrency(outstanding)}</p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-sm text-muted-foreground">Paid in full</p>
          <p className="text-2xl font-bold text-emerald-600">{queues.paid ?? 0}</p>
        </PremiumCard>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => {
          const count = key === "all" ? invoices.length : queues[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                tab === key ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "hover:bg-muted"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && filtered.length === 0 && (
        <AdminEmptyState
          icon={FileText}
          title="No invoices in this queue."
          description="Invoices are created from completed jobs on the customer workspace."
          action={
            <ButtonLink href="/admin/customers" size="sm">
              Open customers
            </ButtonLink>
          }
        />
      )}

      <div className="space-y-3">
        {filtered.map((inv) => {
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
                    <span className="font-bold">{inv.invoiceNumber}</span>
                    <StatusChip
                      label={getPaymentStatusLabel(status)}
                      variant={getPaymentStatusVariant(status)}
                    />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {job?.address?.street ?? "Job"}
                    {inv.customerId ? (
                      <>
                        {" · "}
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/admin/customers/${inv.customerId}`;
                          }}
                          className="text-brand-primary underline"
                        >
                          Customer
                        </span>
                      </>
                    ) : null}
                    {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(inv.balanceDue > 0 ? inv.balanceDue : inv.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.balanceDue > 0 ? "balance due" : "total"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </PremiumCard>
            </Link>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
