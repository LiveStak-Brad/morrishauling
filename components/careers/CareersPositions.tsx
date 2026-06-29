"use client";

import { useMemo, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  CAREER_CATEGORIES,
  HIRING_MODE_LABELS,
  HIRING_MODE_VARIANT,
} from "@/lib/careers/constants";
import { formatEmploymentType, formatPayRange } from "@/lib/careers/format";
import { scrollToApplySection } from "@/lib/careers/resolve-postings";
import { PRELAUNCH_CAREERS_PAY_NOTE } from "@/lib/public-copy";
import type { CareerCategory, JobPosting } from "@/types/hr/ats";
import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

interface CareersPositionsProps {
  postings: JobPosting[];
}

export function CareersPositions({ postings }: CareersPositionsProps) {
  const [activeCategory, setActiveCategory] = useState<CareerCategory | "all">("all");

  const rolePostings = useMemo(
    () => postings.filter((p) => p.slug !== "general-interest"),
    [postings]
  );

  const filtered = useMemo(() => {
    if (activeCategory === "all") return rolePostings;
    return rolePostings.filter((p) => p.category === activeCategory);
  }, [activeCategory, rolePostings]);

  const generalPosting = postings.find((p) => p.slug === "general-interest");

  return (
    <section id="positions" className="py-14 sm:py-16 bg-white scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">Open &amp; Future Roles</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Build your talent profile for current and future openings. Roles marked &quot;Future
            opening&quot; or &quot;Accepting interest&quot; are part of our pre-launch hiring pipeline.
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-2xl mx-auto">{PRELAUNCH_CAREERS_PAY_NOTE}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === "all"
                ? "bg-brand-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All Roles
          </button>
          {CAREER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-brand-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No roles in this category.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((posting) => (
              <PositionCard key={posting.id} posting={posting} />
            ))}
          </div>
        )}

        {generalPosting && (
          <PremiumCard className="mt-8 p-6 sm:p-8 border-2 border-brand-primary/20 bg-gradient-to-br from-white to-red-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">General Application</Badge>
                <h3 className="text-xl font-semibold">{generalPosting.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  {generalPosting.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <ButtonLink href={`/careers/jobs/${generalPosting.slug}`} variant="outline" size="lg">
                  View Details
                </ButtonLink>
                <Button
                  type="button"
                  size="lg"
                  className="bg-brand-primary text-white hover:bg-brand-primary/90"
                  onClick={() => scrollToApplySection(generalPosting.id)}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PremiumCard>
        )}
      </div>
    </section>
  );
}

function PositionCard({ posting }: { posting: JobPosting }) {
  const hiringMode = posting.hiringMode ?? "future_opening";

  return (
    <PremiumCard className="p-5 h-full flex flex-col border border-black/5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
            {posting.departmentLabel ?? "Morris Hauling"}
          </p>
          <h3 className="text-lg font-bold mt-1 text-[#0A0A0A]">{posting.title}</h3>
        </div>
        <Badge variant={HIRING_MODE_VARIANT[hiringMode]} className="shrink-0 text-xs">
          {HIRING_MODE_LABELS[hiringMode]}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
        {posting.description}
      </p>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {posting.schedule && (
          <p className="flex items-start gap-2">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-brand-primary" />
            <span>{posting.schedule}</span>
          </p>
        )}
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-brand-primary" />
          <span>{formatEmploymentType(posting.employmentType)} · {formatPayRange(posting, { prelaunch: true })}</span>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t flex gap-2">
        <ButtonLink
          href={`/careers/jobs/${posting.slug}`}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          View Details
        </ButtonLink>
        <Button
          type="button"
          size="sm"
          className="flex-1 bg-brand-primary text-white hover:bg-brand-primary/90"
          onClick={() => scrollToApplySection(posting.id)}
        >
          Apply
        </Button>
      </div>
    </PremiumCard>
  );
}
