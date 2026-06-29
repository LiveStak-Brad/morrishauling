"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { getJobs, getScheduleSlots } from "@/lib/mock-data";
import { getMockOperationsDepthSnapshot } from "@/lib/mock-operations-depth";
import { routePlanner } from "@/lib/route-planner";
import type { RoutePlan } from "@/types/route";
import type { Job } from "@/types/job";
import type { ScheduleSlot } from "@/types/schedule";
import type { OperationalDumpSite } from "@/types/operations-depth";
import { RoutePlanView } from "@/components/planner/RoutePlanView";
import { DisposalJobPanel } from "@/components/disposal/DisposalManagementDashboard";
import { PlannerScheduleCapacity } from "@/components/planner/PlannerScheduleCapacity";
import { PlannerCrewPanel } from "@/components/planner/PlannerCrewPanel";
import { JobCard } from "@/components/customer/JobCard";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, AlertTriangle, Truck, Zap, Route } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannerTruck {
  id: string;
  name: string;
}

export default function PlannerDashboard() {
  const { company, companyId } = useCompany();
  const today = new Date().toISOString().split("T")[0];
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [dumpSites, setDumpSites] = useState<OperationalDumpSite[]>([]);
  const [trucks, setTrucks] = useState<PlannerTruck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/planner?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setScheduledJobs(data.jobs ?? []);
          setScheduleSlots(data.scheduleSlots ?? []);
          setDumpSites(data.dumpSites ?? []);
          if (data.trucks?.length) {
            setTrucks(data.trucks.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
          } else if (!isDemoDataEnabled()) {
            setTrucks([]);
          }
          if (data.trailers?.length) {
            setTrailerId((prev) => prev || data.trailers[0].id);
          }
          return;
        }
        if (isDemoDataEnabled()) {
          setScheduledJobs(
            getJobs(companyId, { scheduledDate: today, status: "scheduled" })
          );
          setScheduleSlots(
            getScheduleSlots(companyId, { fromDate: today, includeClosed: true })
          );
          setDumpSites(getMockOperationsDepthSnapshot(companyId).dumpSites);
        }
      })
      .catch(() => {
        if (isDemoDataEnabled()) {
          setScheduledJobs(
            getJobs(companyId, { scheduledDate: today, status: "scheduled" })
          );
          setScheduleSlots(
            getScheduleSlots(companyId, { fromDate: today, includeClosed: true })
          );
          setDumpSites(getMockOperationsDepthSnapshot(companyId).dumpSites);
        }
      })
      .finally(() => setLoading(false));
  }, [companyId, today]);

  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [disposalJobId, setDisposalJobId] = useState<string | null>(null);

  const refreshPlannerData = () => {
    setLoading(true);
    fetch(`/api/admin/planner?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setScheduledJobs(data.jobs ?? []);
          setScheduleSlots(data.scheduleSlots ?? []);
          setDumpSites(data.dumpSites ?? []);
          if (data.trucks?.length) {
            setTrucks(data.trucks.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
          } else if (!isDemoDataEnabled()) {
            setTrucks([]);
          }
          if (data.trailers?.length) {
            setTrailerId((prev) => prev || data.trailers[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  const handleAssignCrew = async () => {
    if (employeeIds.length === 0 || scheduledJobs.length === 0) return;
    setAssigning(true);
    setAssignMessage(null);
    try {
      for (const job of scheduledJobs) {
        for (const empId of employeeIds) {
          const res = await fetch("/api/hr/assign-job", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: job.id, employeeId: empId, role: "helper" }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error ?? "Assignment failed");
        }
        if (truckId || trailerId) {
          const res = await fetch(`/api/jobs/${job.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId,
              updates: {
                assignedTruckId: truckId || undefined,
                assignedTrailerId: trailerId || undefined,
              },
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error ?? "Fleet assignment failed");
        }
      }
      setAssignMessage(`Assigned ${employeeIds.length} crew to ${scheduledJobs.length} job(s)`);
      refreshPlannerData();
    } catch (e) {
      setAssignMessage(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    if (!truckId && trucks[0]) setTruckId(trucks[0].id);
  }, [trucks, truckId]);

  const startPoint = company.yardLocation ?? company.serviceArea.center;
  const endPoint = company.yardLocation ?? company.serviceArea.center;

  const handlePlanRoute = () => {
    setPlan(
      routePlanner.planRoute(
        {
          jobIds: scheduledJobs.map((j) => j.id),
          startPoint,
          endPoint,
          truckId,
          trailerId,
          employeeIds,
          sortByDistance: true,
        },
        company,
        scheduledJobs
      )
    );
  };

  const allWarnings = useMemo(() => {
    const routeWarnings = plan?.warnings ?? [];
    const jobWarnings = scheduledJobs.flatMap((j) =>
      j.warnings.map((w) => ({ type: w, message: w.replace(/_/g, " "), jobId: j.id }))
    );
    const closedIds = new Set(dumpSites.filter((d) => d.isClosed).map((d) => d.id));
    const dumpWarnings = [
      ...dumpSites
        .filter((d) => d.isClosed)
        .map((d) => ({
          type: "dump_closed",
          message: `${d.name} is closed${d.closureReason ? ` — ${d.closureReason}` : ""}`,
        })),
      ...(plan?.stops ?? [])
        .filter((s) => s.type === "dump" && s.dumpSiteId && closedIds.has(s.dumpSiteId))
        .map((s) => ({
          type: "dump_closed_route",
          message: `Planned route uses closed dump: ${s.label}`,
        })),
    ];
    return [...routeWarnings, ...jobWarnings, ...dumpWarnings];
  }, [plan, scheduledJobs, dumpSites]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="morris-gradient-bg px-4 pb-8 pt-6 text-white">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          <span className="text-sm font-semibold text-white/80">Dispatch Center</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Route command</h1>
        <p className="text-sm text-white/60">
          {today} · {loading ? "…" : `${scheduledJobs.length} jobs queued`}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusChip label={`${trucks.length} trucks`} variant="neutral" className="bg-white/15 text-white ring-white/20" />
          <StatusChip label={`${allWarnings.length} warnings`} variant="warning" className="bg-orange-500/20 text-orange-100 ring-orange-400/30" />
          {plan && (
            <StatusChip label={`${plan.totalDistanceMiles} mi`} variant="neutral" className="bg-white/15 text-white ring-white/20" />
          )}
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 -mt-4 md:max-w-4xl">
        {loading ? (
          <p className="py-8 text-muted-foreground">Loading planner data…</p>
        ) : (
          <Tabs defaultValue="dispatch" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted p-1 h-12">
              <TabsTrigger value="dispatch" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Route className="mr-1.5 h-4 w-4" /> Dispatch
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="warnings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <AlertTriangle className="mr-1.5 h-4 w-4" /> Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dispatch" className="space-y-4 animate-fade-in">
              <PremiumCard className="p-5">
                <h3 className="font-bold">Fleet assignment</h3>
                {trucks.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No trucks in fleet. Add equipment in admin to plan routes.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {trucks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTruckId(t.id)}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left transition-all",
                          truckId === t.id ? "border-brand-primary bg-brand-primary/5" : "border-transparent bg-muted"
                        )}
                      >
                        <Truck className="mb-2 h-5 w-5 text-brand-primary" />
                        <p className="font-semibold text-sm">{t.name}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <PlannerCrewPanel selectedIds={employeeIds} onChange={setEmployeeIds} maxSelect={4} />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 h-11 w-full rounded-xl"
                  disabled={assigning || employeeIds.length === 0 || scheduledJobs.length === 0}
                  onClick={() => void handleAssignCrew()}
                >
                  {assigning ? "Assigning…" : `Assign crew to ${scheduledJobs.length} job(s)`}
                </Button>
                {assignMessage && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">{assignMessage}</p>
                )}
                <Button
                  className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] font-semibold shadow-lg"
                  onClick={handlePlanRoute}
                  disabled={scheduledJobs.length === 0}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize route ({scheduledJobs.length} jobs)
                </Button>
              </PremiumCard>

              {scheduledJobs.length === 0 ? (
                <PremiumCard className="p-8 text-center text-muted-foreground">
                  No scheduled jobs for today. Assign jobs in admin schedule.
                </PremiumCard>
              ) : (
                <div className="space-y-3">
                  {scheduledJobs.map((j) => (
                    <div key={j.id} className="space-y-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setDisposalJobId(disposalJobId === j.id ? null : j.id)}
                        onKeyDown={(e) => e.key === "Enter" && setDisposalJobId(disposalJobId === j.id ? null : j.id)}
                        className={cn(disposalJobId === j.id && "ring-2 ring-brand-primary rounded-2xl")}
                      >
                        <JobCard job={j} />
                      </div>
                      {disposalJobId === j.id && j.serviceType !== "hauling_transport" && (
                        <PremiumCard className="p-4 border-brand-primary/20">
                          <h3 className="mb-3 font-bold text-sm">
                            {j.status === "needs_dump" ? "Disposal required" : "Disposal recommendation"}
                          </h3>
                          <DisposalJobPanel jobId={j.id} onAssigned={() => setDisposalJobId(null)} />
                        </PremiumCard>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <RoutePlanView plan={plan} />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-3">
              <PlannerScheduleCapacity slots={scheduleSlots} jobs={scheduledJobs} />
            </TabsContent>

            <TabsContent value="warnings">
              <PremiumCard className="p-5">
                {allWarnings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">All clear — no warnings</p>
                ) : (
                  <ul className="space-y-3">
                    {allWarnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl bg-morris-warning/10 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-morris-warning" />
                        <span className="text-sm">{w.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </PremiumCard>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
