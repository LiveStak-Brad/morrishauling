"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import {
  routeCapacityWarnings,
  summarizeRouteCapacity,
} from "@/lib/scrap-fridays/calc";
import {
  CalendarDays,
  MapPin,
  Recycle,
  RefreshCw,
  Route,
  ClipboardList,
} from "lucide-react";

type Tab = "overview" | "requests" | "dates" | "routes" | "tickets" | "analytics";

type ScrapRequest = {
  id: string;
  status: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  city?: string | null;
  zip?: string | null;
  estimated_weight_lb?: number;
  estimated_volume_cuft?: number;
  estimated_stop_minutes?: number;
  difficulty_score?: number;
  suggested_crew_count?: number;
  suggested_equipment?: string[];
  route_units?: number;
  junk_estimate_interest?: string | null;
  estimate_id?: string | null;
  internal_notes?: string | null;
  customer_notes?: string | null;
  availability?: Record<string, unknown>;
  access?: Record<string, unknown>;
  scrap_friday_date_id?: string | null;
  scrap_pickup_items?: Array<Record<string, unknown>>;
  scrap_pickup_media?: Array<Record<string, unknown>>;
};

type FridayDate = {
  id: string;
  route_date: string;
  status: string;
  max_route_units: number;
  max_weight_lb: number;
  max_volume_cuft: number;
  max_labor_minutes: number;
  notes?: string | null;
};

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "requests", label: "Requests" },
  { id: "dates", label: "Fridays" },
  { id: "routes", label: "Route builder" },
  { id: "tickets", label: "Recycling" },
  { id: "analytics", label: "Analytics" },
];

