"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCompany } from "@/lib/company-context";
import { mutateJobFields } from "@/lib/api/mutations";
import { uploadJobPhotos } from "@/lib/jobs/upload-photos";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JobStatusButtons } from "@/components/employee/JobStatusButtons";
import { JobCompletionForm } from "@/components/employee/JobCompletionForm";
import { DisposalCompletionPanel } from "@/components/disposal/DisposalCompletionPanel";
import { FieldPaymentCollection } from "@/components/employee/FieldPaymentCollection";
import { LiveEstimate } from "@/components/estimate/LiveEstimate";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { EmployeeHaulingJobDetail, EmployeeJunkJobDetail } from "@/components/jobs/ServiceLineJobViews";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@/types/payment";
import type { Job } from "@/types/job";
import { ArrowLeft, Navigation } from "lucide-react";

export default function EmployeeJobPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { company, companyId } = useCompany();
  const [tick, setTick] = useState(0);
  const [job, setJob] = useState<Job | null>(null);
  const [invoice, setInvoice] = useState<Invoice | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetch(`/api/me/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setJob(d.job);
          setInvoice(d.invoice);
        } else setError(d.error ?? "Job not found");
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId, tick]);

  const estimateResult = useMemo(() => {
    if (!job || job.serviceType === "hauling_transport") return null;
    return junkRemovalEngine.calculate(
      {
        mode: job.junkRemovalDetails?.estimateMode ?? "cleanout",
        selectedItems: job.junkRemovalDetails?.selectedItems,
        loadSizeTier: job.loadSizeTier,
        junkCategory: job.junkType,
        accessDetails: job.accessDetails,
        items: job.items,
        addressLocation: job.address.location,
        zip: job.address.zip,
        priorityLevel: job.junkRemovalDetails?.priorityLevel,
        hasPhotos: job.photos.length > 0,
        customerNotes: job.customerNotes,
      },
      company
    );
  }, [job, company]);

  if (loading) return <main className="p-4 pb-24">Loading job…</main>;

  if (!job || error) {
    return (
      <main className="p-4 pb-24 space-y-4">
        <p className="text-destructive">{error ?? "Job not found"}</p>
        <ButtonLink href="/employee" variant="outline">Back to home</ButtonLink>
      </main>
    );
  }

  const refresh = () => setTick((t) => t + 1);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${job.address.street}, ${job.address.city}, ${job.address.state} ${job.address.zip}`
  )}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-28">
      <ButtonLink href="/employee" variant="ghost" size="sm" className="mb-2 -ml-2 inline-flex items-center">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </ButtonLink>

      <PageHeader
        title={
          job.serviceType === "hauling_transport" && job.haulingDetails
            ? `${job.haulingDetails.pickup.city} → ${job.haulingDetails.delivery.city}`
            : job.address.street
        }
        description={`${job.serviceType === "hauling_transport" ? "Hauling & Transport · " : "Junk Removal · "}${job.address.city} · ${job.status.replace(/_/g, " ")}`}
      />

      <ButtonLink href={mapsUrl} className="w-full h-12 mb-4 flex items-center justify-center" target="_blank" rel="noopener noreferrer">
        <Navigation className="mr-2 h-4 w-4" /> Navigate to job
      </ButtonLink>

      <div className="space-y-4">
        {job.serviceType === "hauling_transport" ? (
          <EmployeeHaulingJobDetail job={job} />
        ) : job.junkRemovalDetails ? (
          <EmployeeJunkJobDetail job={job} />
        ) : (
          estimateResult && <LiveEstimate estimate={estimateResult} />
        )}

        <div id="payment">
          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-3">Field payment collection</h3>
            <FieldPaymentCollection
              key={tick}
              job={job}
              invoice={invoice}
              onUpdate={refresh}
            />
          </PremiumCard>
        </div>

        {job.serviceType !== "hauling_transport" &&
          !job.junkRemovalDetails?.disposalCompletedAt &&
          !job.junkRemovalDetails?.disposalSkipReason &&
          (job.status === "needs_dump" || job.status === "in_progress") && (
            <PremiumCard className="border-brand-primary/30 p-4">
              <DisposalCompletionPanel jobId={job.id} onComplete={refresh} mobileFirst showCompareLink={false} />
            </PremiumCard>
          )}

        <PremiumCard className="p-4">
          <h3 className="font-semibold mb-3">Job status</h3>
          <JobStatusButtons jobId={job.id} status={job.status} job={job} onUpdate={refresh} />
        </PremiumCard>

        <PremiumCard className="p-4">
          <h3 className="font-semibold mb-2">Photos</h3>
          {job.photos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2">
              {job.photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image src={photo.url} alt={photo.caption ?? "Job photo"} fill className="object-cover" unoptimized />
                </a>
              ))}
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            multiple
            disabled={uploadingPhotos}
            onChange={async (e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (!files.length) return;
              setUploadingPhotos(true);
              try {
                await uploadJobPhotos(job.id, files, "after");
                toast.success("Photos uploaded");
                refresh();
              } catch {
                toast.error("Photo upload failed");
              } finally {
                setUploadingPhotos(false);
                e.target.value = "";
              }
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {uploadingPhotos ? "Uploading…" : "Upload before/after or damage photos for this job."}
          </p>
        </PremiumCard>

        <PremiumCard className="p-4">
          <h3 className="font-semibold mb-3">Completion details</h3>
          <JobCompletionForm
            finalLoadSize={job.finalLoadSizeTier}
            extraFees={job.extraFees}
            priceAdjustmentNotes={job.priceAdjustmentNotes}
            paymentCollected={job.paymentCollected}
            onChange={async (patch) => {
              await mutateJobFields(companyId, job.id, patch);
              refresh();
            }}
          />
        </PremiumCard>
      </div>
    </main>
  );
}
