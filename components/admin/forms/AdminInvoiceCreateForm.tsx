"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CustomerSelector } from "@/components/admin/CustomerSelector";
import { JobSelector } from "@/components/admin/JobSelector";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import type { InvoiceAdjustment } from "@/types/payment";

export function AdminInvoiceCreateForm() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [jobId, setJobId] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceAdjustment[]>([
    { id: "line-1", label: "Service", amount: 0 },
  ]);
  const [tax, setTax] = useState("");
  const [fees, setFees] = useState("");
  const [discount, setDiscount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [terms, setTerms] = useState("Net 30");
  const [depositAmount, setDepositAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (opts: { draft?: boolean; send?: boolean; markPaid?: boolean }) => {
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobId: jobId || undefined,
          lineItems: lineItems.filter((l) => l.label.trim()),
          tax: tax ? Number(tax) : undefined,
          fees: fees ? Number(fees) : undefined,
          discount: discount ? Number(discount) : undefined,
          dueDate: dueDate || undefined,
          terms,
          depositAmount: depositAmount ? Number(depositAmount) : undefined,
          status: opts.draft ? "draft" : "sent",
          sendPlaceholder: opts.send,
          markPaid: opts.markPaid,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success(`Invoice ${d.invoice.invoiceNumber} saved`);
      router.push(`/admin/invoices/${d.invoice.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4 max-w-2xl">
      <div><Label>Customer</Label><CustomerSelector value={customerId} onChange={(id) => setCustomerId(id)} /></div>
      <div><Label>Job (optional)</Label><JobSelector value={jobId} onChange={(id) => setJobId(id)} customerId={customerId || undefined} /></div>

      <div className="space-y-2">
        <Label>Line items</Label>
        {lineItems.map((line, i) => (
          <div key={line.id} className="grid grid-cols-5 gap-2">
            <Input className="col-span-3" placeholder="Description" value={line.label} onChange={(e) => {
              const next = [...lineItems];
              next[i] = { ...line, label: e.target.value };
              setLineItems(next);
            }} />
            <Input type="number" placeholder="Amount" value={line.amount || ""} onChange={(e) => {
              const next = [...lineItems];
              next[i] = { ...line, amount: Number(e.target.value) };
              setLineItems(next);
            }} />
            <Button type="button" variant="ghost" size="sm" onClick={() => setLineItems(lineItems.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { id: `line-${Date.now()}`, label: "", amount: 0 }])}>Add line</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label>Tax ($)</Label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
        <div><Label>Fees ($)</Label><Input type="number" value={fees} onChange={(e) => setFees(e.target.value)} /></div>
        <div><Label>Discount ($)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        <div><Label>Payment terms</Label><Input value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
        <div><Label>Deposit amount ($)</Label><Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} /></div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void submit({ draft: true })} disabled={saving}>Save draft</Button>
        <Button
          variant="outline"
          disabled
          title="Email sending is not connected yet. Save draft or download PDF from invoice detail."
        >
          Email send (not connected)
        </Button>
        <Button variant="secondary" onClick={() => void submit({ markPaid: true })} disabled={saving}>Mark paid</Button>
      </div>
    </PremiumCard>
  );
}
