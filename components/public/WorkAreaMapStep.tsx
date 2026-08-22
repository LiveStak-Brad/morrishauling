"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { WorkArea } from "@/lib/land-clearing/acreage";
import { MAP_ACREAGE_DISCLAIMER, squareMetersToAcres } from "@/lib/land-clearing/acreage";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { Button } from "@/components/ui/button";

type LatLngLiteral = { lat: number; lng: number };

type MapsNs = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
    setCenter: (c: LatLngLiteral) => void;
    setZoom: (z: number) => void;
    addListener: (event: string, fn: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
  };
  Polygon: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void; setPath: (p: unknown) => void };
  LatLng: new (lat: number, lng: number) => unknown;
  Geocoder?: new () => {
    geocode: (
      req: { address: string },
      cb: (results: Array<{ geometry: { location: { lat: () => number; lng: () => number } } }> | null, status: string) => void
    ) => void;
  };
  geometry?: { spherical: { computeArea: (path: unknown[]) => number } };
};

async function loadGeometry(): Promise<MapsNs | null> {
  const w = window as unknown as {
    google?: { maps?: MapsNs & { importLibrary?: (n: string) => Promise<unknown> } };
  };
  if (w.google?.maps?.importLibrary) {
    await w.google.maps.importLibrary("maps");
    await w.google.maps.importLibrary("geometry");
    return w.google.maps;
  }
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return null;
  await new Promise<void>((resolve, reject) => {
    if (w.google?.maps) {
      resolve();
      return;
    }
    const cb = `__morrisGeom_${Date.now()}`;
    (window as unknown as Record<string, unknown>)[cb] = () => {
      delete (window as unknown as Record<string, unknown>)[cb];
      resolve();
    };
    const script = document.createElement("script");
    script.dataset.morrisMaps = "1";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=maps,geometry,places&callback=${cb}&v=weekly`;
    script.onerror = () => reject(new Error("maps"));
    document.head.appendChild(script);
  });
  if (w.google?.maps?.importLibrary) {
    await w.google.maps.importLibrary("geometry");
  }
  return w.google?.maps ?? null;
}

export function WorkAreaMapStep({
  address,
  onAreasChange,
}: {
  address?: string;
  onAreasChange: (areas: WorkArea[], acres: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [points, setPoints] = useState<LatLngLiteral[]>([]);
  const [acres, setAcres] = useState(0);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<MapsNs | null>(null);
  const polyRef = useRef<{ setPath: (p: unknown) => void; setMap: (m: unknown) => void } | null>(null);
  const mapRef = useRef<InstanceType<MapsNs["Map"]> | null>(null);
  const onChangeRef = useRef(onAreasChange);
  const completedRef = useRef(false);
  const labelId = useId();
  onChangeRef.current = onAreasChange;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    trackMarketingEvent("map_area_started", { division: "land_clearing" });
    loadGeometry()
      .then((maps) => {
        if (cancelled || !maps || !mapEl.current) {
          if (!maps) setError("Map drawing is not available in this environment. Enter acreage instead.");
          return;
        }
        mapsRef.current = maps;
        const map = new maps.Map(mapEl.current, {
          center: { lat: 38.8114, lng: -91.1415 },
          zoom: 16,
          mapTypeId: "hybrid",
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        const poly = new maps.Polygon({
          strokeColor: "#9B1B30",
          fillColor: "#9B1B30",
          fillOpacity: 0.25,
          map,
        });
        polyRef.current = poly;
        map.addListener("click", (e) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (lat == null || lng == null) return;
          setPoints((prev) => [...prev, { lat, lng }]);
        });
        setReady(true);
      })
      .catch(() => setError("Map drawing is not available. Enter acreage instead."));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!open || !ready || !maps || !map || !address?.trim() || !maps.Geocoder) return;
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address: address.trim() }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return;
      map.setCenter({
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng(),
      });
      map.setZoom(17);
    });
  }, [address, open, ready]);

  useEffect(() => {
    const maps = mapsRef.current;
    if (!maps || !polyRef.current) return;
    const path = points.map((p) => new maps.LatLng(p.lat, p.lng));
    polyRef.current.setPath(path);
    let next = 0;
    if (points.length >= 3 && maps.geometry?.spherical) {
      const closed = [...path, path[0]];
      next = squareMetersToAcres(maps.geometry.spherical.computeArea(closed));
    }
    setAcres(next);
    if (points.length >= 3 && next > 0) {
      const area: WorkArea = {
        id: "area-1",
        label: "Work area",
        geometry: {
          type: "Polygon",
          coordinates: [[...points.map((p) => [p.lng, p.lat] as number[]), [points[0].lng, points[0].lat]]],
        },
        acres: next,
      };
      onChangeRef.current([area], next);
      if (!completedRef.current) {
        completedRef.current = true;
        trackMarketingEvent("map_area_completed", { division: "land_clearing", label: String(next) });
      }
    }
  }, [points]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="min-h-11 text-left text-sm font-semibold text-brand-primary hover:underline"
        aria-expanded={open}
        aria-controls={labelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide map outline" : "Optional: outline the work area on a map"}
      </button>
      {open ? (
        <div id={labelId} className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Tap to drop points around the area. Three or more points make a shape. {MAP_ACREAGE_DISCLAIMER}
          </p>
          {error ? <p className="text-xs text-muted-foreground">{error}</p> : null}
          <div
            ref={mapEl}
            className="h-64 w-full overflow-hidden rounded-xl border border-black/10 bg-[#1a1412]"
            role="application"
            aria-label="Approximate work area map"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full"
              onClick={() => {
                completedRef.current = false;
                setPoints([]);
                setAcres(0);
                onChangeRef.current([], 0);
              }}
            >
              Clear outline
            </Button>
            {ready && acres > 0 ? (
              <p className="text-sm font-medium">Approximate selected area: {acres.toFixed(2)} acres</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
