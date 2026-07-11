"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CustomerSelector } from "@/components/admin/CustomerSelector";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface DraftLine {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
}

function NewEstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState("");
  const [divisionId, setDivisionId] = useState("junk_removal");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Warrenton");
  const [state, setState] = useState("MO");
  const [zip, setZip] = useState("63383");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([
    { id: "1", label: "Removal Service", quantity: 1, unitPrice: 79 },
  ]);

  useEffect(() => {
    const fromQuery = searchParams.get("customerId");
    if (fromQuery) setCustomerId(fromQuery);
  }, [searchParams]);

  const save = async () => {
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    if (!lines.length) {
      toast.error("Add at least one line item");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          divisionId,
          estimateType: divisionId,
          serviceAddress: { street, city, state, zip },
          customerNotes,
          internalNotes,
          status: "draft",
          lineItems: lines.map((l) => ({
            label: l.label,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: Math.round(l.quantity * l.unitPrice * 100) / 100,
            category: "service",
          })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Estimate draft created");
        router.push(`/admin/estimates/${data.estimate.id}`);
      } else {
        toast.error(data.error ?? "Failed to create estimate");
      }
    } catch {
      toast.error("Failed to create estimate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
        <PremiumCard className="space-y-4 p-5">
          <div>
            <Label>Customer (required)</Label>
            <CustomerSelector value={customerId} onChange={setCustomerId} />
          </div>
          <div>
            <Label>Division</Label>
            <Select value={divisionId} onValueChange={(v) => { if (v != null) setDivisionId(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="junk_removal">Junk Removal</SelectItem>
                <SelectItem value="hauling">Hauling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Street</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Line items</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { id: String(Date.now()), label: "Custom item", quantity: 1, unitPrice: 0 },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          {lines.map((line, idx) => (
            <div key={line.id} className="grid gap-2 md:grid-cols-[1fr_80px_100px_40px]">
              <Input
                value={line.label}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...line, label: e.target.value };
                  setLines(next);
                }}
              />
              <Input
                type="number"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...line, quantity: Number(e.target.value) || 0 };
                  setLines(next);
                }}
              />
              <Input
                type="number"
                value={line.unitPrice}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...line, unitPrice: Number(e.target.value) || 0 };
                  setLines(next);
                }}
              />
              <Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((l) => l.id !== line.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Customer notes</Label>
              <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </div>
          </div>
          <Button disabled={saving} onClick={() => void save()}>
            Save draft
          </Button>
        </PremiumCard>
      </div>
  );
}

export default function AdminNewEstimatePage() {
  return (
    <AdminPageShell
      title="New estimate"
      description="Always tied to a customer — edit in place until final approval"
      action={
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
      }
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <NewEstimateForm />
      </Suspense>
    </AdminPageShell>
  );
}
