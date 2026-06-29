"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  HIRING_MODE_LABELS,
  HIRING_MODE_VARIANT,
} from "@/lib/careers/constants";
import { formatEmploymentType, formatPayRange } from "@/lib/careers/format";
import { findCareerPosting, getReferenceCareerPostings, scrollToApplySection } from "@/lib/careers/resolve-postings";
import type { JobPosting } from "@/types/hr/ats";
import { Calendar, MapPin, TrendingUp } from "lucide-react";

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posting, setPosting] = useState<JobPosting | null>(() =>
    findCareerPosting(getReferenceCareerPostings(), { slug }) ?? null
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/careers/postings/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPosting(d.posting);
        else setNotFound(!findCareerPosting(getReferenceCareerPostings(), { slug }));
      })
      .catch(() => {
        const fallback = findCareerPosting(getReferenceCareerPostings(), { slug });
        if (!fallback) setNotFound(true);
      });
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Position not found</h1>
          <Link href="/careers#positions" className="text-brand-primary hover:underline mt-4 inline-block">
            ← Back to careers
          </Link>
        </main>
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="mx-auto max-w-3xl px-4 py-12"><p className="text-muted-foreground">Loading…</p></main>
      </div>
    );
  }

  const hiringMode = posting.hiringMode ?? "future_opening";

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <div className="bg-[#0A0A0A] text-white py-10">
        <div className="mx-auto max-w-3xl px-4">
          <Link href="/careers#positions" className="text-sm text-red-300 hover:underline">
            ← All positions
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge variant={HIRING_MODE_VARIANT[hiringMode]}>{HIRING_MODE_LABELS[hiringMode]}</Badge>
            {posting.isReferenceTemplate && (
              <Badge variant="outline" className="border-white/30 text-white/80">Reference Position</Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">{posting.title}</h1>
          <p className="text-white/70 mt-2">{posting.departmentLabel}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{posting.location}</span>
            {posting.schedule && (
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{posting.schedule}</span>
            )}
            <span>{formatEmploymentType(posting.employmentType)}</span>
            <span>{formatPayRange(posting, { prelaunch: true })}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <PremiumCard className="p-6">
          <h2 className="font-semibold text-lg mb-3">Role Overview</h2>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{posting.description}</p>
        </PremiumCard>

        {posting.responsibilities && (
          <PremiumCard className="p-6">
            <h2 className="font-semibold text-lg mb-3">Responsibilities</h2>
            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{posting.responsibilities}</div>
          </PremiumCard>
        )}

        {posting.requirements && (
          <PremiumCard className="p-6">
            <h2 className="font-semibold text-lg mb-3">Requirements</h2>
            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{posting.requirements}</div>
          </PremiumCard>
        )}

        {posting.niceToHave && (
          <PremiumCard className="p-6">
            <h2 className="font-semibold text-lg mb-3">Nice to Have</h2>
            <p className="text-muted-foreground leading-relaxed">{posting.niceToHave}</p>
          </PremiumCard>
        )}

        {posting.growthPath && (
          <PremiumCard className="p-6 border-brand-primary/20 bg-red-50/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              <h2 className="font-semibold text-lg">Growth Path</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{posting.growthPath}</p>
          </PremiumCard>
        )}

        <PremiumCard className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-lg">Ready to apply?</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hiringMode === "active_hiring"
                ? "We are reviewing applications for this role as launch approaches."
                : hiringMode === "future_opening" || hiringMode === "hiring_soon"
                  ? "Join our talent pipeline — this is a future or pre-launch opening."
                  : "Submit your application to join our talent pipeline for this role."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <ButtonLink
              href="/careers#apply"
              variant="outline"
              size="lg"
              onClick={() => scrollToApplySection(posting.id)}
            >
              Apply on careers page
            </ButtonLink>
            <ButtonLink
              href={`/careers/apply/${posting.id}`}
              size="lg"
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              Apply for this Role
            </ButtonLink>
          </div>
        </PremiumCard>
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}
