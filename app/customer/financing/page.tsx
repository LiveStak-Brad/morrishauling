"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { CustomerLoginPrompt } from "@/components/customer/CustomerLoginPrompt";
import { FinancingRequestWizard } from "@/components/financing/FinancingRequestWizard";
import { ArrowLeft } from "lucide-react";

function FinancingContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");
  const invoiceParam = searchParams.get("invoice");
  const { data, loading } = useCustomerPortal();

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const job = jobId ? data?.jobs.find((j) => j.id === jobId) : data?.jobs[0];
  const invoice = invoiceParam
    ? data?.invoices.find((i) => i.id === invoiceParam)
    : job
      ? data?.invoices.find((i) => i.jobId === job.id)
      : undefined;
  const resolvedJobId = jobId ?? job?.id;
  const financing = resolvedJobId
    ? data?.financing.find((f) => f.jobId === resolvedJobId)
    : undefined;
  const totalAmount =
    invoice?.balanceDue ?? invoice?.total ?? job?.estimate?.total ?? 0;

  if (!resolvedJobId) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p>No eligible job found for financing.</p>
        <Link href="/book" className="mt-4 inline-block text-brand-primary underline">
          Book a service
        </Link>
      </div>
    );
  }

  if (financing?.status === "pending") {
    return (
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6 text-center">
        <p className="font-semibold">Request under review</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your financing request is being reviewed. We&apos;ll notify you soon.
        </p>
        <Link href="/customer/payments" className="mt-4 inline-block text-brand-primary underline">
          View payments
        </Link>
      </div>
    );
  }

  return (
    <FinancingRequestWizard
      jobId={resolvedJobId}
      invoiceId={invoice?.id ?? invoiceParam ?? undefined}
      totalAmount={totalAmount}
    />
  );
}

export default function CustomerFinancingPage() {
  const { company } = useCompany();
  const { requiresLogin } = useCustomerPortal();

  if (requiresLogin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <CustomerLoginPrompt redirectPath="/customer/financing" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6">
        <Link
          href="/customer/payments"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Payments
        </Link>
        <h1 className="text-2xl font-bold">Request financing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          In-house payment plans · {company.companyName}
        </p>
      </div>

      <div className="mt-6 px-4">
        <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
          <FinancingContent />
        </Suspense>
      </div>
    </div>
  );
}
