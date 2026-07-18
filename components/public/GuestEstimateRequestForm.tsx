"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { DivisionId } from "@/lib/divisions";
import { BookingSocialUpsell } from "@/components/social/BookingSocialUpsell";
import { trackMarketingEvent } from "@/lib/seo/analytics";

/**
 * Guest estimate request — no account required.
 * Creates customer + draft estimate + secure link.
 */
export function GuestEstimateRequestForm({
  divisionId,
  onComplete,
}: {
  divisionId: DivisionId;
  onComplete?: (result: { customerUrl: string; deliveryMessage?: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    customerUrl: string;
    deliveryStatus?: string;
    deliveryMessage?: string;
  } | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "MO",
    zip: "",
    description: "",
    preferredDate: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/public/guest-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisionId, ...form }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Request failed");
      }
      const payload = {
        customerUrl: json.customerUrl as string,
        deliveryStatus: json.deliveryStatus as string | undefined,
        deliveryMessage: json.deliveryMessage as string | undefined,
        message: json.message as string | undefined,
      };
      setResult(payload);
      toast.success(payload.message || "Request submitted");
      trackMarketingEvent("estimate_complete", { division: divisionId, label: "guest_request" });
      onComplete?.(payload);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Thank you!</h3>
        <p className="text-sm text-muted-foreground">
          Your estimate request has been received.
        </p>
        <p className="text-sm text-muted-foreground">
          {result.deliveryStatus === "provider_accepted" || result.deliveryStatus === "resent"
            ? "We emailed you a confirmation. You can also save this secure link:"
            : result.deliveryMessage === "Email provider not configured"
              ? "Email provider not configured — copy your secure customer link below."
              : "Save your secure customer link:"}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={result.customerUrl} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(result.customerUrl);
              toast.success("Link copied");
            }}
          >
            Copy customer link
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Create an account later with the same email to claim your job history.
        </p>
        <BookingSocialUpsell />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-semibold">Request an estimate</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No account required. We will create a secure link for your estimate.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          required
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        />
        <Input
          required
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        />
      </div>
      <Input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <Input
        required
        type="tel"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <Input
        placeholder="Street address"
        value={form.addressLine1}
        onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
        <Input
          placeholder="State"
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
        />
        <Input
          placeholder="ZIP"
          value={form.zip}
          onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
        />
      </div>
      <Input
        type="date"
        value={form.preferredDate}
        onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
      />
      <Textarea
        required
        placeholder={
          divisionId === "hauling"
            ? "What are you moving? Pickup and delivery notes…"
            : "What needs to be removed?"
        }
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={4}
      />
      <Button type="submit" disabled={busy} className="min-h-11 w-full sm:w-auto">
        {busy ? "Submitting…" : "Submit estimate request"}
      </Button>
    </form>
  );
}
