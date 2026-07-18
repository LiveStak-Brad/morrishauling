"use client";

import { SocialFollowButtons } from "@/components/social/SocialFollowButtons";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";
import { cn } from "@/lib/utils";

export function SocialHomeSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-black/5 bg-[#0A0A0A] px-5 py-8 text-white sm:px-8 sm:py-10",
        className
      )}
      aria-labelledby="follow-the-work-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
        Follow the work
      </p>
      <h2
        id="follow-the-work-heading"
        className="mt-2 max-w-3xl font-heading text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl"
      >
        See Real Warrenton Junk Removal Jobs
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
        Follow {WARRENTON_JUNK_SOCIAL.handle} to watch real garage cleanouts, estate cleanouts,
        trailer loads, furniture removals, appliance removals, before-and-after transformations and
        behind-the-scenes videos from throughout Warrenton, Warren County and surrounding Missouri
        communities.
      </p>
      <SocialFollowButtons
        surface="homepage_social"
        className="mt-6 [&_a]:border-white/15 [&_a]:bg-white/10 [&_a]:text-white [&_a]:hover:bg-white/20"
        variant="outline"
        showLabels
      />
      <p className="mt-4 text-xs text-white/45">Operated by {WARRENTON_JUNK_SOCIAL.operator}</p>
    </section>
  );
}
