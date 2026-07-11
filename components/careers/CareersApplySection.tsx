"use client";

import { useEffect, useState } from "react";
import { ApplicationForm } from "@/components/hr/ApplicationForm";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HIRING_MODE_LABELS } from "@/lib/careers/constants";
import { isTalentPoolPosting } from "@/lib/careers/resolve-postings";
import type { JobPosting } from "@/types/hr/ats";

interface CareersApplySectionProps {
  postings: JobPosting[];
  selectedPostingId?: string;
}

export function CareersApplySection({ postings, selectedPostingId }: CareersApplySectionProps) {
  const [selectedId, setSelectedId] = useState(
    selectedPostingId ?? postings[0]?.id ?? ""
  );
  const selected = postings.find((p) => p.id === selectedId) ?? postings[0];

  useEffect(() => {
    if (selectedPostingId) setSelectedId(selectedPostingId);
  }, [selectedPostingId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ postingId: string }>).detail;
      if (detail?.postingId) setSelectedId(detail.postingId);
    };
    window.addEventListener("careers:select-posting", handler);
    return () => window.removeEventListener("careers:select-posting", handler);
  }, []);

  if (!selected || postings.length === 0) {
    return (
      <section id="apply" className="py-14 sm:py-16 bg-[#F8F9FB] scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4 text-center text-muted-foreground">
          Loading application form…
        </div>
      </section>
    );
  }

  const talentPool = isTalentPoolPosting(selected);
  const hiringMode = selected.hiringMode ?? "future_opening";

  return (
    <section id="apply" className="py-14 sm:py-16 bg-[#F8F9FB] scroll-mt-24 border-t">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A]">
            Apply to Join Morris Junk Removal
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Apply for a current role or submit your information for future opportunities.
          </p>
        </div>

        <PremiumCard className="p-4 sm:p-6 mb-6 border-2 border-brand-primary/15 shadow-md">
          <Label className="text-sm font-semibold">Position interested in</Label>
          <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
            <SelectTrigger className="mt-2 h-11">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {postings.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {talentPool && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <Badge variant="outline" className="border-amber-400 text-amber-900 bg-amber-100">
                Future opportunity / talent pool
              </Badge>
              <span className="text-sm text-amber-900/80">
                {HIRING_MODE_LABELS[hiringMode]} — we&apos;ll keep your application on file as we grow.
              </span>
            </div>
          )}
        </PremiumCard>

        <ApplicationForm key={selected.id} posting={selected} />
      </div>
    </section>
  );
}
