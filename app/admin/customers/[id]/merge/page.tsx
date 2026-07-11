"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import type { CustomerMergeChoices, CustomerMergePreview } from "@/lib/db/customer-merge";
import { ArrowLeft } from "lucide-react";

type Side = "primary" | "secondary";

const DEFAULT_CHOICES: CustomerMergeChoices = {
  name: "primary",
  email: "primary",
  phone: "primary",
  billingAddress: "primary",
  notes: "combine",
  keepSecondaryServiceAddresses: true,
};

function FieldPick({
  label,
  field,
  choices,
  setChoices,
  primaryVal,
  secondaryVal,
  allowCombine,
}: {
  label: string;
  field: keyof Omit<CustomerMergeChoices, "keepSecondaryServiceAddresses">;
  choices: CustomerMergeChoices;
  setChoices: (c: CustomerMergeChoices) => void;
  primaryVal: string;
  secondaryVal: string;
  allowCombine?: boolean;
}) {
  const value = choices[field];
  return (
    <div className="space-y-2 rounded border p-3">
      <p className="font-medium">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer gap-2 rounded border p-2 text-sm has-[:checked]:border-brand-primary">
          <input
            type="radio"
            name={field}
            checked={value === "primary"}
            onChange={() => setChoices({ ...choices, [field]: "primary" })}
          />
          <span>
            <span className="text-xs text-muted-foreground">Keep primary</span>
            <br />
            {primaryVal || "—"}
          </span>
        </label>
        <label className="flex cursor-pointer gap-2 rounded border p-2 text-sm has-[:checked]:border-brand-primary">
          <input
            type="radio"
            name={field}
            checked={value === "secondary"}
            onChange={() => setChoices({ ...choices, [field]: "secondary" })}
          />
          <span>
            <span className="text-xs text-muted-foreground">Keep secondary</span>
            <br />
            {secondaryVal || "—"}
          </span>
        </label>
      </div>
      {allowCombine && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={field}
            checked={value === "combine"}
            onChange={() => setChoices({ ...choices, [field]: "combine" })}
          />
          Combine both notes
        </label>
      )}
    </div>
  );
}

export default function CustomerMergePage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const primaryId = params.id as string;
  const [secondaryId, setSecondaryId] = useState(search.get("secondaryId") ?? "");
  const [preview, setPreview] = useState<CustomerMergePreview | null>(null);
  const [choices, setChoices] = useState<CustomerMergeChoices>(DEFAULT_CHOICES);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!secondaryId.trim()) {
      toast.error("Enter the duplicate customer id to merge");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${primaryId}/merge?secondaryId=${encodeURIComponent(secondaryId.trim())}`
      );
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Preview failed");
        setPreview(null);
        return;
      }
      setPreview(json.preview);
      setConfirmed(false);
    } catch {
      toast.error("Preview failed");
    } finally {
      setLoading(false);
    }
  }, [primaryId, secondaryId]);

  useEffect(() => {
    if (search.get("secondaryId")) void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runMerge = async () => {
    if (!preview || !confirmed) {
      toast.error("Review both records and confirm before merging");
      return;
    }
    setMerging(true);
    try {
      const res = await fetch(`/api/admin/customers/${primaryId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secondaryId: secondaryId.trim(),
          choices,
          confirm: true,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Merge failed");
        return;
      }
      toast.success("Customers merged — history preserved under the surviving record");
      router.push(`/admin/customers/${primaryId}`);
    } catch {
      toast.error("Merge failed");
    } finally {
      setMerging(false);
    }
  };

  const addr = (side: Side) => {
    const c = side === "primary" ? preview?.primary : preview?.secondary;
    if (!c) return "";
    return [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ");
  };

  return (
    <AdminPageShell
      title="Merge customers"
      description="Choose surviving values, move all related records, archive the duplicate"
      action={
        <Link
          href={`/admin/customers/${primaryId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customer
        </Link>
      }
    >
      <div className="space-y-4">
        <PremiumCard className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">
            Surviving customer: <code className="text-foreground">{primaryId}</code>
          </p>
          <div>
            <Label>Duplicate customer id (will be archived)</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Input
                value={secondaryId}
                onChange={(e) => setSecondaryId(e.target.value)}
                placeholder="cust-…"
                className="max-w-md"
              />
              <Button disabled={loading} onClick={() => void loadPreview()}>
                Preview merge
              </Button>
            </div>
          </div>
        </PremiumCard>

        {preview && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <PremiumCard className="space-y-2 p-5">
                <h3 className="font-bold">Primary (survives)</h3>
                <p>{preview.primary.name}</p>
                <p className="text-sm">{preview.primary.email || "No email"}</p>
                <p className="text-sm">{preview.primary.phone || "No phone"}</p>
                <p className="text-sm">{addr("primary") || "No address"}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {preview.primary.notes || "No notes"}
                </p>
              </PremiumCard>
              <PremiumCard className="space-y-2 p-5">
                <h3 className="font-bold">Secondary (archived)</h3>
                <p>{preview.secondary.name}</p>
                <p className="text-sm">{preview.secondary.email || "No email"}</p>
                <p className="text-sm">{preview.secondary.phone || "No phone"}</p>
                <p className="text-sm">{addr("secondary") || "No address"}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {preview.secondary.notes || "No notes"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Moves: {preview.counts.estimates} estimates, {preview.counts.jobs} jobs,{" "}
                  {preview.counts.invoices} invoices, {preview.counts.payments} payments,{" "}
                  {preview.counts.photos} photos, {preview.counts.interactions} communications
                </p>
              </PremiumCard>
            </div>

            <PremiumCard className="space-y-3 p-5">
              <h3 className="font-bold">Surviving field values</h3>
              <FieldPick
                label="Name"
                field="name"
                choices={choices}
                setChoices={setChoices}
                primaryVal={preview.primary.name}
                secondaryVal={preview.secondary.name}
              />
              <FieldPick
                label="Email"
                field="email"
                choices={choices}
                setChoices={setChoices}
                primaryVal={preview.primary.email}
                secondaryVal={preview.secondary.email}
              />
              <FieldPick
                label="Phone"
                field="phone"
                choices={choices}
                setChoices={setChoices}
                primaryVal={preview.primary.phone ?? ""}
                secondaryVal={preview.secondary.phone ?? ""}
              />
              <FieldPick
                label="Billing address"
                field="billingAddress"
                choices={choices}
                setChoices={setChoices}
                primaryVal={addr("primary")}
                secondaryVal={addr("secondary")}
              />
              <FieldPick
                label="Notes"
                field="notes"
                choices={choices}
                setChoices={setChoices}
                primaryVal={preview.primary.notes ?? ""}
                secondaryVal={preview.secondary.notes ?? ""}
                allowCombine
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={choices.keepSecondaryServiceAddresses}
                  onChange={(e) =>
                    setChoices({
                      ...choices,
                      keepSecondaryServiceAddresses: e.target.checked,
                    })
                  }
                />
                Keep all service addresses from both records (jobs/estimates move with history)
              </label>
            </PremiumCard>

            <PremiumCard className="space-y-3 border-amber-300 p-5">
              <p className="text-sm">
                This permanently archives the duplicate. Financial records are moved, not copied.
                Audit history is preserved.
              </p>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I confirm this merge
              </label>
              <Button disabled={merging || !confirmed} onClick={() => void runMerge()}>
                Merge customers
              </Button>
            </PremiumCard>
          </>
        )}
      </div>
    </AdminPageShell>
  );
}
