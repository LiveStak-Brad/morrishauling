"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import { getJobByCompany, updateJob, getInvoiceByJob } from "@/lib/mock-data";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JobStatusButtons } from "@/components/employee/JobStatusButtons";
import { JobCompletionForm } from "@/components/employee/JobCompletionForm";
import { FieldPaymentCollection } from "@/components/employee/FieldPaymentCollection";
import { LiveEstimate } from "@/components/estimate/LiveEstimate";
import { estimateEngine } from "@/lib/estimate-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";

export default function EmployeeJobPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { company, companyId } = useCompany();
  const [tick, setTick] = useState(0);
  const job = getJobByCompany(companyId, jobId);
  const invoice = getInvoiceByJob(companyId, jobId);

  const estimateResult = useMemo(() => {
    if (!job) return null;
    return estimateEngine.calculate(
      {
        loadSizeTier: job.loadSizeTier,
        accessDetails: job.accessDetails,
        items: job.items,
        addressLocation: job.address.location,
      },
      company
    );
  }, [job, company]);

  if (!job) {
    return <main className="p-4">Job not found</main>;
  }

  const refresh = () => setTick((t) => t + 1);

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-8">
      <PageHeader
        title={job.address.street}
        description={`${job.address.city} · ${job.status}`}
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {job.customerNotes || "None"}
          </CardContent>
        </Card>

        {estimateResult && <LiveEstimate estimate={estimateResult} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos (placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input type="file" accept="image/*" multiple disabled />
            <p className="mt-1 text-xs text-muted-foreground">Upload coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job status</CardTitle>
          </CardHeader>
          <CardContent>
            <JobStatusButtons
              jobId={job.id}
              status={job.status}
              onUpdate={refresh}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field payment collection</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldPaymentCollection
              key={tick}
              job={job}
              invoice={invoice}
              onUpdate={refresh}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion details</CardTitle>
          </CardHeader>
          <CardContent>
            <JobCompletionForm
              finalLoadSize={job.finalLoadSizeTier}
              extraFees={job.extraFees}
              priceAdjustmentNotes={job.priceAdjustmentNotes}
              paymentCollected={job.paymentCollected}
              onChange={(patch) => {
                updateJob(companyId, job.id, patch);
                refresh();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
