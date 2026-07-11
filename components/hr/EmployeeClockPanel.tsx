"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import type { PunchType, TimeclockPunch } from "@/types/hr/time";
import { Clock, Coffee, Utensils } from "lucide-react";
import { format } from "date-fns";

const PUNCHES: { type: PunchType; label: string; icon: typeof Clock }[] = [
  { type: "clock_in", label: "Clock In", icon: Clock },
  { type: "lunch_out", label: "Lunch Out", icon: Utensils },
  { type: "lunch_in", label: "Lunch In", icon: Utensils },
  { type: "break_start", label: "Break", icon: Coffee },
  { type: "break_end", label: "End Break", icon: Coffee },
  { type: "clock_out", label: "Clock Out", icon: Clock },
];

export function EmployeeClockPanel({ employeeId }: { employeeId?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [punches, setPunches] = useState<TimeclockPunch[]>([]);
  const [clockState, setClockState] = useState<"out" | "in" | "break">("out");

  const loadPunches = () => {
    fetch("/api/me/hr")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.punches) return;
        setPunches(d.punches);
        const today = (() => {
          try {
            return new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Chicago",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date());
          } catch {
            return format(new Date(), "yyyy-MM-dd");
          }
        })();
        const todayPunches = (d.punches as TimeclockPunch[]).filter((p) => {
          try {
            const punchDay = new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Chicago",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(p.punchedAt));
            return punchDay === today;
          } catch {
            return p.punchedAt.startsWith(today);
          }
        });
        if (todayPunches.length === 0) {
          setClockState("out");
          return;
        }
        // API returns newest first
        const last = todayPunches[0];
        if (last.punchType === "clock_out") setClockState("out");
        else if (last.punchType === "break_start" || last.punchType === "lunch_out") setClockState("break");
        else setClockState("in");
      })
      .catch(() => undefined);
  };

  useEffect(() => { loadPunches(); }, [employeeId]);

  const punch = async (punchType: PunchType) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/timeclock/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          punchType,
          deviceInfo: { userAgent: navigator.userAgent },
          location: await getLocation(),
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setStatus(`${punchType.replace(/_/g, " ")} recorded`);
        if (punchType === "clock_in") setClockState("in");
        else if (punchType === "clock_out") setClockState("out");
        else if (punchType === "break_start" || punchType === "lunch_out") setClockState("break");
        else setClockState("in");
        loadPunches();
      } else setStatus(d.error ?? "Failed");
    } catch {
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Time Clock</h3>
        <Badge variant={clockState === "in" ? "default" : clockState === "break" ? "secondary" : "outline"}>
          {clockState === "in" ? "Clocked in" : clockState === "break" ? "On break" : "Clocked out"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PUNCHES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant={type.includes("out") || type === "clock_out" ? "outline" : "default"}
            className="h-16 flex-col gap-1"
            disabled={loading}
            onClick={() => punch(type)}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
      {status && <p className="mt-3 text-sm text-center text-muted-foreground">{status}</p>}
      {punches.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recent punches</p>
          <ul className="space-y-1 text-sm">
            {punches.slice(0, 5).map((p) => (
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

async function getLocation(): Promise<Record<string, unknown> | undefined> {
  if (!navigator.geolocation) return undefined;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000 }
    );
  });
}
