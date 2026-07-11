"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerSelector } from "@/components/admin/CustomerSelector";
import { JobSelector } from "@/components/admin/JobSelector";
import { InvoiceSelector } from "@/components/admin/InvoiceSelector";
import { EmployeeSelector } from "@/components/hr/EmployeeSelector";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import type { Payment } from "@/types";

export function AdminPaymentCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState("");
  const [jobId, setJobId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [notes, setNotes] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = searchParams.get("customerId");
    const i = searchParams.get("invoiceId");
    const j = searchParams.get("jobId");
    if (c) setCustomerId(c);
    if (i) setInvoiceId(i);
    if (j) setJobId(j);
  }, [searchParams]);

  const submit = async () => {
    if (!customerId || !amount) {
      toast.error("Customer and amount required");
      return;
    }
    if (!invoiceId && !jobId) {
      toast.error("Select an invoice (preferred) or a job");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobId: jobId || undefined,
          invoiceId: invoiceId || undefined,
          amount: Number(amount),
          method,
          notes: notes || undefined,
          collectedByEmployeeId: collectedBy || undefined,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("Payment recorded");
      router.push(customerId ? `/admin/customers/${customerId}` : "/admin/payments");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4 max-w-2xl">
      <div><Label>Customer</Label><CustomerSelector value={customerId} onChange={(id) => setCustomerId(id)} /></div>
      <div><Label>Invoice</Label><InvoiceSelector value={invoiceId} onChange={(id) => setInvoiceId(id)} customerId={customerId || undefined} jobId={jobId || undefined} /></div>
      <div><Label>Job (if no invoice)</Label><JobSelector value={jobId} onChange={(id) => setJobId(id)} customerId={customerId || undefined} /></div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Amount ($)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div>
          <Label>Method</Label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value as Payment["method"])}>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="manual_card">Card (in person / phone)</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
            <option value="financing">Financing</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            For multiple open invoices, use Pay All Outstanding on the customer workspace.
          </p>
        </div>
      </div>

      <div><Label>Collected by</Label><EmployeeSelector value={collectedBy} onChange={(id) => setCollectedBy(id)} /></div>
      <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

      <Button onClick={() => void submit()} disabled={saving}>Save payment</Button>
    </PremiumCard>
  );
}
