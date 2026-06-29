"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { CareersPositions } from "@/components/careers/CareersPositions";
import { getReferenceCareerPostings, resolveCareersPostings } from "@/lib/careers/resolve-postings";
import type { JobPosting } from "@/types/hr/ats";

export default function CareersJobsPage() {
  const [postings, setPostings] = useState<JobPosting[]>(getReferenceCareerPostings);

  useEffect(() => {
    fetch("/api/careers/postings")
      .then((r) => r.json())
      .then((d) => setPostings(resolveCareersPostings(d.ok ? d.postings : null)))
      .catch(() => setPostings(getReferenceCareerPostings()));
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FB]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <div className="bg-[#0A0A0A] text-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <Link href="/careers" className="text-sm text-red-300 hover:underline">← Careers home</Link>
          <h1 className="text-3xl font-bold mt-4">All Positions</h1>
          <p className="text-white/70 mt-2 max-w-2xl">
            Browse current openings and future opportunities across field, office, and growth roles.
          </p>
        </div>
      </div>
      <CareersPositions postings={postings} />
      <PublicFooter variant="company" />
    </div>
  );
}
