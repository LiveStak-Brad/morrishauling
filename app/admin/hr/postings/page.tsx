"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { HIRING_MODE_LABELS } from "@/lib/careers/constants";
import type { JobPosting } from "@/types/hr/ats";

export default function JobPostingsPage() {
  const [postings, setPostings] = useState<JobPosting[]>([]);

  useEffect(() => {
    fetch("/api/hr/job-postings")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPostings(d.postings); });
  }, []);

  return (
    <AdminPageShell
      title="Job Postings"
      description="Manage careers page visibility, hiring status, and role details"
      action={
        <div className="flex gap-2">
          <ButtonLink href="/admin/hr/job-postings/new" size="sm">New Posting</ButtonLink>
          <ButtonLink href="/careers" variant="outline" size="sm">View Public Page</ButtonLink>
        </div>
      }
    >
      <div className="space-y-3">
        {postings.length === 0 && (
          <PremiumCard className="p-6 text-center text-muted-foreground">
            No postings yet. Reference templates are seeded via migration 036.
          </PremiumCard>
        )}
        {postings.map((p) => (
          <PremiumCard key={p.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{p.title}</p>
                <Badge>{p.status}</Badge>
                {p.hiringMode && (
                  <Badge variant="outline">{HIRING_MODE_LABELS[p.hiringMode]}</Badge>
                )}
                {p.isReferenceTemplate && <Badge variant="secondary">Template</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {p.departmentLabel ?? p.location} · /careers/jobs/{p.slug}
              </p>
            </div>
            <ButtonLink href={`/admin/hr/postings/${p.id}`} size="sm" variant="outline">
              Edit
            </ButtonLink>
          </PremiumCard>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Set <strong>status</strong> to Published and choose a <strong>hiring mode</strong> to control how roles appear on the careers page.
        Use Hidden to remove a role from the public site.
      </p>
    </AdminPageShell>
  );
}
