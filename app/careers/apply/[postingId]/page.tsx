"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { ApplicationForm } from "@/components/hr/ApplicationForm";
import { Badge } from "@/components/ui/badge";
import { HIRING_MODE_LABELS, HIRING_MODE_VARIANT } from "@/lib/careers/constants";
import { findCareerPosting, getReferenceCareerPostings, resolveCareersPostings } from "@/lib/careers/resolve-postings";
import type { JobPosting } from "@/types/hr/ats";

export default function ApplyPage() {
  const { postingId } = useParams<{ postingId: string }>();
  const [posting, setPosting] = useState<JobPosting | null>(() =>
    findCareerPosting(getReferenceCareerPostings(), { id: postingId }) ?? null
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/careers/postings")
      .then((r) => r.json())
      .then((d) => {
        const list = resolveCareersPostings(d.ok ? d.postings : null);
        const found = findCareerPosting(list, { id: postingId });
        if (found) setPosting(found);
        else setNotFound(true);
      })
      .catch(() => {
        const found = findCareerPosting(getReferenceCareerPostings(), { id: postingId });
        if (found) setPosting(found);
        else setNotFound(true);
      });
  }, [postingId]);

  if (notFound) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F8F9FB]">
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Position not found</h1>
          <Link href="/careers#apply" className="text-brand-primary hover:underline mt-4 inline-block">
            ← Back to careers
          </Link>
        </main>
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F8F9FB]">
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="mx-auto max-w-2xl px-4 py-12"><p className="text-muted-foreground">Loading…</p></main>
      </div>
    );
  }

  const hiringMode = posting.hiringMode ?? "future_opening";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F9FB]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <div className="bg-[#0A0A0A] text-white py-8">
        <div className="mx-auto max-w-2xl px-4">
          <Link href={`/careers/jobs/${posting.slug}`} className="text-sm text-red-300 hover:underline">
            ← Back to job details
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant={HIRING_MODE_VARIANT[hiringMode]}>{HIRING_MODE_LABELS[hiringMode]}</Badge>
          </div>
          <h1 className="text-2xl font-bold mt-2">Apply: {posting.title}</h1>
        </div>
      </div>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <ApplicationForm posting={posting} />
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}
