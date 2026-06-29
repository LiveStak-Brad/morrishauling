"use client";

import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { getJobs } from "@/lib/mock-data";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { StatusChip } from "@/components/morris/StatusChip";
import {
  MapPin,
  Navigation,
  Clock,
  ChevronRight,
  Truck,
} from "lucide-react";

export default function EmployeeDashboard() {
  const { company, companyId } = useCompany();
  const today = new Date().toISOString().split("T")[0];
  const jobs = getJobs(companyId, { scheduledDate: today }).sort(
    (a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0)
  );
  const completed = jobs.filter((j) => j.status === "completed").length;
  const nextJob = jobs.find((j) => j.status !== "completed");

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Driver header */}
      <div className="morris-gradient-bg px-4 pb-6 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Good morning</p>
            <h1 className="text-2xl font-bold">Today&apos;s route</h1>
          </div>
          <StatusChip label={`${jobs.length} stops`} variant="neutral" className="bg-white/15 text-white ring-white/20" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">{completed}/{jobs.length}</p>
            <p className="text-[10px] text-white/70 uppercase">Done</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">$186</p>
            <p className="text-[10px] text-white/70 uppercase">Est. pay</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">6.2h</p>
            <p className="text-[10px] text-white/70 uppercase">Hours</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 -mt-3 space-y-4 md:max-w-2xl">
        {nextJob && (
          <PremiumCard className="overflow-hidden border-2 border-brand-primary/20 p-0" glow>
            <div className="bg-brand-primary/5 px-5 py-3">
              <StatusChip label="Up next" variant="live" pulse />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Stop #{nextJob.routeOrder}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{nextJob.address.street}</h2>
                  <p className="text-muted-foreground">{nextJob.address.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-primary">
                    ${nextJob.estimate?.total}
                  </p>
                  <p className="text-xs text-muted-foreground">~{nextJob.estimate?.trailerPercent}% load</p>
                </div>
              </div>

              {nextJob.customerNotes && (
                <div className="mt-4 rounded-xl bg-morris-warning/10 p-3 text-sm">
                  <strong>Note:</strong> {nextJob.customerNotes}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-primary font-semibold text-white shadow-lg transition-transform active:scale-95"
                >
                  <Navigation className="h-5 w-5" />
                  Navigate
                </button>
                <Link
                  href={`/employee/jobs/${nextJob.id}`}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 font-semibold transition-colors hover:bg-muted"
                >
                  View job
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </PremiumCard>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Truck" value={company.trucks[0]?.name ?? "—"} icon={Truck} />
          <StatCard label="Trailer" value="42%" subtext="capacity used" icon={Truck} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold">Route order</h2>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <PremiumCard className="p-8 text-center text-muted-foreground">
                No jobs scheduled today
              </PremiumCard>
            ) : (
              jobs.map((job) => (
                <Link key={job.id} href={`/employee/jobs/${job.id}`}>
                  <PremiumCard
                    interactive
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-sm font-bold text-white">
                      {job.routeOrder}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{job.address.street}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {job.estimate?.trailerPercent}% trailer · ${job.estimate?.total}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </PremiumCard>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
