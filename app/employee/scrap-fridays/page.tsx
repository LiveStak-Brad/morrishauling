"use client";

import { useCallback, useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { MapPin, Navigation, Phone, RefreshCw } from "lucide-react";

type Stop = {
  id: string;
  status: string;
  stop_order: number;
  planned_arrival_start?: string | null;
  planned_arrival_end?: string | null;
  notes?: string | null;
  actual_weight_lb?: number | null;
  scrap_pickup_requests?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address_line1?: string | null;
    city?: string | null;
    zip?: string | null;
    estimated_weight_lb?: number;
    suggested_crew_count?: number;
    suggested_equipment?: string[];
    access?: Record<string, unknown>;
    junk_estimate_interest?: string | null;
    scrap_pickup_items?: Array<{ quantity: number; item_name_snapshot: string }>;
    scrap_pickup_media?: Array<{ id: string; storage_path: string }>;
  } | null;
};

export default function EmployeeScrapFridaysPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/employee/scrap-fridays/stops").then((r) => r.json());
      if (!d.ok) {
        toast.error(d.error || "Failed to load");
        return;
      }
      const routes = d.routes ?? [];
      const flattened: Stop[] = [];
      for (const route of routes) {
        const sorted = [...(route.scrap_route_stops ?? [])].sort(
          (a: Stop, b: Stop) => a.stop_order - b.stop_order
        );
        flattened.push(...sorted);
      }
      setStops(flattened);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetch("/api/employee/scrap-fridays/stops").then((r) => r.json());
        if (cancelled) return;
        if (!d.ok) {
          toast.error(d.error || "Failed to load");
          return;
        }
        const routes = d.routes ?? [];
        const flattened: Stop[] = [];
        for (const route of routes) {
          const sorted = [...(route.scrap_route_stops ?? [])].sort(
            (a: Stop, b: Stop) => a.stop_order - b.stop_order
          );
          flattened.push(...sorted);
        }
        setStops(flattened);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStop = async (
    stopId: string,
    patch: {
      status?: string;
      requestStatus?: string;
      actualWeightLb?: number;
      notes?: string;
      result?: string;
    }
  ) => {
    const res = await fetch("/api/employee/scrap-fridays/stops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stopId, ...patch }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Updated");
      load();
    } else toast.error(data.error || "Failed");
  };

  const active = stops.find((s) => s.id === activeId) ?? null;
  const req = active?.scrap_pickup_requests;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-medium">Scrap Friday route</h1>
          <p className="text-sm text-muted-foreground">Mobile stop workflow</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground animate-pulse">Loading stops…</p>}
      {!loading && stops.length === 0 && (
        <PremiumCard className="p-4 text-sm text-muted-foreground">
          No published Free Scrap Friday routes yet.
        </PremiumCard>
      )}

      <div className="space-y-2">
        {stops.map((stop) => {
          const r = stop.scrap_pickup_requests;
          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => {
                setActiveId(stop.id);
                setActualWeight(String(stop.actual_weight_lb ?? ""));
                setNotes(stop.notes || "");
              }}
              className={`w-full rounded-xl border p-3 text-left ${
                activeId === stop.id ? "border-brand-primary bg-brand-primary/5" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {stop.stop_order}. {r?.first_name} {r?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r?.address_line1}, {r?.city}
                  </p>
                </div>
                <StatusChip label={stop.status} />
              </div>
            </button>
          );
        })}
      </div>

      {active && req && (
        <PremiumCard className="space-y-3 p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold">
                {req.first_name} {req.last_name}
              </p>
              <p className="text-muted-foreground">
                {req.address_line1}, {req.city} {req.zip}
              </p>
            </div>
            <StatusChip label={active.status} />
          </div>

          <div className="flex flex-wrap gap-2">
            {req.phone && (
              <a
                href={`tel:${req.phone}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border px-4 font-medium"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${req.address_line1}, ${req.city} ${req.zip}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-primary px-4 font-medium text-white"
            >
              <Navigation className="h-4 w-4" /> Navigate
            </a>
          </div>

          {(active.planned_arrival_start || active.planned_arrival_end) && (
            <p className="text-xs text-muted-foreground">
              Window: {active.planned_arrival_start || "—"} – {active.planned_arrival_end || "—"}
            </p>
          )}

          <div>
            <p className="font-medium">Items</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {(req.scrap_pickup_items ?? []).map((item, i) => (
                <li key={`${item.item_name_snapshot}-${i}`}>
                  {item.quantity}× {item.item_name_snapshot}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Est. {req.estimated_weight_lb ?? 0} lb · crew {req.suggested_crew_count ?? 2} ·{" "}
            {(req.suggested_equipment ?? []).join(", ") || "standard gear"}
          </p>
          <p className="text-xs text-muted-foreground">
            Junk estimate interest: {req.junk_estimate_interest || "none"} · Photos:{" "}
            {(req.scrap_pickup_media ?? []).length}
          </p>
          {req.access && (
            <p className="rounded-lg bg-muted/50 p-2 text-xs">
              Access: {JSON.stringify(req.access)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11"
              variant="outline"
              onClick={() =>
                void updateStop(active.id, {
                  status: "en_route",
                  requestStatus: "crew_en_route",
                })
              }
            >
              Start travel
            </Button>
            <Button
              className="h-11"
              variant="outline"
              onClick={() =>
                void updateStop(active.id, { status: "arrived", requestStatus: "arrived" })
              }
            >
              <MapPin className="mr-1 h-4 w-4" /> Arrived
            </Button>
            <Button
              className="h-11"
              onClick={() => void updateStop(active.id, { status: "in_progress" })}
            >
              Begin pickup
            </Button>
            <Button
              className="h-11"
              variant="secondary"
              onClick={() =>
                void updateStop(active.id, {
                  status: "completed",
                  requestStatus: "completed",
                  actualWeightLb: actualWeight ? Number(actualWeight) : undefined,
                  notes,
                  result: "completed",
                })
              }
            >
              Complete
            </Button>
            <Button
              className="col-span-2 h-11"
              variant="destructive"
              onClick={() =>
                void updateStop(active.id, {
                  status: "unable",
                  requestStatus: "no_show",
                  notes,
                  result: "unable",
                })
              }
            >
              Unable / no show
            </Button>
          </div>

          <Input
            placeholder="Actual weight (lb)"
            value={actualWeight}
            onChange={(e) => setActualWeight(e.target.value)}
          />
          <Textarea
            placeholder="Internal notes / paid estimate follow-up"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void updateStop(active.id, {
                notes,
                actualWeightLb: actualWeight ? Number(actualWeight) : undefined,
                result: "estimate_interest",
              })
            }
          >
            Save notes / mark estimate interest
          </Button>
        </PremiumCard>
      )}
    </div>
  );
}
