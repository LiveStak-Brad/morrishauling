"use client";

import { useEffect, useRef, useState } from "react";
import type { VerifiedAddress } from "@/types/address";
import { isAddressVerified } from "@/types/address";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AutocompleteInstance = {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => {
    place_id?: string;
    geometry?: { location?: { lat: () => number; lng: () => number } };
  };
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (name: string) => Promise<{
        Autocomplete: new (
          input: HTMLInputElement,
          opts?: Record<string, unknown>
        ) => AutocompleteInstance;
      }>;
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          opts?: Record<string, unknown>
        ) => AutocompleteInstance;
      };
      event?: { clearInstanceListeners?: (instance: unknown) => void };
    };
  };
  gm_authFailure?: () => void;
  __morrisMapsPromise?: Promise<void>;
};

function getAutocompleteCtor():
  | (new (input: HTMLInputElement, opts?: Record<string, unknown>) => AutocompleteInstance)
  | null {
  const w = window as GoogleMapsWindow;
  return w.google?.maps?.places?.Autocomplete ?? null;
}

async function ensurePlacesLibrary(): Promise<void> {
  const w = window as GoogleMapsWindow;
  if (getAutocompleteCtor()) return;

  if (w.google?.maps?.importLibrary) {
    await w.google.maps.importLibrary("places");
    if (getAutocompleteCtor()) return;
  }

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (getAutocompleteCtor()) return;
    await new Promise((r) => setTimeout(r, 75));
  }

  throw new Error(
    "Google Places is not available. Enable Maps JavaScript API + Places API, and allow this site on the browser key referrers."
  );
}

