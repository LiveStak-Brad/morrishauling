"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingWizard } from "@/components/public/BookingWizard";
import { HaulingTransportWizard } from "@/components/public/HaulingTransportWizard";
import type { DivisionId } from "@/lib/divisions";
import { getDivision } from "@/lib/divisions";
import { cn } from "@/lib/utils";

/** Division-aware public booking — Junk Removal or Hauling. */
export function BookingFlow({
  demoMode = false,
  division: divisionProp,
}: {
  demoMode?: boolean;
  division?: DivisionId;
}) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("division")?.toLowerCase();
  const division: DivisionId =
    divisionProp ??
    (raw === "hauling" || raw === "hauling_transport" ? "hauling" : "junk_removal");
  const config = getDivision(division);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/book?division=junk_removal"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            division === "junk_removal"
              ? "bg-brand-primary text-white"
              : "border border-black/10 bg-white text-foreground hover:border-brand-primary/30"
          )}
        >
          Junk Removal
        </Link>
        <Link
          href="/book?division=hauling"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            division === "hauling"
              ? "bg-brand-primary text-white"
              : "border border-black/10 bg-white text-foreground hover:border-brand-primary/30"
          )}
        >
          Hauling
        </Link>
      </div>

      <div>
        <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
          Book {config.shortName}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {division === "junk_removal"
            ? "Clear-outs, furniture, appliances, and property junk removal."
            : "Equipment, materials, and scheduled transport between locations."}
        </p>
      </div>

      {division === "hauling" ? (
        <HaulingTransportWizard demoMode={demoMode} />
      ) : (
        <BookingWizard demoMode={demoMode} />
      )}
    </div>
  );
}
