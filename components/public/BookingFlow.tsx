"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingWizard } from "@/components/public/BookingWizard";
import { HaulingTransportWizard } from "@/components/public/HaulingTransportWizard";
import { EquipmentIntakeWizard } from "@/components/public/EquipmentIntakeWizard";
import type { DivisionId } from "@/lib/divisions";
import { ALL_DIVISION_IDS, getDivision, isEquipmentDivision, parseDivisionId } from "@/lib/divisions";
import { cn } from "@/lib/utils";

const BOOKING_BLURBS: Record<DivisionId, string> = {
  junk_removal: "Clear-outs, furniture, appliances, and property junk removal.",
  hauling: "Equipment, materials, and scheduled transport between locations.",
  land_clearing: "Forestry mulching, brush, lots, and property reclamation — estimate only, no instant price.",
  site_work: "Grading, gravel, dirt work, and driveway maintenance — reviewed after we see the site.",
  equipment_services: "Skid steer, grapple, forks, and equipment-assisted work described in your words.",
};

/** Division-aware public booking. Existing junk/hauling wizards are unchanged. */
export function BookingFlow({
  demoMode = false,
  division: divisionProp,
}: {
  demoMode?: boolean;
  division?: DivisionId;
}) {
  const searchParams = useSearchParams();
  const division: DivisionId = divisionProp ?? parseDivisionId(searchParams.get("division"));
  const config = getDivision(division);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ALL_DIVISION_IDS.map((id) => (
          <Link
            key={id}
            href={`/book?division=${id}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              division === id
                ? "bg-brand-primary text-white"
                : "border border-black/10 bg-white text-foreground hover:border-brand-primary/30"
            )}
          >
            {getDivision(id).shortName}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
          {isEquipmentDivision(division) ? `${config.shortName} estimate` : `Book ${config.shortName}`}
        </h2>
        <p className="mt-2 text-muted-foreground">{BOOKING_BLURBS[division]}</p>
      </div>

      {division === "hauling" ? (
        <HaulingTransportWizard demoMode={demoMode} />
      ) : isEquipmentDivision(division) ? (
        <EquipmentIntakeWizard division={division} />
      ) : (
        <BookingWizard demoMode={demoMode} />
      )}
    </div>
  );
}
