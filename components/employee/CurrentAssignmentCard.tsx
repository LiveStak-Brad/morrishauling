"use client";

import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type { Job } from "@/types/job";
import {
  MapPin, Phone, Navigation, FileText, Camera, CreditCard,
  AlertTriangle,
} from "lucide-react";
import { LOAD_SIZE_TRAILER_PERCENT } from "@/types/job";

export function CurrentAssignmentCard({ job }: { job?: Job }) {
  if (!job) {
    return (
      <PremiumCard className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">No job assigned yet</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          Check with dispatch or wait for your route to be assigned.
        </p>
        <ButtonLink href="/employee/schedule" variant="outline" className="mt-4">
          View schedule
        </ButtonLink>
      </PremiumCard>
    );
  }

  const loadPct = job.loadSizeTier ? LOAD_SIZE_TRAILER_PERCENT[job.loadSizeTier] : undefined;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${job.address.street}, ${job.address.city}, ${job.address.state} ${job.address.zip}`
  )}`;
  const serviceLabel = job.serviceType === "hauling_transport" ? "Hauling" : "Junk Removal";

  return (
    <PremiumCard className="p-0 overflow-hidden border-2 border-brand-primary/20">
      <div className="morris-gradient-bg px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-white/70">Current Assignment</p>
            <h3 className="text-xl font-bold">{serviceLabel}</h3>
          </div>
          <StatusChip
            label={job.status.replace(/_/g, " ")}
            variant={job.status === "in_progress" ? "success" : "neutral"}
            className="bg-white/15 text-white ring-white/20 capitalize"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="font-semibold text-lg">{job.address.street}</p>
          <p className="text-muted-foreground">{job.address.city}, {job.address.state} {job.address.zip}</p>
          {job.scheduledWindowLabel && (
            <p className="text-sm mt-1">Scheduled: <strong>{job.scheduledWindowLabel}</strong></p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {loadPct != null && <StatusChip label={`${loadPct}% load`} variant="warning" />}
          {job.junkRemovalDetails?.reviewRequired && (
            <StatusChip label="Needs review" variant="warning" />
          )}
        </div>

        {job.accessDetails?.notes && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
            <p className="font-semibold flex items-center gap-1 text-amber-900">
              <AlertTriangle className="h-4 w-4" /> Access notes
            </p>
            <p className="text-amber-800 mt-1">{job.accessDetails.notes}</p>
          </div>
        )}

        {job.customerNotes && (
          <p className="text-sm text-muted-foreground">
            <FileText className="inline h-3.5 w-3.5 mr-1" />
            {job.customerNotes}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href={mapsUrl} className="h-12" target="_blank" rel="noopener noreferrer">
            <Navigation className="mr-2 h-4 w-4" /> Navigate
          </ButtonLink>
          <ButtonLink href={`/employee/jobs/${job.id}`} variant="outline" className="h-12">
            View job
          </ButtonLink>
          <Button variant="outline" className="h-11" disabled title="SMS coming soon">
            <Phone className="mr-2 h-4 w-4" /> Call customer
          </Button>
          <Button variant="outline" className="h-11" disabled title="SMS coming soon">
            Text customer
          </Button>
          <ButtonLink href={`/employee/jobs/${job.id}#payment`} variant="secondary" className="h-11 col-span-2">
            <CreditCard className="mr-2 h-4 w-4" /> Collect payment
          </ButtonLink>
        </div>

        {job.photos.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" /> {job.photos.length} photo(s) on file
          </p>
        )}
      </div>
    </PremiumCard>
  );
}
