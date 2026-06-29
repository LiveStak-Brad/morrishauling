"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import type {
  CustomerCrmProfile,
  DispatchTimelineEvent,
  FinancialCommand,
  LiveCrewUpdate,
  PrioritizedAlerts,
  TruckRouteTimeline,
} from "@/types/operations-command-center";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Radio,
  MapPin,
  Navigation,
  Star,
  Phone,
  MessageSquare,
  ChevronDown,
  Zap,
} from "lucide-react";

function fmtMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

const PHASE_COLORS: Record<string, string> = {
  driving: "bg-blue-500",
  on_site: "bg-emerald-500",
  loading: "bg-amber-500",
  driving_dump: "bg-violet-500",
  at_dump: "bg-orange-500",
  dump_complete: "bg-teal-500",
  next_job: "bg-blue-500",
  departed_yard: "bg-slate-500",
  clocked_in: "bg-slate-400",
};

/** Live crew status from real dispatch data only */
export function LiveOpsTicker({ initial }: { initial: LiveCrewUpdate[] }) {
  if (initial.length === 0) {
    return (
      <PremiumCard className="mb-6 p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="h-4 w-4" />
          <p className="text-sm">No crews currently active.</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="mb-6 overflow-hidden border-2 border-brand-primary/20 p-0">
      <div className="flex items-center gap-2 border-b bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <Radio className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Live operations</span>
      </div>
      <div className="divide-y">
        {initial.map((u) => (
          <div key={u.id} className="flex gap-4 p-4 animate-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border-2 border-white bg-muted shadow ring-2 ring-brand-primary/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{u.employeeName}</p>
                {u.truckName && (
                  <span className="text-xs text-muted-foreground">· {u.truckName}</span>
                )}
                {u.isLive && (
                  <StatusChip label="LIVE" variant="live" pulse className="text-[9px]" />
                )}
              </div>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{u.headline}</p>
              <p className="text-sm text-muted-foreground">{u.detail}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                {u.etaMinutes != null && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    ETA {u.etaMinutes} min
                  </span>
                )}
                {u.trailerLoadPct != null && u.trailerLoadPct > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                    Trailer {u.trailerLoadPct}%
                  </span>
                )}
                <span className={cn("h-2 w-2 self-center rounded-full", PHASE_COLORS[u.phase] ?? "bg-gray-400")} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}

export function TruckRouteMapPanel({ route }: { route: TruckRouteTimeline }) {
  const stops = route.stops;
  const lats = stops.map((s) => s.location?.lat).filter((x): x is number => x != null);
  const lngs = stops.map((s) => s.location?.lng).filter((x): x is number => x != null);
  const center =
    lats.length && lngs.length
      ? { lat: lats.reduce((a, b) => a + b, 0) / lats.length, lng: lngs.reduce((a, b) => a + b, 0) / lngs.length }
      : { lat: 38.788, lng: -90.497 };

  const embedUrl = `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=10&output=embed`;

  return (
    <PremiumCard className="overflow-hidden p-0">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">{route.truckName}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {route.crew.map((c) => (
                <span key={c.name} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
                  {c.name.split(" ")[0]}
                </span>
              ))}
              {route.trailerName && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{route.trailerName}</span>
              )}
            </div>
          </div>
          {route.liveMessage && (
            <StatusChip label="On route" variant="live" pulse className="text-[10px]" />
          )}
        </div>
        {route.liveMessage && (
          <p className="mt-2 text-sm text-brand-primary">{route.liveMessage}</p>
        )}
      </div>
      <div className="grid lg:grid-cols-2">
        <div className="border-b lg:border-b-0 lg:border-r p-4">
          <div className="space-y-0">
            {stops.map((stop, i) => (
              <div key={stop.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                      stop.stopType === "dump" ? "bg-amber-500" : stop.stopType === "yard" ? "bg-slate-500" : "bg-brand-primary"
                    )}
                  >
                    {stop.timeLabel.replace(/ [AP]M/, "").slice(0, 5)}
                  </div>
                  {i < stops.length - 1 && <div className="my-1 w-0.5 flex-1 min-h-6 bg-border" />}
                </div>
                <div className="pb-5 min-w-0">
                  <p className="font-semibold capitalize">{stop.title}</p>
                  <p className="text-xs text-muted-foreground">{stop.subtitle}</p>
                  {stop.driveMinutesFromPrevious != null && i > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ChevronDown className="h-3 w-3" /> {stop.driveMinutesFromPrevious} min drive
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <a
            href={route.googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 w-full rounded-xl")}
          >
            <Navigation className="mr-2 h-4 w-4" /> Open route in Google Maps
          </a>
        </div>
        <div className="relative min-h-[280px] bg-muted">
          <iframe
            title={`Map — ${route.truckName}`}
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold shadow-lg">
            <MapPin className="h-4 w-4 text-brand-primary" />
            {stops.length} stops · est. route
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

export function FinancialCommandPanel({ financial }: { financial: FinancialCommand }) {
  const hasData =
    financial.revenueToday > 0 ||
    financial.expectedRevenueWeek > 0 ||
    financial.projectedProfitWeek > 0 ||
    financial.payrollDueAmount > 0;

  if (!hasData) {
    return (
      <PremiumCard className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold">
          <Zap className="h-4 w-4 text-amber-500" /> Financial command
        </h3>
        <p className="text-sm text-muted-foreground">
          Financial data will appear after jobs are completed and payments are collected.
        </p>
      </PremiumCard>
    );
  }

  const filled = Math.min(10, Math.round((financial.revenueGoalPct / 100) * 10));
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  return (
    <PremiumCard className="p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold">
        <Zap className="h-4 w-4 text-amber-500" /> Financial command
      </h3>
      <div className="rounded-2xl border-2 border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-transparent p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue today</p>
        <p className="mt-1 text-4xl font-bold">{fmtMoney(financial.revenueToday)}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Goal {fmtMoney(financial.revenueGoal)}</span>
            <span className="font-bold">{financial.revenueGoalPct}%</span>
          </div>
          <p className="mt-2 font-mono text-sm tracking-widest text-brand-primary">{bar}</p>
          {financial.revenueGap > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Need <span className="font-bold text-foreground">{fmtMoney(financial.revenueGap)}</span> to hit goal
            </p>
          )}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {financial.payrollDueAmount > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-xs text-muted-foreground">{financial.payrollDueLabel}</dt>
            <dd className="mt-1 text-lg font-bold">{fmtMoney(financial.payrollDueAmount)}</dd>
          </div>
        )}
        {financial.expectedRevenueWeek > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-xs text-muted-foreground">Expected revenue (week)</dt>
            <dd className="mt-1 text-lg font-bold">{fmtMoney(financial.expectedRevenueWeek)}</dd>
          </div>
        )}
        {financial.projectedProfitWeek > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-xs text-muted-foreground">Projected profit (week)</dt>
            <dd className="mt-1 text-lg font-bold text-emerald-700">{fmtMoney(financial.projectedProfitWeek)}</dd>
          </div>
        )}
      </dl>
    </PremiumCard>
  );
}

export function PrioritizedAlertsPanel({ alerts }: { alerts: PrioritizedAlerts }) {
  const sections = [
    { key: "immediate", label: "Immediate", emoji: "🔴", items: alerts.immediate, border: "border-red-200 bg-red-50/40" },
    { key: "today", label: "Today", emoji: "🟠", items: alerts.today, border: "border-amber-200 bg-amber-50/40" },
    { key: "soon", label: "Soon", emoji: "🟡", items: alerts.soon, border: "border-yellow-200 bg-yellow-50/30" },
  ] as const;

  const total = alerts.immediate.length + alerts.today.length + alerts.soon.length;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">All clear — no active alerts.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((s) =>
        s.items.length > 0 ? (
          <div key={s.key}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {s.emoji} {s.label}
            </p>
            <ul className="space-y-2">
              {s.items.map((a) => (
                <li key={a.id}>
                  {a.href ? (
                    <Link href={a.href} className={cn("block rounded-lg border p-3 text-sm transition-colors hover:opacity-90", s.border)}>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </Link>
                  ) : (
                    <div className={cn("rounded-lg border p-3 text-sm", s.border)}>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

export function DispatchTimelinePanel({ events }: { events: DispatchTimelineEvent[] }) {
  return (
    <PremiumCard className="p-5">
      <h3 className="mb-4 font-bold">Dispatch timeline</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dispatch activity yet.</p>
      ) : (
      <div className="relative space-y-0 pl-4">
        <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-border" />
        {events.map((e) => (
          <div key={e.id} className="relative flex gap-4 pb-4">
            <div
              className={cn(
                "relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background",
                e.isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tabular-nums text-brand-primary">{e.timeLabel}</p>
              <p className="font-semibold">{e.title}</p>
              {e.subtitle && <p className="text-xs text-muted-foreground">{e.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
      )}
    </PremiumCard>
  );
}

export function CustomerCrmDrawer({
  profile,
  open,
  onOpenChange,
}: {
  profile: CustomerCrmProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!profile) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">{profile.name}</SheetTitle>
          <p className="text-left text-sm text-muted-foreground">{profile.email}</p>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Customer since</p><p className="font-bold">{profile.customerSince}</p></div>
            <div><p className="text-xs text-muted-foreground">Jobs</p><p className="font-bold">{profile.totalJobs}</p></div>
            <div><p className="text-xs text-muted-foreground">Spent</p><p className="font-bold">{fmtMoney(profile.totalSpent)}</p></div>
            <div><p className="text-xs text-muted-foreground">Avg ticket</p><p className="font-bold">{fmtMoney(profile.averageTicket)}</p></div>
          </div>
          {profile.lastReviewStars != null && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Last review</span>
              {Array.from({ length: profile.lastReviewStars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          )}
          <dl className="space-y-2 text-sm">
            {profile.preferredCrew && (
              <div className="flex justify-between"><dt className="text-muted-foreground">Preferred crew</dt><dd className="font-medium">{profile.preferredCrew}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted-foreground">Calls</dt><dd className="font-medium">{profile.callCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Texts</dt><dd className="font-medium">{profile.textCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Invoices</dt><dd className="font-medium">{profile.invoiceStatus}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Financing</dt><dd className="font-medium">{profile.financingStatus}</dd></div>
          </dl>
          {profile.notes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Notes</p>
              <ul className="space-y-1 text-sm">
                {profile.notes.map((n) => (
                  <li key={n} className="rounded-lg bg-muted/50 px-3 py-2">{n}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            {profile.phone && (
              <a href={`tel:${profile.phone.replace(/\D/g, "")}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}>
                <Phone className="mr-1 h-4 w-4" /> Call
              </a>
            )}
            {profile.phone && (
              <a href={`sms:${profile.phone.replace(/\D/g, "")}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}>
                <MessageSquare className="mr-1 h-4 w-4" /> Text
              </a>
            )}
            <Link href="/admin/customers" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
              Full CRM
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CrmQuickList({
  profiles,
  onSelect,
}: {
  profiles: CustomerCrmProfile[];
  onSelect: (p: CustomerCrmProfile) => void;
}) {
  return (
    <PremiumCard className="p-5">
      <h3 className="mb-3 font-bold">Customer relationships</h3>
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customers yet.{" "}
          <Link href="/admin/customers" className="font-medium text-brand-primary hover:underline">
            Add a customer
          </Link>{" "}
          or accept a booking.
        </p>
      ) : (
      <div className="space-y-2">
        {profiles.slice(0, 5).map((p) => (
          <button
            key={p.customerId}
            type="button"
            onClick={() => onSelect(p)}
            className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.totalJobs} jobs · {fmtMoney(p.totalSpent)}</p>
            </div>
            {p.tags.includes("repeat") && <StatusChip label="Repeat" variant="success" className="text-[10px]" />}
          </button>
        ))}
      </div>
      )}
    </PremiumCard>
  );
}
