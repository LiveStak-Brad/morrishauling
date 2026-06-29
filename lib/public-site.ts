/**
 * Public website helpers — umbrella brand vs operating company pages.
 */

export type AppStatus = "prelaunch" | "live";

/** Deployment mode. Defaults to prelaunch when unset. */
export function getAppStatus(): AppStatus {
  const status = process.env.APP_STATUS?.toLowerCase();
  return status === "live" ? "live" : "prelaunch";
}

export function isPrelaunch(): boolean {
  return getAppStatus() === "prelaunch";
}

/** Client-visible prelaunch check (set NEXT_PUBLIC_APP_STATUS=prelaunch in Vercel). */
export function isPublicPrelaunch(): boolean {
  if (process.env.NEXT_PUBLIC_APP_STATUS === "live") return false;
  if (process.env.NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING === "true") return false;
  if (process.env.APP_STATUS === "live") return false;
  return true;
}

export function isBookingSubmissionAllowed(): boolean {
  if (isPrelaunch()) return false;
  return (
    process.env.ALLOW_PUBLIC_BOOKING === "true" ||
    process.env.NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING === "true"
  );
}

export function isBookingDemoMode(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): boolean {
  const preview = searchParams.get("preview");
  return preview === "1" || preview === "demo" || preview === "true";
}

export const PUBLIC_BOOKING_CLOSED_MESSAGE =
  "Online booking is not yet live. Morris Hauling & Junk Removal is preparing for launch.";
