"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EstimateRecord, EstimateVersionRecord, EstimateAdjustmentRecord, BillingLineItem, BillingAuditEvent } from "@/types/billing";
import { ESTIMATE_STATUS_LABELS, DELIVERY_STATUS_LABELS } from "@/types/billing";
import type { Customer } from "@/types/user";
import type { Job } from "@/types/job";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
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
import { customerFacingLines } from "@/lib/billing/line-items";
import {
  getStandardChargePresets,
  presetToLineItem,
  type StandardChargePreset,
} from "@/lib/billing/standard-charges";
import {
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Send,
  Eye,
  Check,
  X,
  FilePlus,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Minus,
} from "lucide-react";

interface DetailPayload {
  estimate: EstimateRecord;
  versions: EstimateVersionRecord[];
  adjustments: EstimateAdjustmentRecord[];
  activity: BillingAuditEvent[];
  customer?: Customer | null;
  job?: Job;
  invoice?: { id: string; invoiceNumber: string } | null;
  standardCharges?: StandardChargePreset[];
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function AdminEstimateDetail({ estimateId }: { estimateId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<BillingLineItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [approvalMethod, setApprovalMethod] = useState("phone");
  const [approvalBy, setApprovalBy] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [customerUrl, setCustomerUrl] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [adjReason, setAdjReason] = useState("");
  const [adjLabel, setAdjLabel] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [miscLabel, setMiscLabel] = useState("");
  const [miscAmount, setMiscAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountLabel, setDiscountLabel] = useState("On-site discount");
  const [presets, setPresets] = useState<StandardChargePreset[]>(() => getStandardChargePresets());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}`);
      const data = await res.json();
      if (data.ok) {
        setDetail(data);
        setLines(data.estimate.lineItems ?? []);
        setCustomerNotes(data.estimate.customerNotes ?? "");
        setInternalNotes(data.estimate.internalNotes ?? "");
        if (data.standardCharges?.length) setPresets(data.standardCharges);
        const versions = data.versions as EstimateVersionRecord[];
        if (versions.length >= 2) {
          setCompareA(versions[versions.length - 2].versionNumber);
          setCompareB(versions[versions.length - 1].versionNumber);
        }
      } else {
        setDetail(null);
      }
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtotal = useMemo(
    () => customerFacingLines(lines).reduce((s, l) => s + l.amount, 0),
    [lines]
  );

  const addPreset = (preset: StandardChargePreset) => {
    setLines((prev) => [...prev, presetToLineItem(preset, { sortOrder: prev.length })]);
    toast.success(`Added ${preset.label}`);
  };

  const addMisc = () => {
    const amount = Number(miscAmount);
    if (!miscLabel.trim()) {
      toast.error("Enter a misc. description");
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Enter a non-zero amount");
      return;
    }
    const preset = presets.find((p) => p.id === "misc") ?? getStandardChargePresets().find((p) => p.id === "misc")!;
    setLines((prev) => [
      ...prev,
      presetToLineItem(preset, {
        label: miscLabel.trim(),
        unitPrice: amount,
        amount,
        sortOrder: prev.length,
      }),
    ]);
    setMiscLabel("");
    setMiscAmount("");
    toast.success("Miscellaneous charge added");
  };

  const addDiscount = () => {
    const raw = Number(discountAmount);
    if (!Number.isFinite(raw) || raw === 0) {
      toast.error("Enter a discount amount");
      return;
    }
    const amount = raw > 0 ? -Math.abs(raw) : raw;
    setLines((prev) => [
      ...prev,
      {
        id: `disc-${Date.now()}`,
        label: discountLabel.trim() || "Discount",
        quantity: 1,
        unitPrice: amount,
        amount,
        category: "discount",
        sortOrder: prev.length,
      },
    ]);
    setDiscountAmount("");
    toast.success("Discount applied");
  };

  const moveLine = (index: number, dir: -1 | 1) => {
    setLines((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((l, i) => ({ ...l, sortOrder: i }));
    });
  };

  const postAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "Action failed");
        return null;
      }
      if (data.customerUrl) setCustomerUrl(data.customerUrl);
      if (data.deliveryMessage) toast.info(data.deliveryMessage);
      else toast.success("Saved");
      if (data.estimate?.id && data.estimate.id !== estimateId) {
        router.push(`/admin/estimates/${data.estimate.id}`);
        return data;
      }
      if (data.invoice?.id) {
        router.push(`/admin/invoices/${data.invoice.id}`);
        return data;
      }
      await load();
      return data;
    } catch {
      toast.error("Action failed");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveEdits = async (forceRevision = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: lines,
          customerNotes,
          internalNotes,
          revisionReason: revisionReason || undefined,
          forceRevision,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(forceRevision ? "Revision saved" : "Estimate saved");
        await load();
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading estimate…</p>;
  if (!detail) {
    return <p className="text-muted-foreground">Estimate not found.</p>;
  }

  const { estimate, versions, adjustments, activity, customer, job, invoice } = detail;
  const versionA = versions.find((v) => v.versionNumber === compareA);
  const versionB = versions.find((v) => v.versionNumber === compareB);
  const locked = ["converted", "canceled"].includes(estimate.status);
  const addr = estimate.serviceAddress as { street?: string; city?: string; state?: string; zip?: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{estimate.estimateNumber}</h2>
            <StatusChip
              label={ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status}
              variant={
                estimate.status === "accepted" || estimate.status === "converted"
                  ? "success"
                  : estimate.status === "declined" || estimate.status === "canceled"
                    ? "urgent"
                    : "info"
              }
            />
            <StatusChip
              label={
                estimate.deliveryStatus === "skipped"
                  ? "Delivery unavailable"
                  : DELIVERY_STATUS_LABELS[estimate.deliveryStatus]
              }
              variant={
                estimate.deliveryStatus === "failed" || estimate.deliveryStatus === "skipped"
                  ? "warning"
                  : "neutral"
              }
            />
            {estimate.internalApprovedAt && <StatusChip label="Internal approved" variant="success" />}
            {(estimate.customerApprovedAt || estimate.acceptedAt) && (
              <StatusChip label="Customer accepted" variant="success" />
            )}
            {locked && <StatusChip label="Agreed / locked" variant="success" />}
            {customer?.id && (
              <Link href={`/admin/customers/${customer.id}`} className="text-sm text-brand-primary underline">
                Customer workspace
              </Link>
            )}
            {job?.id && (
              <Link href={`/admin/jobs/${job.id}`} className="text-sm text-brand-primary underline">
                Related job
              </Link>
            )}
            {invoice?.id && (
              <Link href={`/admin/invoices/${invoice.id}`} className="text-sm text-brand-primary underline">
                Invoice {invoice.invoiceNumber}
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {(estimate.divisionId === "hauling" ? "Hauling" : "Junk Removal")}
            {" · $"}
            {estimate.estimatedTotal.toFixed(2)}
            {addr?.street ? ` · ${addr.street}, ${addr.city ?? ""} ${addr.state ?? ""} ${addr.zip ?? ""}` : ""}
            {estimate.sentAt ? ` · Sent ${new Date(estimate.sentAt).toLocaleString()}` : ""}
          </p>
          {estimate.deliveryError && (
            <p className="mt-1 text-sm text-amber-700">{estimate.deliveryError}</p>
          )}
          {locked && (
            <p className="mt-1 text-sm text-amber-800">
              Agreed estimate is locked. Use an approved adjustment for scope changes — do not edit line items.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/estimates/${estimateId}/preview`}
            className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            <Eye className="h-4 w-4" /> Preview as Customer
          </Link>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void postAction(estimate.sentAt ? "resend" : "send")}
          >
            <Send className="mr-1 h-4 w-4" /> {estimate.sentAt ? "Resend" : "Send"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Customer</p>
          {customer ? (
            <>
              <Link
                href={`/admin/customers/${customer.id}`}
                className="font-semibold text-brand-primary hover:underline"
              >
                {customer.name || "Customer"}
              </Link>
              {customer.phone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </p>
              )}
              {customer.email && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </p>
              )}
              {(customer.address ||
                (estimate.serviceAddress as { street?: string })?.street ||
                job?.address.street) && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {customer.address ||
                      [
                        (estimate.serviceAddress as { street?: string })?.street ?? job?.address.street,
                        (estimate.serviceAddress as { city?: string })?.city ?? job?.address.city,
                        (estimate.serviceAddress as { state?: string })?.state ?? job?.address.state,
                        (estimate.serviceAddress as { zip?: string })?.zip ?? job?.address.zip,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-700">Customer not linked</p>
              <p className="text-sm text-muted-foreground">
                {(estimate.serviceAddress as { street?: string })?.street || job?.address.street
                  ? [
                      (estimate.serviceAddress as { street?: string })?.street ?? job?.address.street,
                      (estimate.serviceAddress as { city?: string })?.city ?? job?.address.city,
                      (estimate.serviceAddress as { state?: string })?.state ?? job?.address.state,
                      (estimate.serviceAddress as { zip?: string })?.zip ?? job?.address.zip,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "No service address on file"}
              </p>
            </>
          )}
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Related job</p>
          {job ? (
            <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-brand-primary hover:underline">
              {job.id.slice(0, 12)}… · {job.status}
            </Link>
          ) : (
            <p className="font-semibold">Not converted yet</p>
          )}
          <p className="text-sm text-muted-foreground">
            Division: {estimate.divisionId ?? "junk_removal"}
          </p>
          {job?.scheduledDate && (
            <p className="text-sm text-muted-foreground">Scheduled {job.scheduledDate}</p>
          )}
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Totals</p>
          <p className="text-2xl font-bold text-brand-primary">{money(subtotal)}</p>
          <p className="text-xs text-muted-foreground">
            Saved total {money(estimate.estimatedTotal)}
            {estimate.estimatedProfit != null ? ` · Profit ${money(estimate.estimatedProfit)}` : ""}
            {estimate.estimatedMargin != null ? ` · Margin ${estimate.estimatedMargin}%` : ""}
          </p>
        </PremiumCard>
      </div>

      {customerUrl && (
        <PremiumCard className="flex flex-wrap items-center gap-2 p-4">
          <ExternalLink className="h-4 w-4 text-brand-primary" />
          <code className="flex-1 truncate text-xs">{customerUrl}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(customerUrl);
              toast.success("Customer link copied");
            }}
          >
            <Copy className="mr-1 h-4 w-4" /> Copy link
          </Button>
        </PremiumCard>
      )}

      <PremiumCard className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold">Line items</h3>
            <p className="text-xs text-muted-foreground">
              Charges from the estimate load here. Add standard adjustments or a discount as needed.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={locked}
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  id: `li-${Date.now()}`,
                  label: "Custom item",
                  quantity: 1,
                  unitPrice: 0,
                  amount: 0,
                  category: "custom",
                  sortOrder: prev.length,
                },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Blank line
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Add standard charge
          </p>
          <div className="flex flex-wrap gap-2">
            {presets
              .filter((p) => p.kind === "add" && p.id !== "misc")
              .map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  title={preset.description}
                  onClick={() => addPreset(preset)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {preset.label}
                  <span className="ml-1 text-muted-foreground">
                    {money(preset.defaultAmount)}
                  </span>
                </Button>
              ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-[1fr_120px_auto]">
          <div>
            <Label className="text-xs">Miscellaneous</Label>
            <Input
              placeholder="Describe the charge"
              value={miscLabel}
              onChange={(e) => setMiscLabel(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Amount (+/−)</Label>
            <Input
              type="number"
              placeholder="0"
              value={miscAmount}
              onChange={(e) => setMiscAmount(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={addMisc}>
              Add misc.
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-green-200/70 bg-green-50/40 p-3 md:grid-cols-[1fr_120px_auto] dark:border-green-900/40 dark:bg-green-950/20">
          <div>
            <Label className="text-xs">Apply discount</Label>
            <Input
              placeholder="Discount label"
              value={discountLabel}
              onChange={(e) => setDiscountLabel(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Amount off</Label>
            <Input
              type="number"
              placeholder="50"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={addDiscount}>
              <Minus className="mr-1 h-3.5 w-3.5" />
              Apply
            </Button>
            {presets
              .filter((p) => p.kind === "discount")
              .slice(0, 2)
              .map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => addPreset(preset)}
                >
                  {money(Math.abs(preset.defaultAmount))} off
                </Button>
              ))}
          </div>
        </div>

        <div className="space-y-3">
          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No line items loaded yet. Add a standard charge or blank line, then save.
            </p>
          ) : (
            lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_72px_100px_100px_auto]"
              >
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
                  title="Quantity"
                  value={line.quantity}
                  onChange={(e) => {
                    const quantity = Number(e.target.value) || 0;
                    const next = [...lines];
                    next[idx] = {
                      ...line,
                      quantity,
                      amount: Math.round(quantity * line.unitPrice * 100) / 100,
                    };
                    setLines(next);
                  }}
                />
                <Input
                  type="number"
                  title="Unit price"
                  value={line.unitPrice}
                  onChange={(e) => {
                    const unitPrice = Number(e.target.value) || 0;
                    const next = [...lines];
                    next[idx] = {
                      ...line,
                      unitPrice,
                      amount: Math.round(line.quantity * unitPrice * 100) / 100,
                    };
                    setLines(next);
                  }}
                />
                <div
                  className={`flex items-center font-medium ${
                    line.amount < 0 ? "text-green-700" : ""
                  }`}
                >
                  {line.amount < 0 ? `−$${Math.abs(line.amount).toFixed(2)}` : money(line.amount)}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" type="button" onClick={() => moveLine(idx, -1)}>
                    ↑
                  </Button>
                  <Button size="icon" variant="ghost" type="button" onClick={() => moveLine(idx, 1)}>
                    ↓
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={() => setLines(lines.filter((l) => l.id !== line.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between border-t pt-3 text-lg font-bold">
          <span>Estimated total</span>
          <span className="text-brand-primary">{money(subtotal)}</span>
        </div>
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
        <div>
          <Label>Revision reason (required after send)</Label>
          <Input value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} placeholder="Why is this changing?" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={saving || locked} onClick={() => void saveEdits(false)}>Save draft / edits</Button>
          <Button disabled={saving || locked} variant="outline" onClick={() => void saveEdits(true)}>
            Save as revision
          </Button>
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-3 p-5">
        <h3 className="font-bold">Approvals & actions</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Method</Label>
            <Select value={approvalMethod} onValueChange={(v) => { if (v != null) setApprovalMethod(v); }} disabled={locked}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="in_person">In person</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Approved / declined by</Label>
            <Input value={approvalBy} onChange={(e) => setApprovalBy(e.target.value)} placeholder="Customer name" disabled={locked && !!estimate.customerApprovedAt} />
          </div>
          <div>
            <Label>Note</Label>
            <Input value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={saving || !!estimate.internalApprovedAt || locked}
            variant="outline"
            onClick={() =>
              void postAction("internal_approve", {
                approvedBy: approvalBy || "Owner/Manager",
                note: approvalNote,
              })
            }
          >
            <Check className="mr-1 h-4 w-4" /> Approve internally
          </Button>
          <Button
            disabled={saving || !approvalBy || locked}
            onClick={() =>
              void postAction("accept", { method: approvalMethod, acceptedBy: approvalBy, note: approvalNote })
            }
          >
            <Check className="mr-1 h-4 w-4" /> Record customer accepted
          </Button>
          <Button
            disabled={saving || !approvalBy || locked}
            variant="outline"
            onClick={() =>
              void postAction("decline", { method: approvalMethod, acceptedBy: approvalBy, note: approvalNote })
            }
          >
            <X className="mr-1 h-4 w-4" /> Record declined
          </Button>
          <Button disabled={saving} variant="outline" onClick={() => void postAction("duplicate")}>
            Duplicate
          </Button>
          <Button
            disabled={saving || estimate.status === "converted"}
            onClick={() => {
              const needsOverride =
                !estimate.internalApprovedAt ||
                !(estimate.customerApprovedAt || estimate.acceptedAt);
              if (
                needsOverride &&
                !confirm(
                  "Both approvals are not recorded yet. Convert with owner override? This creates the job immediately."
                )
              ) {
                return;
              }
              void postAction("convert", { ownerOverride: needsOverride });
            }}
          >
            <Briefcase className="mr-1 h-4 w-4" /> Convert to job
          </Button>
          <Button
            disabled={saving}
            variant="outline"
            onClick={() => void postAction("create_invoice")}
          >
            <FilePlus className="mr-1 h-4 w-4" /> Create invoice (completed job)
          </Button>
          <Button
            disabled={saving || locked}
            variant="destructive"
            onClick={() => {
              if (!confirm("Delete this estimate? This cannot be undone from the active list.")) return;
              void postAction("delete", { reason: approvalNote || "Deleted before approval" }).then((d) => {
                if (d) router.push("/admin/estimates");
              });
            }}
          >
            Delete
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Final agreement requires both internal approval and customer acceptance. The job is created
          automatically when both are recorded. Invoice creation requires a completed job with proof.
        </p>
      </PremiumCard>

      <PremiumCard className="space-y-3 p-5">
        <h3 className="font-bold">On-site adjustment</h3>
        <p className="text-sm text-muted-foreground">
          Creates a pending adjustment that requires customer approval before the price changes.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Reason" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
          <Input placeholder="Added item label" value={adjLabel} onChange={(e) => setAdjLabel(e.target.value)} />
          <Input placeholder="Amount" type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
        </div>
        <Button
          disabled={saving || !adjReason || !adjLabel || !adjAmount}
          onClick={() =>
            void postAction("create_adjustment", {
              reason: adjReason,
              addedLineItems: [{ label: adjLabel, unitPrice: Number(adjAmount), quantity: 1 }],
            })
          }
        >
          Create adjustment for approval
        </Button>
        <div className="space-y-2">
          {adjustments.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{a.reason}</span>
                <StatusChip label={a.status.replace(/_/g, " ")} variant={a.status === "approved" ? "success" : "warning"} />
              </div>
              <p className="text-muted-foreground">
                {money(a.originalTotal)} → {money(a.newTotal)} ({a.adjustmentTotal >= 0 ? "+" : ""}
                {money(a.adjustmentTotal)})
              </p>
              {a.status === "pending_approval" && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/estimate-adjustments/${a.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          decision: "approved",
                          method: approvalMethod || "phone",
                          approvedBy: approvalBy || "Customer",
                          note: approvalNote,
                        }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        toast.success("Adjustment approved");
                        await load();
                      } else toast.error(data.error ?? "Failed");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/estimate-adjustments/${a.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          decision: "declined",
                          method: approvalMethod || "phone",
                          approvedBy: approvalBy || "Customer",
                        }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        toast.success("Adjustment declined");
                        await load();
                      } else toast.error(data.error ?? "Failed");
                    }}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="space-y-3 p-5">
        <h3 className="font-bold">Version history</h3>
        <div className="flex flex-wrap gap-3">
          <Select value={String(compareA ?? "")} onValueChange={(v) => setCompareA(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Version A" /></SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={String(v.versionNumber)}>v{v.versionNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(compareB ?? "")} onValueChange={(v) => setCompareB(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Version B" /></SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={String(v.versionNumber)}>v{v.versionNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {versionA && versionB && (
          <div className="grid gap-4 md:grid-cols-2">
            {[versionA, versionB].map((v) => (
              <div key={v.id} className="rounded-lg border p-3 text-sm">
                <p className="font-semibold">Version {v.versionNumber}</p>
                <p className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</p>
                <p className="mt-2 font-bold">{money(v.newTotal)}</p>
                <p className="text-xs text-muted-foreground">{v.revisionReason || "—"}</p>
                <ul className="mt-2 space-y-1">
                  {v.lineItems.slice(0, 8).map((l) => (
                    <li key={l.id} className="flex justify-between gap-2">
                      <span>{l.label}</span>
                      <span>{money(l.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      <PremiumCard className="space-y-2 p-5">
        <h3 className="font-bold">Activity history</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                {a.reason && <p className="text-muted-foreground">{a.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>
    </div>
  );
}
