"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import type { ClockSummary } from "@/types/hr/employee-portal";
import type { PunchType } from "@/types/hr/time";
import { Clock, Coffee, Utensils, DollarSign } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PUNCH_META: Record<PunchType, { label: string; icon: typeof Clock; variant?: "default" | "outline" | "destructive" }> = {
  clock_in: { label: "Clock In", icon: Clock },
  clock_out: { label: "Clock Out", icon: Clock, variant: "destructive" },
  lunch_out: { label: "Lunch Out", icon: Utensils, variant: "outline" },
  lunch_in: { label: "Lunch In", icon: Utensils },
  break_start: { label: "Start Break", icon: Coffee, variant: "outline" },
  break_end: { label: "End Break", icon: Coffee },
};

const ALL_PUNCHES: PunchType[] = ["clock_in", "lunch_out", "lunch_in", "break_start", "break_end", "clock_out"];

interface EmployeeTimeCardProps {
  clock: ClockSummary;
  employeeId?: string;
  compact?: boolean;
  onPunch?: () => void;
}

export function EmployeeTimeCard({ clock, employeeId, compact, onPunch }: EmployeeTimeCardProps) {
  const [loading, setLoading] = useState<PunchType | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const punch = async (punchType: PunchType) => {
    if (!clock.allowedPunches.includes(punchType)) return;
    setLoading(punchType);
    setStatus(null);
    try {
      const res = await fetch("/api/timeclock/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          punchType,
          deviceInfo: { userAgent: navigator.userAgent },
        }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(`${PUNCH_META[punchType].label} recorded`);
        onPunch?.();
      } else {
        toast.error(d.error ?? "Punch failed");
        setStatus(d.error ?? "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <PremiumCard className={cn("p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Time Card</p>
          <p className="text-lg font-bold">{clock.stateLabel}</p>
          {clock.clockedInAt && (
            <p className="text-sm text-muted-foreground">
              Since {format(new Date(clock.clockedInAt), "h:mm a")}
            </p>
          )}
        </div>
        <StatusChip
          label={clock.state === "in" ? "On shift" : clock.state === "out" ? "Off shift" : clock.stateLabel}
          variant={clock.state === "in" ? "success" : clock.state === "out" ? "neutral" : "warning"}
        />
      </div>

      <div className={cn("grid gap-3 mb-4", compact ? "grid-cols-2" : "grid-cols-3")}>
        <Stat label="Hours today" value={`${clock.hoursWorkedToday}h`} />
        <Stat label="Est. gross" value={`$${clock.estimatedGrossPayToday.toFixed(2)}`} icon={DollarSign} />
        <Stat
          label="Break"
          value={clock.breakStatus === "on_break" ? "On break" : clock.lunchStatus === "on_lunch" ? "Lunch" : "—"}
        />
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3")}>
        {ALL_PUNCHES.map((type) => {
          const meta = PUNCH_META[type];
          const Icon = meta.icon;
          const enabled = clock.allowedPunches.includes(type);
          return (
            <Button
              key={type}
              variant={meta.variant ?? (enabled ? "default" : "outline")}
              className={cn("h-14 flex-col gap-1", !enabled && "opacity-40")}
              disabled={!enabled || loading !== null}
              onClick={() => punch(type)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px]">{loading === type ? "…" : meta.label}</span>
            </Button>
          );
        })}
      </div>

      {status && <p className="mt-2 text-sm text-center text-destructive">{status}</p>}

      {clock.recentPunches.length > 0 && !compact && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recent punches</p>
          <ul className="space-y-1 text-sm">
            {clock.recentPunches.slice(0, 5).map((p) => (
              <li key={p.id} className="flex justify-between text-muted-foreground">
                <span className="capitalize">{p.punchType.replace(/_/g, " ")}</span>
                <span>{format(new Date(p.punchedAt), "h:mm a")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PremiumCard>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Clock }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-brand-primary" />}
        {value}
      </p>
    </div>
  );
}
