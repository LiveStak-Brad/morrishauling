"use client";

import { SocialFollowButtons } from "@/components/social/SocialFollowButtons";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export function BookingSocialUpsell() {
  return (
    <div className="rounded-xl border border-black/5 bg-[#F7F5F2] p-4 sm:p-5">
      <h4 className="text-base font-semibold tracking-tight">
        Follow {WARRENTON_JUNK_SOCIAL.handle} while you wait
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Watch real cleanouts, load sizes, pricing examples, and before &amp; after videos from
        Warrenton and nearby communities — operated by {WARRENTON_JUNK_SOCIAL.operator}.
      </p>
      <SocialFollowButtons
        surface="booking_social"
        className="mt-3"
        variant="outline"
        size="sm"
        showLabels={false}
      />
    </div>
  );
}
