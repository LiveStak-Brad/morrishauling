"use client";

import { useState, useMemo } from "react";
import { useCompany } from "@/lib/company-context";
import { getJobs } from "@/lib/mock-data";
import { routePlanner } from "@/lib/route-planner";
import type { RoutePlan } from "@/types/route";
import { RoutePlanView } from "@/components/planner/RoutePlanView";
import { JobCard } from "@/components/customer/JobCard";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radio,
  AlertTriangle,
  Truck,
  Users,
  Zap,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlannerDashboard() {
  const { company, companyId } = useCompany();
  const today = new Date().toISOString().split("T")[0];
  const scheduledJobs = getJobs(companyId, { scheduledDate: today, status: "scheduled" });

  const [truckId, setTruckId] = useState(company.trucks[0]?.id ?? "");
  const [trailerId, setTrailerId] = useState(company.trailers[0]?.id ?? "");
  const [employeeIds] = useState(company.employees.slice(0, 2).map((e) => e.id));
  const [plan, setPlan] = useState<RoutePlan | null>(null);

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
    return [...routeWarnings, ...jobWarnings];
  }, [plan, scheduledJobs]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="morris-gradient-bg px-4 pb-8 pt-6 text-white">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          <span className="text-sm font-semibold text-white/80">Dispatch Center</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Route command</h1>
        <p className="text-sm text-white/60">{today} · {scheduledJobs.length} jobs queued</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusChip label={`${company.trucks.length} trucks`} variant="neutral" className="bg-white/15 text-white ring-white/20" />
          <StatusChip label={`${allWarnings.length} warnings`} variant="warning" className="bg-orange-500/20 text-orange-100 ring-orange-400/30" />
          {plan && (
            <StatusChip label={`${plan.totalDistanceMiles} mi`} variant="neutral" className="bg-white/15 text-white ring-white/20" />
          )}
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 -mt-4 md:max-w-4xl">
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                {company.trucks.map((t) => (
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
              <div className="mt-3 flex flex-wrap gap-2">
                {company.employees.map((e) => (
                  <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    <Users className="h-3 w-3" /> {e.name}
                  </span>
                ))}
              </div>
              <Button
                className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] font-semibold shadow-lg"
                onClick={handlePlanRoute}
                disabled={scheduledJobs.length === 0}
              >
                <Zap className="mr-2 h-4 w-4" />
                Optimize route ({scheduledJobs.length} jobs)
              </Button>
            </PremiumCard>

            <RoutePlanView plan={plan} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-3">
            {scheduledJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
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
      </main>
    </div>
  );
}
