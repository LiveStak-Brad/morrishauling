"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { Customer } from "@/types/user";
import type { Job } from "@/types/job";
import type { Invoice, Payment } from "@/types/payment";
import type { EstimateRecord } from "@/types/billing";
import { ESTIMATE_STATUS_LABELS } from "@/types/billing";
import { labelJobStatus, labelInvoiceStatus } from "@/lib/ui/status-labels";
import { MANUAL_PAYMENT_METHODS } from "@/lib/payments/manual-methods";
import { ArrowLeft } from "lucide-react";

interface Workspace {
  customer: Customer;
  estimatesToApprove: EstimateRecord[];
  finalAgreedEstimates: EstimateRecord[];
  completedEstimates: EstimateRecord[];
  activeJobs: Job[];
  completedJobs: Job[];
  openInvoices: Invoice[];
  paidInvoices: Invoice[];
  payments: Payment[];
  activity: Array<{ id?: string; action?: string; message?: string; created_at?: string }>;
  metrics: {
    totalRevenue: number;
    outstandingBalance: number;
    waitingApproval: number;
    activeJobs: number;
    readyToInvoice: number;
    unpaidInvoices: number;
  };
}

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <PremiumCard className="space-y-2 p-5">
      <h3 className="font-bold">{title}</h3>
      {empty ? <p className="text-sm text-muted-foreground">None.</p> : children}
    </PremiumCard>
  );
}

export default function AdminCustomerWorkspacePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setName(json.customer.name ?? "");
        setEmail(json.customer.email ?? "");
        setPhone(json.customer.phone ?? "");
      } else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Customer updated");
        await load();
      } else toast.error(json.error ?? "Failed");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const payAll = async () => {
    if (!data?.openInvoices.length) return;
    if (!confirm(`Pay all outstanding ($${data.metrics.outstandingBalance.toFixed(2)})?`)) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay_all", method: payMethod }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Payment allocated across open invoices");
        await load();
      } else toast.error(json.error ?? "Payment failed");
    } catch {
      toast.error("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <AdminPageShell
      title={data?.customer.name ?? "Customer"}
      description="Customer → Estimate → Job → Invoice → Payment"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/customers/${id}/merge`}
            className="text-sm text-brand-primary underline"
          >
            Merge duplicate
          </Link>
          <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> All customers
          </Link>
        </div>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-muted-foreground">Customer not found.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Waiting approval</p>
              <p className="text-xl font-bold">{data.metrics.waitingApproval}</p>
            </PremiumCard>
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Active jobs</p>
              <p className="text-xl font-bold">{data.metrics.activeJobs}</p>
            </PremiumCard>
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Ready to invoice</p>
              <p className="text-xl font-bold">{data.metrics.readyToInvoice}</p>
            </PremiumCard>
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
              <p className="text-xl font-bold">{data.metrics.unpaidInvoices}</p>
            </PremiumCard>
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold">${data.metrics.outstandingBalance.toFixed(2)}</p>
            </PremiumCard>
            <PremiumCard className="p-4">
              <p className="text-xs text-muted-foreground">Lifetime paid</p>
              <p className="text-xl font-bold">${data.metrics.totalRevenue.toFixed(2)}</p>
            </PremiumCard>
          </div>

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-bold">Overview</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void saveProfile()}>Save profile</Button>
              <Link href={`/admin/estimates/new?customerId=${id}`} className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">
                Create estimate
              </Link>
            </div>
          </PremiumCard>

          <Section title="Estimates to Approve" empty={!data.estimatesToApprove.length}>
            {data.estimatesToApprove.map((e) => (
              <Link key={e.id} href={`/admin/estimates/${e.id}`} className="flex justify-between border-b py-2 text-sm hover:text-brand-primary">
                <span>{e.estimateNumber} · {ESTIMATE_STATUS_LABELS[e.status]}</span>
                <span>${e.estimatedTotal.toFixed(2)}</span>
              </Link>
            ))}
          </Section>

          <Section title="Agreed Estimates" empty={!data.finalAgreedEstimates.length}>
            {data.finalAgreedEstimates.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                <Link href={`/admin/estimates/${e.id}`} className="hover:text-brand-primary">
                  {e.estimateNumber} · {ESTIMATE_STATUS_LABELS[e.status]}
                </Link>
                <div className="flex gap-3">
                  <span>${e.estimatedTotal.toFixed(2)}</span>
                  {e.jobId && (
                    <Link href={`/admin/jobs/${e.jobId}`} className="text-brand-primary underline">
                      Job
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Completed Estimates" empty={!data.completedEstimates.length}>
            {data.completedEstimates.map((e) => (
              <Link key={e.id} href={`/admin/estimates/${e.id}`} className="flex justify-between border-b py-2 text-sm hover:text-brand-primary">
                <span>{e.estimateNumber} · {ESTIMATE_STATUS_LABELS[e.status]}</span>
                <span>${e.estimatedTotal.toFixed(2)}</span>
              </Link>
            ))}
          </Section>

          <Section title="Active Jobs" empty={!data.activeJobs.length}>
            {data.activeJobs.map((j) => (
              <Link key={j.id} href={`/admin/jobs/${j.id}`} className="flex justify-between border-b py-2 text-sm hover:text-brand-primary">
                <span>{j.address.street} · <StatusChip label={labelJobStatus(j.status)} variant="neutral" /></span>
                <span>{j.scheduledDate ?? "Needs Scheduling"}</span>
              </Link>
            ))}
          </Section>

          <Section title="Completed Jobs" empty={!data.completedJobs.length}>
            {data.completedJobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                <Link href={`/admin/jobs/${j.id}`} className="hover:text-brand-primary">
                  {j.address.street} · {labelJobStatus(j.status)}
                </Link>
                <Link
                  href={`/admin/invoices/new?jobId=${j.id}&customerId=${id}`}
                  className="text-brand-primary underline"
                >
                  Create invoice
                </Link>
              </div>
            ))}
          </Section>

          <Section title="Open Invoices" empty={!data.openInvoices.length}>
            {data.openInvoices.map((inv) => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="flex justify-between border-b py-2 text-sm hover:text-brand-primary">
                <span>{inv.invoiceNumber} · {labelInvoiceStatus(inv.status)}</span>
                <span>Due ${inv.balanceDue.toFixed(2)}</span>
              </Link>
            ))}
            {data.openInvoices.some((i) => i.balanceDue > 0) && (
              <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full sm:w-auto">
                  <Label className="text-xs">Pay All Outstanding</Label>
                  <Select value={payMethod} onValueChange={(v) => { if (v) setPayMethod(v); }}>
                    <SelectTrigger className="w-full min-h-10 sm:w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MANUAL_PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={paying} className="min-h-10 w-full sm:w-auto" onClick={() => void payAll()}>
                  Pay all ${data.metrics.outstandingBalance.toFixed(2)}
                </Button>
                <Link href={`/admin/payments/new?customerId=${id}`} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted sm:w-auto">
                  Pay one invoice
                </Link>
              </div>
            )}
          </Section>

          <Section title="Paid Invoices" empty={!data.paidInvoices.length}>
            {data.paidInvoices.map((inv) => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="flex justify-between border-b py-2 text-sm hover:text-brand-primary">
                <span>{inv.invoiceNumber}</span>
                <span>${inv.total.toFixed(2)}</span>
              </Link>
            ))}
          </Section>

          <Section title="Payments" empty={!data.payments.length}>
            {data.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                <span>
                  {p.method}
                  {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
                  {p.reversedAt ? " · reversed" : ""}
                </span>
                <div className="flex items-center gap-3">
                  <span>${p.amount.toFixed(2)}</span>
                  {p.invoiceId && (
                    <Link href={`/admin/invoices/${p.invoiceId}`} className="text-brand-primary underline">
                      Invoice
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </Section>

          <Section
            title="Photos"
            empty={
              ![...data.activeJobs, ...data.completedJobs].some((j) => (j.photos?.length ?? 0) > 0)
            }
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[...data.activeJobs, ...data.completedJobs].flatMap((j) =>
                (j.photos ?? []).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p.id} href={`/admin/jobs/${j.id}`} title={j.address.street}>
                    <img
                      src={p.url}
                      alt={p.caption ?? "Job photo"}
                      className="h-24 w-full rounded object-cover"
                    />
                  </a>
                ))
              )}
            </div>
          </Section>

          <Section
            title="Notes"
            empty={
              ![...data.estimatesToApprove, ...data.finalAgreedEstimates, ...data.completedEstimates].some(
                (e) => e.customerNotes || e.internalNotes
              )
            }
          >
            {[...data.estimatesToApprove, ...data.finalAgreedEstimates, ...data.completedEstimates]
              .filter((e) => e.customerNotes || e.internalNotes)
              .slice(0, 8)
              .map((e) => (
                <div key={e.id} className="border-b py-2 text-sm">
                  <Link href={`/admin/estimates/${e.id}`} className="font-medium text-brand-primary">
                    {e.estimateNumber}
                  </Link>
                  {e.customerNotes ? <p className="text-muted-foreground">{e.customerNotes}</p> : null}
                  {e.internalNotes ? (
                    <p className="text-xs text-muted-foreground">Internal: {e.internalNotes}</p>
                  ) : null}
                </div>
              ))}
          </Section>

          <Section title="Communications / Activity" empty={!data.activity.length}>
            {data.activity.slice(0, 30).map((a, i) => (
              <div key={String(a.id ?? i)} className="border-b py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{a.action ?? a.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </AdminPageShell>
  );
}
