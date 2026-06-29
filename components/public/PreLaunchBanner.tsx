import { AlertTriangle, Eye } from "lucide-react";
import { BOOKING_PREVIEW_BANNER } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

export function PreLaunchBanner({
  compact = false,
  variant = "default",
}: {
  compact?: boolean;
  variant?: "default" | "preview";
}) {
  const isPreview = variant === "preview";

  return (
    <div
      className={cn(
        isPreview
          ? "border-b-2 border-amber-400 bg-amber-100 text-amber-950"
          : "border-b border-amber-200 bg-amber-50 text-amber-950",
        compact ? "rounded-xl border px-4 py-3 text-sm" : "px-4 py-3 text-sm"
      )}
      role="status"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2.5">
        {isPreview ? (
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        )}
        <p className="leading-relaxed">
          {isPreview ? (
            <span className="font-semibold">{BOOKING_PREVIEW_BANNER}</span>
          ) : (
            <>
              <span className="font-semibold">
                Morris Hauling &amp; Junk Removal is preparing for launch.
              </span>{" "}
              Online booking is not yet live.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
