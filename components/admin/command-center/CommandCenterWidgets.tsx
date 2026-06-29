"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Phone,
  MessageSquare,
  Camera,
  Navigation,
  ExternalLink,
  FileText,
  CreditCard,
} from "lucide-react";
import type { CompanyConfig } from "@/types";
import type { Invoice, Job } from "@/types";
import type { Customer } from "@/types/user";
import type {
  CommandCenterKpis,
  EmployeeStatusRow,
  FleetTruckStatus,
  ScheduleWindowSummary,
} from "@/types/operations-command-center";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function fmtMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

type KpiTone = "money" | "count" | "pct";

interface KpiConfig {
  key: keyof CommandCenterKpis;
  label: string;
  icon: LucideIcon;
  tone: KpiTone;
  emptyMessage: string;
  hero?: boolean;
  hideWhenEmpty?: boolean;
}

function kpiDisplay(
  kpis: CommandCenterKpis,
  cfg: KpiConfig
): { value: string; subtext?: string; hidden: boolean } {
  const raw = kpis[cfg.key];
  if (cfg.tone === "money") {
    const n = raw as number | null;
    if (n == null || n === 0) {
      if (cfg.hideWhenEmpty) return { value: "", hidden: true };
      return { value: "$0", subtext: cfg.emptyMessage, hidden: false };
    }
    return { value: fmtMoney(n), hidden: false };
  }
  if (cfg.tone === "pct") {
    const n = raw as number | null;
    if (n == null) {
      return { value: "—", subtext: cfg.emptyMessage, hidden: false };
    }
    return { value: `${n}%`, subtext: kpis.todaysCapacityLabel, hidden: false };
  }
  const n = raw as number;
  if (n === 0 && cfg.emptyMessage) {
    return { value: "0", subtext: cfg.emptyMessage, hidden: false };
  }
  return { value: String(n), hidden: false };
}

export function CommandCenterKpiGrid({
  kpis,
  configs,
}: {
  kpis: CommandCenterKpis;
  configs: KpiConfig[];
}) {
  const visible = configs
    .map((cfg) => ({ cfg, ...kpiDisplay(kpis, cfg) }))
    .filter((x) => !x.hidden);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {visible.map(({ cfg, value, subtext }) => {
        const Icon = cfg.icon;
        return (
          <StatCard
            key={cfg.key}
            label={cfg.label}
            value={value}
            subtext={subtext}
            icon={Icon}
            variant={cfg.hero ? "hero" : "default"}
            className={cfg.hero ? "col-span-2 md:col-span-2" : undefined}
          />
        );
      })}
    </div>
  );
}

export function CapacityBar({
  title,
  summary,
  emptyMessage = "Schedule not yet started",
}: {
  title: string;
  summary: ScheduleWindowSummary;
  emptyMessage?: string;
}) {
  const pct = summary.max > 0 ? Math.round((summary.booked / summary.max) * 100) : 0;
  const filled = Math.min(10, Math.round((summary.booked / Math.max(summary.max, 1)) * 10));
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        {summary.max > 0 ? (
          <span className="text-sm font-bold tabular-nums text-foreground">
            {summary.booked} / {summary.max} booked
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{emptyMessage}</span>
        )}
      </div>
      {summary.max > 0 ? (
        <>
          <p className="mt-2 font-mono text-sm tracking-widest text-brand-primary">{bar}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{summary.remaining} openings left</span>
            <StatusChip
              label={`${pct}%`}
              variant={pct >= 90 ? "urgent" : pct >= 70 ? "warning" : "success"}
              className="text-[10px]"
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

type OpsTileTone = "success" | "info" | "warning" | "orange" | "urgent" | "neutral";

const TILE_STYLES: Record<OpsTileTone, string> = {
  success: "border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30",
  info: "border-blue-200 bg-blue-50/80 dark:bg-blue-950/30",
  warning: "border-amber-200 bg-amber-50/80 dark:bg-amber-950/30",
  orange: "border-orange-200 bg-orange-50/80 dark:bg-orange-950/30",
  urgent: "border-red-200 bg-red-50/80 dark:bg-red-950/30",
  neutral: "border-border bg-muted/30",
};

const TILE_DOTS: Record<OpsTileTone, string> = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  orange: "bg-orange-500",
  urgent: "bg-red-500",
  neutral: "bg-slate-400",
};

export function OpsStatusTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: OpsTileTone;
  hint?: string;
}) {
  const display = value === 0 && hint ? hint : String(value);
  const isHint = value === 0 && !!hint;

  return (
    <div className={cn("rounded-xl border p-3", TILE_STYLES[tone])}>
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TILE_DOTS[tone])} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-2 font-bold", isHint ? "text-sm font-medium text-muted-foreground" : "text-2xl")}>
        {display}
      </p>
    </div>
  );
}

