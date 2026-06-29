"use client";

import { useCompany } from "@/lib/company-context";
import {
  getJobs,
  getFinancingRequests,
  getInvoices,
} from "@/lib/mock-data";
import {
  getMorrisKPIs,
  getWeeklyRevenue,
  getActivityFeed,
} from "@/lib/mock-analytics";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StatCard } from "@/components/morris/StatCard";
import { MiniBarChart, DonutStat } from "@/components/morris/Charts";
import { ActivityFeed } from "@/components/morris/Fab";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  FileText,
  Star,
  Users,
  Target,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { company, companyId } = useCompany();
  const kpis = getMorrisKPIs(companyId);
  const revenue = getWeeklyRevenue(companyId);
  const activity = getActivityFeed(companyId);
  const financing = getFinancingRequests(companyId).filter((f) => f.status === "pending");
  const outstanding = getInvoices(companyId).reduce((s, i) => s + i.balanceDue, 0);
  const jobs = getJobs(companyId);

  return (
    <AdminPageShell
      title="Mission Control"
      description={`${company.companyName} · Owner dashboard`}
    >
      {/* Revenue hero */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Today's revenue"
          value={`$${kpis.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="hero"
          trend="up"
          trendValue="+12% vs yesterday"
          className="md:col-span-1"
        />
        <StatCard
          label="This week"
          value={`$${kpis.weekRevenue.toLocaleString()}`}
          subtext={`Month: $${kpis.monthRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          label="Jobs today"
          value={kpis.jobsToday}
          subtext={`${jobs.filter((j) => j.status === "scheduled").length} scheduled`}
          icon={Briefcase}
        />
      </div>

      {/* KPI grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Avg ticket", value: `$${kpis.averageTicket}`, icon: DollarSign },
          { label: "Conversion", value: `${kpis.conversionRate}%`, icon: Target },
          { label: "Satisfaction", value: `${kpis.customerSatisfaction}★`, icon: Star },
          { label: "Repeat rate", value: `${kpis.repeatCustomerRate}%`, icon: Users },
          { label: "Profit margin", value: `${kpis.profitMargin}%`, icon: TrendingUp },
          { label: "Outstanding", value: `$${outstanding}`, icon: FileText },
        ].map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <MiniBarChart data={revenue} title="Weekly revenue" />

          <PremiumCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Pending actions</h3>
              {financing.length > 0 && (
                <StatusChip label={`${financing.length} financing`} variant="warning" />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-2xl font-bold">{kpis.pendingEstimates}</p>
                <p className="text-sm text-muted-foreground">Pending estimates</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-2xl font-bold">{financing.length}</p>
                <p className="text-sm text-muted-foreground">Financing requests</p>
              </div>
            </div>
          </PremiumCard>
        </div>

        <div className="space-y-4">
          <PremiumCard className="p-5">
            <h3 className="mb-4 font-bold">Performance</h3>
            <div className="flex justify-around">
              <DonutStat value={kpis.conversionRate} label="Conversion" />
              <DonutStat value={kpis.employeeProductivity} label="Productivity" />
            </div>
          </PremiumCard>

          <PremiumCard className="p-5">
            <h3 className="mb-4 font-bold">Live activity</h3>
            <ActivityFeed items={activity} />
          </PremiumCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
