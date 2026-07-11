import type { Job } from "@/types/job";
import {
  formatMaterialHandlingSummary,
} from "@/lib/disposal/material-handling-outcomes";
import { PremiumCard } from "@/components/morris/PremiumCard";

/** Shows staff-recorded handling outcomes only — never guesses. */
export function MaterialHandlingSummary({ job }: { job: Job }) {
  const lines = formatMaterialHandlingSummary(
    job.junkRemovalDetails?.materialHandlingOutcomes
  );
  if (!lines.length) return null;

  return (
    <PremiumCard className="p-5">
      <h3 className="font-bold">Material Handling Summary</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Recorded after the job — based on what our crew documented.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {lines.map((line) => (
          <li key={`${line.label}-${line.outcomeLabel}`} className="flex justify-between gap-3">
            <span className="text-muted-foreground">{line.label}</span>
            <span className="font-medium text-foreground">{line.outcomeLabel}</span>
          </li>
        ))}
      </ul>
    </PremiumCard>
  );
}
