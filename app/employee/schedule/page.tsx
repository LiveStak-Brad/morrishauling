"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import Link from "next/link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type { EmployeeShift, TimeOffRequest } from "@/types/hr/schedule";
import type { Job } from "@/types/job";
import { Calendar, Truck, Users, Briefcase } from "lucide-react";

export default function EmployeeSchedulePage() {
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [crew, setCrew] = useState<{ name: string }[]>([]);
  const [truckName, setTruckName] = useState<string>();
  const [trailerName, setTrailerName] = useState<string>();

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "yyyy-MM-dd");

  useEffect(() => {
    Promise.all([
      fetch("/api/me/hr").then((r) => r.json()),
      fetch("/api/me/dashboard").then((r) => r.json()),
      fetch("/api/hr/time-off").then((r) => r.json()),
    ]).then(([hr, dash, pto]) => {
      if (hr.ok) setShifts(hr.shifts ?? []);
      if (pto.ok) setTimeOff(pto.requests ?? []);
      if (dash.ok) {
        setTodayJobs(dash.dashboard.todayJobs ?? []);
        setCrew(dash.dashboard.crew ?? []);
        setTruckName(dash.dashboard.truckName);
        setTrailerName(dash.dashboard.trailerName);
      }
    });
  }, []);

  const weekShifts = shifts.filter((s) => s.shiftDate >= weekStart && s.shiftDate <= weekEnd);
  const todayShift = shifts.find((s) => s.shiftDate === today);
  const approvedPto = timeOff.filter((r) => r.status === "approved");

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">My Schedule</h1>

      <PremiumCard className="p-4 morris-gradient-bg text-white">
        <p className="text-xs uppercase text-white/70">Today · {format(new Date(), "EEEE, MMM d")}</p>
        {todayShift ? (
          <p className="text-lg font-bold mt-1">
            {format(new Date(todayShift.startTime), "h:mm a")} – {format(new Date(todayShift.endTime), "h:mm a")}
          </p>
        ) : (
          <p className="text-lg font-bold mt-1">{todayJobs.length ? "See job windows below" : "No shift scheduled"}</p>
        )}
        <div className="mt-3 space-y-1 text-sm">
          {crew.length > 0 && (
            <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {crew.map((c) => c.name).join(", ")}</p>
          )}
          {truckName && (
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> {truckName}{trailerName ? ` · ${trailerName}` : ""}
            </p>
          )}
        </div>
      </PremiumCard>

      {todayJobs.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Today&apos;s jobs</h3>
          {todayJobs.map((job) => (
            <Link key={job.id} href={`/employee/jobs/${job.id}`}>
              <PremiumCard className="p-4 mb-2 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium capitalize">{job.serviceType.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">{job.address.street}, {job.address.city}</p>
                    {job.scheduledWindowLabel && (
                      <p className="text-xs mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {job.scheduledWindowLabel}
                      </p>
                    )}
                  </div>
                  <Badge className="capitalize">{job.status.replace(/_/g, " ")}</Badge>
                </div>
              </PremiumCard>
            </Link>
          ))}
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">This week</h3>
        {weekShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shifts on the calendar this week.</p>
        ) : (
          weekShifts.map((s) => (
            <PremiumCard key={s.id} className="p-4 mb-2 flex justify-between items-center">
              <div>
                <p className="font-medium">{format(parseDate(s.shiftDate), "EEE, MMM d")}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(s.startTime), "h:mm a")} – {format(new Date(s.endTime), "h:mm a")}
                </p>
              </div>
              <Badge variant="outline">{s.status}</Badge>
            </PremiumCard>
          ))
        )}
      </section>

      {approvedPto.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Time off</h3>
          {approvedPto.map((r) => (
            <PremiumCard key={r.id} className="p-3 mb-2 text-sm flex justify-between">
              <span className="capitalize">{r.requestType}</span>
              <span className="text-muted-foreground">{r.startDate} – {r.endDate}</span>
            </PremiumCard>
          ))}
        </section>
      )}

      <ButtonLink href="/employee/time-off" variant="outline" className="w-full flex items-center justify-center">
        <Briefcase className="mr-2 h-4 w-4" /> Request time off
      </ButtonLink>
    </div>
  );
}

function parseDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}
