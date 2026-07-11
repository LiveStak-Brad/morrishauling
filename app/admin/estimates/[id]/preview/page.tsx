"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EstimateCustomerView } from "@/components/billing/EstimateCustomerView";
import type { EstimateRecord } from "@/types/billing";
import { ArrowLeft } from "lucide-react";

/** Owner preview using the exact same customer-facing component as /e/[token]. */
export default function AdminEstimatePreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [estimate, setEstimate] = useState<EstimateRecord | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/estimates/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setEstimate(d.estimate);
          setCustomerName(d.customer?.name ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminPageShell
      title="Preview as Customer"
      description="Exact same layout and data rules as the customer link"
      action={
        <Link
          href={`/admin/estimates/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to estimate
        </Link>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading preview…</p>
      ) : !estimate ? (
        <p className="text-muted-foreground">Estimate not found.</p>
      ) : (
        <EstimateCustomerView
          estimateNumber={estimate.estimateNumber}
          status={estimate.status}
          estimatedTotal={estimate.estimatedTotal}
          lineItems={estimate.lineItems}
          customerNotes={estimate.customerNotes}
          customerName={customerName}
          expiresAt={estimate.expiresAt}
        />
      )}
    </AdminPageShell>
  );
}