export function QuickActionsPanel({
  primary,
  secondary,
}: {
  primary: { href: string; label: string; icon: LucideIcon }[];
  secondary: { href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <PremiumCard className="mb-6 p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {primary.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-brand-primary/30 bg-gradient-to-b from-brand-primary/10 to-brand-primary/5 p-4 text-center transition-all hover:border-brand-primary hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm transition-transform group-hover:scale-105">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold leading-tight">{a.label}</span>
            </Link>
          );
        })}
      </div>
      {secondary.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {secondary.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-primary/40 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {a.label}
              </Link>
            );
          })}
        </div>
      )}
    </PremiumCard>
  );
}

function maintVariant(s: FleetTruckStatus["maintenanceStatus"]) {
  if (s === "overdue" || s === "out_of_service") return "urgent" as const;
  if (s === "due_soon") return "warning" as const;
  return "success" as const;
}

export function FleetTruckCard({ truck }: { truck: FleetTruckStatus }) {
  const fuelBar = truck.fuelLevelPct != null ? Math.min(10, Math.round(truck.fuelLevelPct / 10)) : 0;
  const fuelBlocks = truck.fuelLevelPct != null ? "█".repeat(fuelBar) + "░".repeat(10 - fuelBar) : null;

  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xl font-bold">{truck.truckName}</p>
        <StatusChip label={truck.maintenanceLabel} variant={maintVariant(truck.maintenanceStatus)} />
      </div>
      <div className="my-3 h-px bg-border" />
      <div className="mb-4 flex flex-wrap gap-2">
        {truck.crewAvatars.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm font-medium">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.avatarUrl} alt="" className="h-7 w-7 rounded-full border border-white shadow-sm" />
            {c.name.split(" ")[0]}
          </span>
        ))}
      </div>
      {truck.trailerAttached && (
        <p className="mb-3 text-sm font-semibold">{truck.trailerAttached}</p>
      )}
      {fuelBlocks && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground">Fuel {truck.fuelLevelPct}%</p>
          <p className="font-mono text-xs tracking-widest text-emerald-700">{fuelBlocks}</p>
        </div>
      )}
      {truck.liveMessage && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900">{truck.liveMessage}</p>
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Today&apos;s revenue</dt>
          <dd className="text-lg font-bold text-emerald-700">${truck.todayRevenue.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Today&apos;s stops</dt>
          <dd className="text-lg font-bold">{truck.todayStops}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted-foreground">Current job</dt>
          <dd className="font-semibold capitalize">{truck.currentJobLabel ?? "No active job"}</dd>
        </div>
      </dl>
      {truck.maintenanceWarning && (
        <p className="mt-3 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">{truck.maintenanceWarning}</p>
      )}
    </div>
  );
}

export function FleetTrailerCard({
  name,
  capacityPercent,
  assignedJob,
}: {
  name: string;
  capacityPercent: number;
  assignedJob: string | null;
}) {
  const filled = Math.min(10, Math.round(capacityPercent / 10));
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  return (
    <div className="rounded-2xl border bg-card p-4 text-sm">
      <p className="font-bold">{name}</p>
      <p className="mt-1 font-mono text-xs tracking-widest text-muted-foreground">{bar}</p>
      <p className="mt-1 text-xs text-muted-foreground">{capacityPercent}% load</p>
      <p className="mt-2 font-medium">{assignedJob ?? "Available"}</p>
    </div>
  );
}

function clockDot(status: EmployeeStatusRow["clockStatus"]) {
  switch (status) {
    case "clocked_in":
    case "on_break":
      return "bg-emerald-500";
    case "clocked_out":
      return "bg-slate-400";
    case "off":
      return "bg-slate-300";
    default:
      return "bg-amber-400";
  }
}

