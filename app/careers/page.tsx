"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { CareersHero } from "@/components/careers/CareersHero";
import { CareersBenefits } from "@/components/careers/CareersBenefits";
import { CareersPositions } from "@/components/careers/CareersPositions";
import { CareersGrowthPath } from "@/components/careers/CareersGrowthPath";
import { CareersApplySection } from "@/components/careers/CareersApplySection";
import { CareersProcess, CareersLegalNote } from "@/components/careers/CareersProcess";
import { getReferenceCareerPostings, resolveCareersPostings } from "@/lib/careers/resolve-postings";
import type { JobPosting } from "@/types/hr/ats";

export default function CareersPage() {
  const [postings, setPostings] = useState<JobPosting[]>(getReferenceCareerPostings);
  const [selectedPostingId, setSelectedPostingId] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/careers/postings")
      .then((r) => r.json())
      .then((d) => {
        setPostings(resolveCareersPostings(d.ok ? d.postings : null));
      })
      .catch(() => {
        setPostings(getReferenceCareerPostings());
      });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ postingId: string }>).detail;
      if (detail?.postingId) setSelectedPostingId(detail.postingId);
    };
    window.addEventListener("careers:select-posting", handler);
    return () => window.removeEventListener("careers:select-posting", handler);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F8F9FB]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <CareersHero />
      <CareersBenefits />
      <CareersPositions postings={postings} />
      <CareersGrowthPath />
      <CareersApplySection postings={postings} selectedPostingId={selectedPostingId} />
      <CareersProcess />
      <CareersLegalNote />
      <PublicFooter variant="company" />
    </div>
  );
}
