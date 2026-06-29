"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Invoice, Payment, InvoiceAdjustment } from "@/types/payment";
import type { Job } from "@/types/job";
import type { Customer } from "@/types/user";
import type { FinancingRequest } from "@/types/financing";
import { InvoiceDetailView } from "@/components/invoices/InvoiceDetailView";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { derivePaymentStatus } from "@/lib/payment-utils";
import { PremiumCard } from "@/components/morris/PremiumCard";
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
import { formatDate } from "@/components/payments/payment-ui";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

interface ActivityRow {
  id?: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  message?: string;
  created_at?: string;
}

interface InvoiceDetailPayload {
  invoice: Invoice;
  job?: Job;
  customer?: Customer;
  payments: Payment[];
  financing?: FinancingRequest;
  activity: ActivityRow[];
}

export function AdminInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const [detail, setDetail] = useState<InvoiceDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceAdjustment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"]>("cash");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`);
      const data = await res.json();
      if (data.ok) {
        setDetail(data);
        setLineItems(data.invoice.adjustments ?? []);
        setPaymentAmount(String(data.invoice.balanceDue ?? 0));
      } else {
        setDetail(null);
      }
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recalcTotals = (items: InvoiceAdjustment[], fees: number) => {
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const estimateAmount = detail?.invoice.estimateAmount ?? subtotal;
    const total = estimateAmount + subtotal + fees;
    const amountPaid = detail?.invoice.amountPaid ?? 0;
    return { subtotal, total, balanceDue: Math.max(0, total - amountPaid) };
  };

  const saveLineItems = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const fees = detail.invoice.fees;
      const { subtotal, total, balanceDue } = recalcTotals(lineItems, fees);
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            adjustments: lineItems,
            subtotal,
            total,
            balanceDue,
            status: balanceDue <= 0 ? "paid" : detail.invoice.status === "void" ? "void" : "partial",
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Invoice updated");
        await load();
      } else {
        toast.error(data.error ?? "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const recordPayment = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: paymentMethod }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Payment recorded");
        await load();
      } else {
        toast.error(data.error ?? "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Invoice marked paid");
        await load();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const voidInvoice = async () => {
    if (!confirm("Void this invoice? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void", reason: "Voided by admin" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Invoice voided");
        await load();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading invoice…</p>;
  }

  if (!detail?.invoice) {
    return (
      <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
        Invoice not found.{" "}
        <Link href="/admin/invoices" className="text-brand-primary underline">
          Back to invoices
        </Link>
      </p>
    );
  }

  const { invoice, job, customer, payments, financing, activity } = detail;
  const status = derivePaymentStatus(invoice, financing);
  const isVoid = invoice.status === "void";

  return (
    <div className="max-w-3xl space-y-6">
      <PaymentSummaryCard
        balanceDue={invoice.balanceDue}
        total={invoice.total}
        amountPaid={invoice.amountPaid}
        status={status}
        invoiceNumber={invoice.invoiceNumber}
      />

      <div className="flex flex-wrap gap-2">
        {job && (
          <Link
            href="/admin/jobs"
            className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View job
          </Link>
        )}
        {customer && (
          <Link
            href="/admin/customers"
            className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View customer
          </Link>
        )}
        {!isVoid && invoice.balanceDue > 0 && (
          <Button variant="outline" size="sm" onClick={() => void markPaid()} disabled={saving}>
            Mark paid
          </Button>
        )}
        {!isVoid && (
          <Button variant="destructive" size="sm" onClick={() => void voidInvoice()} disabled={saving}>
            Void invoice
          </Button>
        )}
      </div>

      {!isVoid && (
        <PremiumCard className="p-5 space-y-4">
          <h3 className="font-semibold">Edit line items</h3>
          {lineItems.map((item, i) => (
            <div key={item.id} className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <Label className="text-xs">Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const next = [...lineItems];
                    next[i] = { ...item, label: e.target.value };
                    setLineItems(next);
                  }}
                />
              </div>
              <div className="w-28">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  value={item.amount}
                  onChange={(e) => {
                    const next = [...lineItems];
                    next[i] = { ...item, amount: Number(e.target.value) };
                    setLineItems(next);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLineItems(lineItems.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLineItems([
                ...lineItems,
                { id: `adj-${Date.now()}`, label: "Adjustment", amount: 0 },
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add line item
          </Button>
          <Button onClick={() => void saveLineItems()} disabled={saving}>
            {saving ? "Saving…" : "Save line items"}
          </Button>
        </PremiumCard>
      )}

      {!isVoid && invoice.balanceDue > 0 && (
        <PremiumCard className="p-5 space-y-3">
          <h3 className="font-semibold">Record payment</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as Payment["method"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => void recordPayment()} disabled={saving}>
            Record payment
          </Button>
        </PremiumCard>
      )}

      <InvoiceDetailView
        invoice={invoice}
        job={job}
        customer={customer}
        payments={payments}
        financing={financing}
        pdfDownloadPath={`/api/admin/invoices/${invoiceId}/pdf`}
      />

      <PremiumCard className="p-5">
        <h3 className="font-semibold mb-4">Activity timeline</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {activity.map((row, i) => (
              <li key={row.id ?? i} className="border-l-2 border-muted pl-3">
                <p className="font-medium">{row.message ?? row.action}</p>
                <p className="text-xs text-muted-foreground">
                  {row.created_at ? formatDate(row.created_at) : ""}
                  {row.entity_type ? ` · ${row.entity_type}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>
    </div>
  );
}
