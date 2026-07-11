/**
 * Privacy-conscious analytics event abstraction.
 * Wire GA/Plausible later without rewriting pages.
 */

export type MarketingEventName =
  | "phone_cta_click"
  | "estimate_start"
  | "estimate_complete"
  | "division_select"
  | "service_page_cta"
  | "location_page_cta"
  | "booking_abandon"
  | "facebook_follow_click";

export type MarketingEventPayload = {
  division?: "junk_removal" | "hauling" | "parent";
  path?: string;
  label?: string;
  /** Never include addresses, totals, photos, or PII */
};

type Listener = (name: MarketingEventName, payload: MarketingEventPayload) => void;

const listeners: Listener[] = [];

export function onMarketingEvent(listener: Listener) {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function trackMarketingEvent(
  name: MarketingEventName,
  payload: MarketingEventPayload = {}
) {
  if (typeof window === "undefined") return;
  const safe: MarketingEventPayload = {
    division: payload.division,
    path: payload.path ?? window.location.pathname,
    label: payload.label,
  };
  for (const listener of listeners) {
    try {
      listener(name, safe);
    } catch {
      /* ignore provider errors */
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[marketing-event]", name, safe);
  }
}
