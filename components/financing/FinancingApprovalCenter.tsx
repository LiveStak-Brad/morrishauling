"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FinancingRequest } from "@/types/financing";
import type { Customer } from "@/types/user";
import type { Invoice, Job, Payment } from "@/types";
import { useCompany } from "@/lib/company-context";
import { mutateApproveFinancing, mutateDenyFinancing } from "@/lib/api/mutations";
import { inHouseFinancingProvider } from "@/lib/financing-provider";
import { calculateFinancingBreakdown } from "@/lib/payment-utils";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { formatCurrency, formatDate } from "@/components/payments/payment-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Loader2,
  Shield,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancingApprovalCenterProps {
  onUpdate?: () => void;
}

function RiskBadge({ score }: { score?: number }) {
  const s = score ?? 50;
  const variant =
    s >= 75 ? "success" : s >= 55 ? "warning" : "urgent";
  const label = s >= 75 ? "Low risk" : s >= 55 ? "Medium risk" : "High risk";
  return <StatusChip label={`${label} · ${s}`} variant={variant} />;
}

function ApplicantCard({
  request,
  customer,
  job,
  invoice,
  history,
  onUpdate,
}: {
  request: FinancingRequest;
  customer?: Customer;
  job?: Job;
  invoice?: Invoice;
  history: Payment[];
  onUpdate?: () => void;
}) {
  const { companyId } = useCompany();
  const [approveOpen, setApproveOpen] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downPayment, setDownPayment] = useState(request.downPayment);
  const [numPayments, setNumPayments] = useState(request.numberOfPayments);
  const [internalNotes, setInternalNotes] = useState(request.internalNotes ?? "");
  const [denyReason, setDenyReason] = useState("");
  const [notesDraft, setNotesDraft] = useState(request.internalNotes ?? "");

  const breakdown = calculateFinancingBreakdown(
    request.totalAmount,
    downPayment,
    numPayments
  );

  const handleApprove = async () => {
    setLoading(true);
    try {
      await mutateApproveFinancing(companyId, request.id, {
        downPayment,
        numberOfPayments: numPayments,
        internalNotes,
      });
    } finally {
      setLoading(false);
      setApproveOpen(false);
      onUpdate?.();
    }
  };

  const handleDeny = async () => {
    setLoading(true);
    try {
      await mutateDenyFinancing(
        companyId,
        request.id,
        denyReason || "Does not meet criteria",
        { internalNotes }
      );
    } finally {
      setLoading(false);
      setDenyOpen(false);
      onUpdate?.();
    }
  };

  const handleSaveNotes = async () => {
    await inHouseFinancingProvider.updateInternalNotes(
      request.id,
      companyId,
      notesDraft
    );
    onUpdate?.();
  };

  const handleMarkPaid = async (scheduleId: string) => {
    await inHouseFinancingProvider.markPaymentReceived(
      request.id,
      companyId,
      scheduleId
    );
    onUpdate?.();
  };

  const handleMarkLate = async (scheduleId: string) => {
    await inHouseFinancingProvider.markPaymentLate(
      request.id,
      companyId,
      scheduleId
    );
    onUpdate?.();
  };

  const isPending = request.status === "pending";

  return (
    <PremiumCard className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">
                {customer?.name ?? "Customer"}
              </h3>
              <StatusChip
                label={request.status}
                variant={
                  request.status === "pending"
                    ? "live"
                    : request.status === "approved" || request.status === "active"
                      ? "success"
                      : request.status === "denied"
                        ? "urgent"
                        : "neutral"
                }
                pulse={request.status === "pending"}
              />
              <RiskBadge score={request.riskScore} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job?.address.street}, {job?.address.city}
            </p>
          </div>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setApproveOpen(true)}
            >
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDenyOpen(true)}>
              <X className="mr-1 h-4 w-4" />
              Deny
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-3">
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Request details
          </h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total {formatCurrency(request.totalAmount)}
            </p>
            <p className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Down {formatCurrency(request.downPayment)} · {request.numberOfPayments}{" "}
              {request.paymentFrequency}
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              First payment{" "}
              {request.preferredFirstPaymentDate
                ? formatDate(request.preferredFirstPaymentDate)
                : "—"}
            </p>
            {request.employmentStatus && (
              <p className="capitalize">Employment: {request.employmentStatus.replace(/_/g, " ")}</p>
            )}
            {request.monthlyIncome && (
              <p>Income: {formatCurrency(request.monthlyIncome)}/mo</p>
            )}
            {request.customerNotes && (
              <p className="rounded-lg bg-gray-50 p-2 text-muted-foreground">
                &ldquo;{request.customerNotes}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Job & invoice
          </h4>
          <div className="text-sm">
            <p className="font-medium">{job?.junkType}</p>
            <p className="text-muted-foreground">{invoice?.invoiceNumber ?? "No invoice"}</p>
            <p className="mt-2">
              Balance due:{" "}
              <span className="font-bold text-brand-primary">
                {formatCurrency(invoice?.balanceDue ?? request.totalAmount)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 p-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            Risk indicators placeholder — credit check API
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Customer history
          </h4>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prior payments</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {history.slice(0, 4).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="capitalize">{p.method.replace(/_/g, " ")}</span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {request.paymentSchedule && request.paymentSchedule.length > 0 && (
        <div className="border-t border-gray-100 p-5">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Payment schedule
          </h4>
          <div className="space-y-2">
            {request.paymentSchedule.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(p.dueDate)}</span>
                  <span className="font-semibold">{formatCurrency(p.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    label={p.status}
                    variant={
                      p.status === "paid"
                        ? "success"
                        : p.status === "late" || p.status === "missed"
                          ? "urgent"
                          : "neutral"
                    }
                  />
                  {p.status === "scheduled" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleMarkPaid(p.id)}
                      >
                        Received
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-orange-600"
                        onClick={() => handleMarkLate(p.id)}
                      >
                        Late
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 bg-gray-50/50 p-5">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Internal notes
        </h4>
        <Textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={2}
          placeholder="Owner-only notes..."
        />
        <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>
          Save notes
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve financing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Down payment</Label>
                <Input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Number of payments</Label>
                <Input
                  type="number"
                  min={2}
                  value={numPayments}
                  onChange={(e) => setNumPayments(Number(e.target.value))}
                />
              </div>
            </div>
            <PremiumCard className="bg-emerald-50/50 p-3 text-sm">
              <p>
                {numPayments} payments of{" "}
                <strong>{formatCurrency(breakdown.perPayment)}</strong> after{" "}
                {formatCurrency(downPayment)} down
              </p>
            </PremiumCard>
            <div>
              <Label>Internal notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deny financing request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Customer will be notified their request was not approved.
            </div>
            <div>
              <Label>Reason (customer-facing)</Label>
              <Input
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Does not meet criteria"
              />
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deny request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumCard>
  );
}

export function FinancingApprovalCenter({ onUpdate }: FinancingApprovalCenterProps) {
  const { companyId } = useCompany();
  const [requests, setRequests] = useState<FinancingRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/financing").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/payments").then((r) => r.json()),
    ])
      .then(([fin, cust, jobRes, inv, pay]) => {
        if (fin.ok) setRequests(fin.requests ?? []);
        if (cust.ok) setCustomers(cust.customers ?? []);
        if (jobRes.ok) setJobs(jobRes.jobs ?? []);
        if (inv.ok) setInvoices(inv.invoices ?? []);
        if (pay.ok) setPayments(pay.payments ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const invoiceMap = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  const pending = requests.filter((r) => r.status === "pending");
  const other = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading financing requests…</p>;
  }

  const renderCard = (request: FinancingRequest) => {
    const jobIds = new Set(jobs.filter((j) => j.customerId === request.customerId).map((j) => j.id));
    const history = payments.filter((p) => jobIds.has(p.jobId));
    return (
      <ApplicantCard
        key={request.id}
        request={request}
        customer={customerMap.get(request.customerId)}
        job={jobMap.get(request.jobId)}
        invoice={request.invoiceId ? invoiceMap.get(request.invoiceId) : undefined}
        history={history}
        onUpdate={() => {
          refresh();
          onUpdate?.();
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending review", value: pending.length, color: "text-brand-primary" },
          { label: "Active plans", value: requests.filter((r) => r.status === "active" || r.status === "approved").length, color: "text-emerald-600" },
          { label: "Total requests", value: requests.length, color: "text-gray-900" },
        ].map((stat) => (
          <PremiumCard key={stat.label} className="p-4 text-center">
            <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </PremiumCard>
        ))}
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Pending approval</h2>
          <div className="space-y-4">
            {pending.map((r) => renderCard(r))}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">All requests</h2>
          <div className="space-y-4">
            {other.map((r) => renderCard(r))}
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <PremiumCard className="py-16 text-center text-muted-foreground">
          No financing requests yet
        </PremiumCard>
      )}
    </div>
  );
}
