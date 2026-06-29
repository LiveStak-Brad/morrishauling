"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import {
  getInvoice,
  getJobByCompany,
  getFinancingByJob,
} from "@/lib/mock-data";
import { FinancingRequestWizard } from "@/components/financing/FinancingRequestWizard";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function FinancingContent() {
  const searchParams = useSearchParams();
  const { companyId } = useCompany();
  const jobId = searchParams.get("job") ?? "job-m2";
  const invoiceParam = searchParams.get("invoice");
  const invoice =
    invoiceParam ? getInvoice(companyId, invoiceParam) : undefined;
  const job = getJobByCompany(companyId, jobId);
  const financing = getFinancingByJob(companyId, jobId);
  const totalAmount =
    invoice?.balanceDue ?? invoice?.total ?? job?.estimate?.total ?? 850;

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
      jobId={jobId}
      invoiceId={invoice?.id ?? invoiceParam ?? undefined}
      totalAmount={totalAmount}
    />
  );
}

export default function CustomerFinancingPage() {
  const { company } = useCompany();

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