export default function AdminScrapFridaysPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ScrapRequest[]>([]);
  const [dates, setDates] = useState<FridayDate[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScrapRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [fridayId, setFridayId] = useState<string>("");
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ id?: string; status?: string } | null>(null);
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([]);
  const [newDate, setNewDate] = useState("");
  const [ticketForm, setTicketForm] = useState({
    recyclingCenter: "",
    netWeightLb: "",
    scrapRevenue: "",
    batteryCount: "",
    fuelCost: "",
    laborCost: "",
    notes: "",
  });

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    try {
      const [r, d, a] = await Promise.all([
        fetch("/api/admin/scrap-fridays/requests").then((x) => x.json()),
        fetch("/api/admin/scrap-fridays/dates").then((x) => x.json()),
        fetch("/api/admin/scrap-fridays/analytics").then((x) => x.json()),
      ]);
      if (r.ok) setRequests(r.requests ?? []);
      if (d.ok) {
        setDates(d.dates ?? []);
        setFridayId((prev) => prev || d.dates?.[0]?.id || "");
      }
      if (a.ok) setStats(a.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, d, a] = await Promise.all([
          fetch("/api/admin/scrap-fridays/requests").then((x) => x.json()),
          fetch("/api/admin/scrap-fridays/dates").then((x) => x.json()),
          fetch("/api/admin/scrap-fridays/analytics").then((x) => x.json()),
        ]);
        if (cancelled) return;
        if (r.ok) setRequests(r.requests ?? []);
        if (d.ok) {
          setDates(d.dates ?? []);
          setFridayId((prev) => prev || d.dates?.[0]?.id || "");
        }
        if (a.ok) setStats(a.stats ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    const res = await fetch(`/api/admin/scrap-fridays/requests?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data.ok) {
      setDetail(data.request);
      setNotes(data.request.internal_notes || "");
    } else toast.error(data.error || "Failed to load");
  };

  const patchRequest = async (patch: Record<string, unknown>) => {
    if (!selectedId) return;
    const res = await fetch("/api/admin/scrap-fridays/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId, ...patch }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Updated");
      setDetail(data.request);
      void load();
    } else toast.error(data.error || "Update failed");
  };

  const createFriday = async () => {
    if (!newDate) return;
    const res = await fetch("/api/admin/scrap-fridays/dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route_date: newDate, status: "open" }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Friday opened");
      setNewDate("");
      void load();
    } else toast.error(data.error || "Failed");
  };

  const loadRoute = async (id: string) => {
    setFridayId(id);
    const [routeRes, reqRes] = await Promise.all([
      fetch(`/api/admin/scrap-fridays/routes?fridayId=${encodeURIComponent(id)}`).then((r) =>
        r.json()
      ),
      fetch(
        `/api/admin/scrap-fridays/requests?status=approved&fridayId=${encodeURIComponent(id)}`
      ).then((r) => r.json()),
    ]);
    if (routeRes.ok) {
      setRouteMeta({ id: routeRes.route?.id, status: routeRes.route?.status });
      const stops = (routeRes.route?.scrap_route_stops ?? [])
        .sort((a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order)
        .map((s: { request_id?: string | null }) => s.request_id)
        .filter(Boolean) as string[];
      setRouteStops(stops);
      if (routeRes.route?.id) {
        const t = await fetch(
          `/api/admin/scrap-fridays/tickets?routeId=${encodeURIComponent(routeRes.route.id)}`
        ).then((r) => r.json());
        if (t.ok) setTickets(t.tickets ?? []);
      }
    }
    if (reqRes.ok && routeStops.length === 0) {
      // keep existing stops if already set
    }
  };

  useEffect(() => {
    if (tab !== "routes" || !fridayId) return;
    let cancelled = false;
    (async () => {
      const routeRes = await fetch(
        `/api/admin/scrap-fridays/routes?fridayId=${encodeURIComponent(fridayId)}`
      ).then((r) => r.json());
      if (cancelled || !routeRes.ok) return;
      setRouteMeta({ id: routeRes.route?.id, status: routeRes.route?.status });
      const stops = (routeRes.route?.scrap_route_stops ?? [])
        .sort((a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order)
        .map((s: { request_id?: string | null }) => s.request_id)
        .filter(Boolean) as string[];
      setRouteStops(stops);
      if (routeRes.route?.id) {
        const t = await fetch(
          `/api/admin/scrap-fridays/tickets?routeId=${encodeURIComponent(routeRes.route.id)}`
        ).then((r) => r.json());
        if (!cancelled && t.ok) setTickets(t.tickets ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, fridayId]);

  const approvedForRoute = useMemo(() => {
    return requests.filter(
      (r) =>
        ["approved", "waitlisted", "scheduled", "confirmed_by_customer"].includes(r.status) &&
        (!r.scrap_friday_date_id || r.scrap_friday_date_id === fridayId)
    );
  }, [requests, fridayId]);

  const capacity = useMemo(() => {
    const friday = dates.find((d) => d.id === fridayId);
    const selected = routeStops
      .map((id) => requests.find((r) => r.id === id))
      .filter(Boolean) as ScrapRequest[];
    const usage = summarizeRouteCapacity(
      selected.map((r) => ({
        routeUnits: Number(r.route_units ?? 0),
        estimatedWeightLb: Number(r.estimated_weight_lb ?? 0),
        estimatedVolumeCuft: Number(r.estimated_volume_cuft ?? 0),
        estimatedStopMinutes: Number(r.estimated_stop_minutes ?? 0),
        difficultyScore: Number(r.difficulty_score ?? 0),
      }))
    );
    const warnings = friday
      ? routeCapacityWarnings(usage, {
          maxRouteUnits: Number(friday.max_route_units),
          maxWeightLb: Number(friday.max_weight_lb),
          maxVolumeCuft: Number(friday.max_volume_cuft),
          maxLaborMinutes: Number(friday.max_labor_minutes),
        })
      : [];
    return { usage, warnings, friday };
  }, [routeStops, requests, dates, fridayId]);

  const saveRoute = async (publish: boolean) => {
    if (!fridayId) return;
    const res = await fetch("/api/admin/scrap-fridays/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fridayId,
        publish,
        stops: routeStops.map((requestId, i) => ({
          requestId,
          stopOrder: i + 1,
        })),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(publish ? "Route published" : "Route saved");
      setRouteMeta({ id: data.route?.id, status: data.route?.status });
      void load();
    } else toast.error(data.error || "Failed");
  };

  const saveTicket = async () => {
    if (!routeMeta?.id) {
      toast.error("Save a route first");
      return;
    }
    const res = await fetch("/api/admin/scrap-fridays/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId: routeMeta.id,
        recyclingCenter: ticketForm.recyclingCenter || undefined,
        netWeightLb: ticketForm.netWeightLb ? Number(ticketForm.netWeightLb) : undefined,
        scrapRevenue: ticketForm.scrapRevenue ? Number(ticketForm.scrapRevenue) : undefined,
        batteryCount: ticketForm.batteryCount ? Number(ticketForm.batteryCount) : undefined,
        fuelCost: ticketForm.fuelCost ? Number(ticketForm.fuelCost) : undefined,
        laborCost: ticketForm.laborCost ? Number(ticketForm.laborCost) : undefined,
        notes: ticketForm.notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Ticket saved");
      setTickets((prev) => [data.ticket, ...prev]);
      setTicketForm({
        recyclingCenter: "",
        netWeightLb: "",
        scrapRevenue: "",
        batteryCount: "",
        fuelCost: "",
        laborCost: "",
        notes: "",
      });
      void load();
    } else toast.error(data.error || "Failed");
  };

  const queue = requests.filter((r) =>
    ["submitted", "under_review", "more_info_needed"].includes(r.status)
  );

  return (
    <AdminPageShell
      title="Free Scrap Fridays"
      description="Review pickup requests, plan Friday routes, and track recycling revenue"
      action={
        <div className="flex gap-2">
          <Link
            href="/free-scrap-fridays"
            target="_blank"
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Public page
          </Link>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-brand-primary text-white"
                : "border border-border bg-white hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>}

      {tab === "overview" && stats && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Submitted" value={stats.requestsSubmitted ?? 0} icon={ClipboardList} />
            <StatCard label="In review queue" value={queue.length} icon={MapPin} />
            <StatCard label="Completed" value={stats.completed ?? 0} icon={Route} />
            <StatCard label="Scrap revenue" value={`$${Number(stats.scrapRevenue ?? 0).toFixed(0)}`} icon={Recycle} />
          </div>
          <PremiumCard className="p-4">
            <h2 className="font-semibold">Next actions</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Review {queue.length} open request(s)</li>
              <li>• Open upcoming Fridays and set capacity</li>
              <li>• Build and publish a Friday route for crew</li>
              <li>
                Crew view:{" "}
                <Link href="/employee/scrap-fridays" className="text-brand-primary underline">
                  /employee/scrap-fridays
                </Link>
              </li>
            </ul>
          </PremiumCard>
        </div>
      )}

      {tab === "requests" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-2">
            {requests
              .filter((r) => r.status !== "draft")
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => void openDetail(r.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedId === r.id ? "border-brand-primary bg-brand-primary/5" : "bg-white hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {r.first_name} {r.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.address_line1}, {r.city} {r.zip}
                      </p>
                    </div>
                    <StatusChip label={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ~{r.estimated_weight_lb ?? 0} lb · {r.route_units ?? 0} units · crew{" "}
                    {r.suggested_crew_count ?? 2}
                  </p>
                </button>
              ))}
            {requests.filter((r) => r.status !== "draft").length === 0 && (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            )}
          </div>

          <PremiumCard className="p-4">
            {!detail ? (
              <p className="text-sm text-muted-foreground">Select a request to review.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {detail.first_name} {detail.last_name}
                  </h2>
                  <StatusChip label={detail.status} />
                </div>
                <p>
                  {detail.address_line1}, {detail.city} {detail.zip}
                </p>
                <p>
                  <a href={`tel:${detail.phone}`} className="text-brand-primary underline">
                    {detail.phone}
                  </a>{" "}
                  · {detail.email}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">Weight: {detail.estimated_weight_lb} lb</div>
                  <div className="rounded-lg bg-muted/50 p-2">Stop: {detail.estimated_stop_minutes} min</div>
                  <div className="rounded-lg bg-muted/50 p-2">Units: {detail.route_units}</div>
                  <div className="rounded-lg bg-muted/50 p-2">Difficulty: {detail.difficulty_score}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Equipment: {(detail.suggested_equipment ?? []).join(", ") || "—"}
                </p>
                <div>
                  <p className="font-medium">Items</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {(detail.scrap_pickup_items ?? []).map((item) => (
                      <li key={String(item.id)}>
                        {String(item.quantity)}× {String(item.item_name_snapshot)}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Photos: {(detail.scrap_pickup_media ?? []).length} · Junk interest:{" "}
                  {detail.junk_estimate_interest || "—"}
                  {detail.estimate_id ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/admin/estimates/${detail.estimate_id}`}
                        className="text-brand-primary underline"
                      >
                        Open estimate
                      </Link>
                    </>
                  ) : null}
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes"
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void patchRequest({ status: "approved", internalNotes: notes })}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void patchRequest({ status: "waitlisted", internalNotes: notes })}
                  >
                    Waitlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void patchRequest({ status: "more_info_needed", internalNotes: notes })
                    }
                  >
                    Need info
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void patchRequest({ status: "declined", internalNotes: notes })}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void patchRequest({ status: "converted_to_paid", internalNotes: notes })
                    }
                  >
                    Convert to paid
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <label className="text-xs text-muted-foreground">Assign Friday</label>
                    <Select
                      value={detail.scrap_friday_date_id || "__none"}
                      onValueChange={(v) => {
                        if (v == null) return;
                        void patchRequest({
                          scrapFridayDateId: v === "__none" ? null : v,
                          status: detail.status === "approved" ? "approved" : detail.status,
                          internalNotes: notes,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Friday" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Unassigned</SelectItem>
                        {dates.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.route_date} ({d.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void patchRequest({
                        internalNotes: notes,
                        overrideNote: "Admin override recorded",
                      })
                    }
                  >
                    Save notes / override
                  </Button>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      )}

      {tab === "dates" && (
        <div className="space-y-4">
          <PremiumCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Open a Friday</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Button onClick={() => void createFriday()}>
              <CalendarDays className="mr-1 h-4 w-4" /> Open Friday
            </Button>
          </PremiumCard>
          <div className="grid gap-3 sm:grid-cols-2">
            {dates.map((d) => (
              <PremiumCard key={d.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{d.route_date}</p>
                  <StatusChip label={d.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Caps: {d.max_route_units} units · {d.max_weight_lb} lb · {d.max_labor_minutes} min
                </p>
                {d.notes ? <p className="mt-1 text-xs">{d.notes}</p> : null}
              </PremiumCard>
            ))}
          </div>
        </div>
      )}

      {tab === "routes" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <label className="text-xs text-muted-foreground">Friday</label>
              <Select
                value={fridayId || undefined}
                onValueChange={(v) => {
                  if (v != null) void loadRoute(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Friday" />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.route_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => void saveRoute(false)}>
              Save draft
            </Button>
            <Button onClick={() => void saveRoute(true)}>Publish route</Button>
          </div>
          {capacity.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              {capacity.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Usage: {capacity.usage.routeUnits} units · {capacity.usage.weightLb} lb ·{" "}
            {capacity.usage.laborMinutes} min · difficult stops {capacity.usage.difficultStops}
            {routeMeta?.status ? ` · route ${routeMeta.status}` : ""}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PremiumCard className="p-4">
              <h3 className="font-semibold">Approved / waitlisted pool</h3>
              <div className="mt-2 space-y-2">
                {approvedForRoute.map((r) => {
                  const onRoute = routeStops.includes(r.id);
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                      <div>
                        <p className="font-medium">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.city} · {r.route_units}u · {r.estimated_weight_lb}lb
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={onRoute ? "secondary" : "outline"}
                        onClick={() =>
                          setRouteStops((prev) =>
                            onRoute ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          )
                        }
                      >
                        {onRoute ? "Remove" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
            <PremiumCard className="p-4">
              <h3 className="font-semibold">Stop order</h3>
              <ol className="mt-2 space-y-2">
                {routeStops.map((id, idx) => {
                  const r = requests.find((x) => x.id === id);
                  return (
                    <li key={id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <span>
                        {idx + 1}. {r?.first_name} {r?.last_name} — {r?.address_line1}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={idx === 0}
                          onClick={() =>
                            setRouteStops((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return next;
                            })
                          }
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={idx === routeStops.length - 1}
                          onClick={() =>
                            setRouteStops((prev) => {
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return next;
                            })
                          }
                        >
                          ↓
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </PremiumCard>
          </div>
        </div>
      )}

      {tab === "tickets" && (
        <div className="space-y-4">
          <PremiumCard className="grid gap-3 p-4 sm:grid-cols-2">
            <Input
              placeholder="Recycling center"
              value={ticketForm.recyclingCenter}
              onChange={(e) => setTicketForm((f) => ({ ...f, recyclingCenter: e.target.value }))}
            />
            <Input
              placeholder="Net weight (lb)"
              value={ticketForm.netWeightLb}
              onChange={(e) => setTicketForm((f) => ({ ...f, netWeightLb: e.target.value }))}
            />
            <Input
              placeholder="Scrap revenue ($)"
              value={ticketForm.scrapRevenue}
              onChange={(e) => setTicketForm((f) => ({ ...f, scrapRevenue: e.target.value }))}
            />
            <Input
              placeholder="Battery count"
              value={ticketForm.batteryCount}
              onChange={(e) => setTicketForm((f) => ({ ...f, batteryCount: e.target.value }))}
            />
            <Input
              placeholder="Fuel cost"
              value={ticketForm.fuelCost}
              onChange={(e) => setTicketForm((f) => ({ ...f, fuelCost: e.target.value }))}
            />
            <Input
              placeholder="Labor cost"
              value={ticketForm.laborCost}
              onChange={(e) => setTicketForm((f) => ({ ...f, laborCost: e.target.value }))}
            />
            <Textarea
              className="sm:col-span-2"
              placeholder="Notes"
              value={ticketForm.notes}
              onChange={(e) => setTicketForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <Button className="sm:col-span-2" onClick={() => void saveTicket()}>
              Save recycling ticket
            </Button>
          </PremiumCard>
          <div className="space-y-2">
            {tickets.map((t) => (
              <PremiumCard key={String(t.id)} className="p-3 text-sm">
                {String(t.recycling_center || "Center")} · {String(t.net_weight_lb ?? "—")} lb · $
                {String(t.scrap_revenue ?? 0)} scrap · {String(t.battery_count ?? 0)} batteries
              </PremiumCard>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats).map(([k, v]) => (
            <StatCard
              key={k}
              label={k}
              value={typeof v === "number" ? Math.round(v * 100) / 100 : String(v)}
            />
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
