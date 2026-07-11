"use client";

import { useState } from "react";
import { VerifiedAddressField } from "@/components/geo/VerifiedAddressField";
import type { VerifiedAddress } from "@/types/address";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

type Props = {
  jobId: string;
  currentLabel: string;
  onUpdated?: () => void;
};

/** Manager/planner address override with required reason + audit trail. */
export function AddressOverridePanel({ jobId, currentLabel, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState<VerifiedAddress | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!address?.placeId) {
      toast.error("Select a verified address from suggestions.");
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Enter a reason for the override (at least 5 characters).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/address-override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          placeId: address.placeId,
          line2: address.line2,
          address: {
            lat: address.lat,
            lng: address.lng,
            line1: address.line1,
            city: address.city,
            state: address.state,
            zip: address.zip,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Override failed");
      toast.success("Address updated and logged.");
      setOpen(false);
      setReason("");
      setAddress(null);
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Override failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Override address
      </Button>
    );
  }

  return (
    <PremiumCard className="space-y-3 border-amber-200 bg-amber-50/50 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Address override</p>
      <p className="text-sm text-muted-foreground">Current: {currentLabel}</p>
      <VerifiedAddressField
        id={`override-${jobId}`}
        label="Corrected address"
        value={address}
        onChange={setAddress}
      />
      <div>
        <Label htmlFor={`override-reason-${jobId}`}>Reason (required)</Label>
        <Textarea
          id={`override-reason-${jobId}`}
          className="mt-1.5"
          rows={2}
          placeholder="Why is this address being changed?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={submit}>
          {busy ? "Saving…" : "Save override"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </PremiumCard>
  );
}
