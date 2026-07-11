import { isPublicPrelaunch } from "@/lib/public-site";

/**
 * Only renders during emergency APP_STATUS=prelaunch freeze.
 * Operational sites never show this banner.
 */
export function PreLaunchBanner({
  compact = false,
  variant = "default",
}: {
  compact?: boolean;
  variant?: "default" | "preview";
}) {
  if (!isPublicPrelaunch()) return null;

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          : "border-b border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950"
      }
      role="status"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold">
          {variant === "preview"
            ? "Booking is temporarily frozen."
            : "Online booking is temporarily unavailable. Please call us to schedule."}
        </p>
      </div>
    </div>
  );
}
