"use client";

import Script from "next/script";

/** Public GA4 measurement ID (safe to expose in the browser). */
export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "G-TPFMFZ1DEE";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Loads Google Analytics 4 (gtag.js) site-wide.
 * Skips when analytics is explicitly disabled via NEXT_PUBLIC_ANALYTICS_PROVIDER=off.
 */
export function GoogleAnalytics() {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim().toLowerCase();
  if (provider === "off" || provider === "none" || provider === "plausible") {
    return null;
  }
  if (!GA4_MEASUREMENT_ID.startsWith("G-")) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-gtag" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
