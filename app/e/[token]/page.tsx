"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EstimateCustomerView } from "@/components/billing/EstimateCustomerView";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTIMATE_STATUS_LABELS } from "@/types/billing";
import { toast } from "@/lib/toast";

interface PublicEstimatePayload {
  estimate: {
    id: string;
    estimateNumber: string;
    status: keyof typeof ESTIMATE_STATUS_LABELS;
    estimatedTotal: number;
    lineItems: Array<{ id: string; label: string; quantity: number; amount: number; internal?: boolean }>;
    customerNotes?: string | null;
    expiresAt?: string | null;
  };
  versions: Array<{ versionNumber: number; createdAt: string; newTotal: number; revisionReason?: string | null }>;
  customer: { name: string } | null;
}

export default function PublicEstimatePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PublicEstimatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/estimates/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const act = async (action: "accept" | "decline" | "clarification") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/estimates/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, note }),
      });
      const json = await res.json();
      if (json.ok) {
        setDone(action);
        toast.success(
          action === "accept"
            ? "Estimate accepted"
            : action === "decline"
              ? "Estimate declined"
              : "Clarification requested"
        );
        const refreshed = await fetch(`/api/public/estimates/${token}`);
        const next = await refreshed.json();
        if (next.ok) setData(next);
      } else {
        toast.error(json.error ?? "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-2xl p-6 text-muted-foreground">Loading estimate…</main>;
  }
  if (!data) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="font-semibold">Estimate unavailable</p>
        <p className="text-sm text-muted-foreground">This link may be invalid or expired.</p>
      </main>
    );
  }

  const { estimate, versions, customer } = data;
  const canDecide = ["sent", "viewed", "revised", "ready_to_send"].includes(estimate.status);

  return (
    <main className="p-6">
      <EstimateCustomerView
        estimateNumber={estimate.estimateNumber}
        status={estimate.status}
        estimatedTotal={estimate.estimatedTotal}
        lineItems={estimate.lineItems}
        customerNotes={estimate.customerNotes}
        customerName={customer?.name}
        expiresAt={estimate.expiresAt}
      >
        {versions.length > 1 && (
          <PremiumCard className="p-4">
            <p className="text-sm font-semibold">Revision history</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {versions.map((v) => (
                <li key={v.versionNumber}>
                  v{v.versionNumber}: ${v.newTotal.toFixed(2)}
                  {v.revisionReason ? ` — ${v.revisionReason}` : ""}
                </li>
              ))}
            </ul>
          </PremiumCard>
        )}

        {canDecide && !done && (
          <PremiumCard className="space-y-3 p-5">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              placeholder="Optional note or clarification request"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !name.trim()} onClick={() => void act("accept")}>
                Accept estimate
              </Button>
              <Button disabled={busy || !name.trim()} variant="outline" onClick={() => void act("decline")}>
                Decline
              </Button>
              <Button disabled={busy} variant="ghost" onClick={() => void act("clarification")}>
                Request clarification
              </Button>
            </div>
          </PremiumCard>
        )}

        {done && (
          <PremiumCard className="p-4 text-sm">
            Thank you. Your response ({done}) has been recorded.
          </PremiumCard>
        )}
      </EstimateCustomerView>
    </main>
  );
}