export function EmployeeOpsCard({ employee: e }: { employee: import("@/types/operations-command-center").EmployeeStatusRow }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={e.avatarUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full border-2 border-white bg-muted shadow ring-2 ring-brand-primary/10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold">{e.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", clockDot(e.clockStatus))} />
                <span className="text-sm font-medium">{e.liveMessage ?? e.statusLabel}</span>
                {e.livePhase && ["driving", "on_site", "loading"].includes(e.livePhase) && (
                  <StatusChip label="LIVE" variant="live" pulse className="text-[9px]" />
                )}
              </div>
            </div>
            {e.revenueProducedToday != null && e.revenueProducedToday > 0 && (
              <p className="text-sm font-bold text-emerald-700">${e.revenueProducedToday.toLocaleString()}</p>
            )}
          </div>
          {e.liveDetail && (
            <p className="mt-1 text-sm text-muted-foreground">{e.liveDetail}</p>
          )}
          {e.liveEtaMinutes != null && (
            <p className="mt-1 text-xs font-semibold text-blue-700">ETA {e.liveEtaMinutes} minutes</p>
          )}
          {e.trailerLoadPct != null && e.trailerLoadPct > 0 && (
            <p className="mt-1 text-xs font-semibold text-amber-700">Trailer load {e.trailerLoadPct}%</p>
          )}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {e.currentJobLabel && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Current job</dt>
            <dd className="font-medium">{e.currentJobLabel}</dd>
          </div>
        )}
        {e.clockedInAt && (
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="font-medium">{format(parseISO(e.clockedInAt), "h:mm a")}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Jobs today</dt>
          <dd className="font-semibold">{e.jobsToday}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Completed</dt>
          <dd className="font-semibold">{e.jobsCompletedToday}</dd>
        </div>
        {e.hoursToday != null && (
          <div>
            <dt className="text-muted-foreground">Hours</dt>
            <dd className="font-semibold">{e.hoursToday}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function TodayScheduleList({
  jobs,
  company,
  onSelect,
  getEmployeeName,
}: {
  jobs: Job[];
  company: CompanyConfig;
  onSelect: (job: Job) => void;
  getEmployeeName?: (id: string) => string;
}) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No jobs on today&apos;s schedule yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const crew = (job.assignedEmployeeIds ?? [])
          .map((id) => getEmployeeName?.(id) ?? id)
          .filter(Boolean);
        const truck = company.trucks.find((t) => t.id === job.assignedTruckId)?.name;
        const trailer = company.trailers.find((t) => t.id === job.assignedTrailerId)?.name;
        const time = job.scheduledWindowLabel ?? "TBD";
        const label = job.junkType?.replace(/_/g, " ") ?? "Job";

        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job)}
            className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:border-brand-primary/50 hover:bg-brand-primary/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">{time}</p>
                <p className="mt-0.5 font-semibold capitalize">{label}</p>
                <p className="text-xs text-muted-foreground">{job.address.street}, {job.address.city}</p>
              </div>
              <StatusChip label={job.status.replace(/_/g, " ")} variant="info" className="text-[10px] capitalize" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {crew.length > 0 && <span>Crew: {crew.join(", ")}</span>}
              {truck && <span>· {truck}</span>}
              {trailer && <span>· {trailer}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function DispatchJobDrawer({
  job,
  open,
  onOpenChange,
  company,
  customer,
  invoice,
  getEmployeeName,
}: {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyConfig;
  customer: Customer | null;
  invoice: Invoice | null;
  getEmployeeName?: (id: string) => string;
}) {
  if (!job) return null;

  const crew = (job.assignedEmployeeIds ?? [])
    .map((id) => getEmployeeName?.(id) ?? id)
    .filter(Boolean);
  const truck = company.trucks.find((t) => t.id === job.assignedTruckId)?.name;
  const trailer = company.trailers.find((t) => t.id === job.assignedTrailerId)?.name;
  const mapsUrl = job.address.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${job.address.location.lat},${job.address.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address.street}, ${job.address.city}, ${job.address.state}`)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left capitalize">
            {job.junkType?.replace(/_/g, " ") ?? "Job dispatch"}
          </SheetTitle>
          <p className="text-left text-sm text-muted-foreground">
            {job.scheduledWindowLabel ?? "Today"} · {job.address.street}, {job.address.city}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignment</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Crew</dt><dd className="font-medium">{crew.join(", ") || "Unassigned"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Truck</dt><dd className="font-medium">{truck ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Trailer</dt><dd className="font-medium">{trailer ?? "—"}</dd></div>
            </dl>
          </section>

          {customer && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</h4>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone} · {customer.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone.replace(/\D/g, "")}`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
                  >
                    <Phone className="mr-1.5 h-4 w-4" /> Call
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`sms:${customer.phone.replace(/\D/g, "")}`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
                  >
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Text
                  </a>
                )}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment & invoice</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estimate</dt>
                <dd className="font-bold">{job.estimate ? fmtMoney(job.estimate.total) : "—"}</dd>
              </div>
              {invoice && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Invoice</dt>
                    <dd className="font-medium">{invoice.invoiceNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Balance due</dt>
                    <dd className={cn("font-bold", invoice.balanceDue > 0 && "text-amber-700")}>
                      {fmtMoney(invoice.balanceDue)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/admin/invoices"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
              >
                <FileText className="mr-1.5 h-4 w-4" /> Invoices
              </Link>
              <Link
                href="/admin/payments"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
              >
                <CreditCard className="mr-1.5 h-4 w-4" /> Collect payment
              </Link>
            </div>
          </section>

          {job.customerNotes && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h4>
              <p className="rounded-xl bg-muted/50 p-3 text-sm">{job.customerNotes}</p>
            </section>
          )}

          {job.photos.length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Camera className="h-3.5 w-3.5" /> Photos ({job.photos.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {job.photos.slice(0, 4).map((p) => (
                  <div key={p.id} className="aspect-video overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? "Job photo"} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl")}
            >
              <Navigation className="mr-2 h-4 w-4" /> Open navigation
            </a>
            <Link
              href="/admin/jobs"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-xl")}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Full job details
            </Link>
            <Link
              href="/planner"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              Open dispatch center
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