function loadMapsScript(apiKey: string): Promise<void> {
  const w = window as GoogleMapsWindow;
  if (getAutocompleteCtor()) return Promise.resolve();
  if (w.__morrisMapsPromise) return w.__morrisMapsPromise;

  w.__morrisMapsPromise = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      w.__morrisMapsPromise = undefined;
      reject(new Error(message));
    };

    w.gm_authFailure = () => {
      fail(
        "Google Maps rejected this API key for this site. Check HTTP referrer restrictions include www.morris-services.com/* and that Maps JavaScript API is enabled."
      );
    };

    const existing = document.querySelector<HTMLScriptElement>("script[data-morris-maps='1']");
    if (existing) {
      void ensurePlacesLibrary().then(resolve).catch(fail);
      return;
    }

    const callbackName = `__morrisMapsReady_${Date.now()}`;
    let settled = false;
    const succeed = () => {
      if (settled) return;
      settled = true;
      void ensurePlacesLibrary().then(resolve).catch(fail);
    };
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      succeed();
    };

    const script = document.createElement("script");
    script.dataset.morrisMaps = "1";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&callback=${callbackName}&v=weekly`;
    script.onerror = () =>
      fail(
        "Could not load the Google Maps script. Check network, ad blockers, and API key restrictions."
      );
    document.head.appendChild(script);

    window.setTimeout(() => {
      if (!settled && !getAutocompleteCtor()) {
        fail(
          "Timed out loading Google Places. Confirm Maps JavaScript API and Places API are enabled for this key."
        );
      }
    }, 20000);
  });

  return w.__morrisMapsPromise;
}

export type VerifiedAddressFieldProps = {
  id?: string;
  label?: string;
  value: VerifiedAddress | null;
  onChange: (addr: VerifiedAddress | null) => void;
  disabled?: boolean;
  className?: string;
  showUnitField?: boolean;
  serviceAreaMessage?: string | null;
};

export function VerifiedAddressField({
  id = "verified-address",
  label = "Service address",
  value,
  onChange,
  disabled,
  className,
  showUnitField = true,
  serviceAreaMessage,
}: VerifiedAddressFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState(value?.formattedAddress ?? "");
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Address verification is unavailable. Please call Morris Services to book, or try again later."
      );
      return;
    }

    let alive = true;

    async function handlePlaceSelected(place: {
      place_id?: string;
      formatted_address?: string;
      geometry?: { location?: { lat: () => number; lng: () => number } };
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
    }) {
      if (!place.place_id) {
        setLocalError("Please select an address from the suggestions.");
        onChangeRef.current(null);
        return;
      }
      setVerifying(true);
      setLocalError(null);
      try {
        const { verifiedAddressFromPlace } = await import("@/lib/geo/place-to-address");
        let parsedFromAutocomplete: VerifiedAddress | null = null;
        try {
          parsedFromAutocomplete = verifiedAddressFromPlace(place, {
            line2: valueRef.current?.line2,
          });
        } catch {
          parsedFromAutocomplete = null;
        }

        // Prefer server Places Details when a server key is configured.
        // Browser keys with HTTP referrer restrictions cannot call Places Details.
        const res = await fetch("/api/geo/verify-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placeId: place.place_id,
            line2: valueRef.current?.line2,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            line1: parsedFromAutocomplete?.line1,
            city: parsedFromAutocomplete?.city,
            state: parsedFromAutocomplete?.state,
            zip: parsedFromAutocomplete?.zip,
            formattedAddress: parsedFromAutocomplete?.formattedAddress,
          }),
        });
        const data = await res.json();
        if (data.ok && data.address) {
          const addr = data.address as VerifiedAddress;
          if (valueRef.current?.line2) addr.line2 = valueRef.current.line2;
          onChangeRef.current(addr);
          setQuery(addr.formattedAddress);
          setLocalError(null);
          return;
        }

        if (!parsedFromAutocomplete) {
          throw new Error(data.error ?? "Verification failed");
        }
        onChangeRef.current(parsedFromAutocomplete);
        setQuery(parsedFromAutocomplete.formattedAddress);
        setLocalError(null);
      } catch (e) {
        try {
          const { verifiedAddressFromPlace } = await import("@/lib/geo/place-to-address");
          const addr = verifiedAddressFromPlace(place, { line2: valueRef.current?.line2 });
          onChangeRef.current(addr);
          setQuery(addr.formattedAddress);
          setLocalError(null);
        } catch (parseErr) {
          onChangeRef.current(null);
          setLocalError(
            parseErr instanceof Error
              ? parseErr.message
              : e instanceof Error
                ? e.message
                : "Could not verify address"
          );
        }
      } finally {
        setVerifying(false);
      }
    }

    void (async () => {
      try {
        await loadMapsScript(apiKey);
        if (!alive) return;

        // Wait a tick so the input ref is attached after enablement
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (!alive) return;

        const input = inputRef.current;
        const Autocomplete = getAutocompleteCtor();
        if (!input || !Autocomplete) {
          setLoadError(
            "Address search loaded, but the input was not ready. Please refresh the page."
          );
          return;
        }

        if (autocompleteRef.current) {
          const w = window as GoogleMapsWindow;
          w.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
        }

        const ac = new Autocomplete(input, {
          fields: ["place_id", "formatted_address", "geometry", "address_components", "types"],
          componentRestrictions: { country: "us" },
          types: ["address"],
        });
        ac.addListener("place_changed", () => {
          void handlePlaceSelected(ac.getPlace());
        });
        autocompleteRef.current = ac;
        setLoadError(null);
        setReady(true);
      } catch (err: unknown) {
        if (!alive) return;
        setReady(false);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Could not load address search. Please refresh and try again."
        );
      }
    })();

    return () => {
      alive = false;
      if (autocompleteRef.current) {
        const w = window as GoogleMapsWindow;
        w.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (value?.formattedAddress) setQuery(value.formattedAddress);
  }, [value?.formattedAddress]);

  const clear = () => {
    onChange(null);
    setQuery("");
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const verified = isAddressVerified(value);

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative mt-1.5">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            ref={inputRef}
            className="h-11 rounded-xl pl-9 pr-10"
            placeholder={apiKey ? "Start typing and select an address…" : "Address search unavailable"}
            value={query}
            disabled={disabled || !apiKey || Boolean(loadError)}
            onChange={(e) => {
              setQuery(e.target.value);
              if (verified) onChange(null);
              setLocalError(null);
            }}
            autoComplete="off"
          />
          {(query || verified) && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
              onClick={clear}
              aria-label="Clear address"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Select a suggested address — typing alone is not enough to continue.
        </p>
      </div>

      {verifying && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying address…
        </p>
      )}

      {loadError && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {loadError}
        </p>
      )}

      {localError && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {localError}
        </p>
      )}

      {verified && value && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Verified address
          </p>
          <p className="mt-1">{value.formattedAddress}</p>
          {serviceAreaMessage && (
            <p className="mt-2 text-xs text-amber-900">{serviceAreaMessage}</p>
          )}
        </div>
      )}

      {showUnitField && verified && value && (
        <div>
          <Label htmlFor={`${id}-unit`}>Apartment / suite / unit / gate (optional)</Label>
          <Input
            id={`${id}-unit`}
            className="mt-1.5 h-11 rounded-xl"
            placeholder="Apt 2B, Suite 100, Gate code…"
            value={value.line2 ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...value,
                line2: e.target.value.trim() ? e.target.value : undefined,
              })
            }
          />
        </div>
      )}

      {!ready && apiKey && !loadError ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading address search…
        </p>
      ) : null}

      {!apiKey ? (
        <p className="text-xs text-amber-800">
          Browser Maps key missing from this deployment (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
        </p>
      ) : null}
    </div>
  );
}
