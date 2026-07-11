"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  CreditCard,
  Phone,
  Truck,
} from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { JobCard } from "@/components/customer/JobCard";
import { CustomerLoginPrompt } from "@/components/customer/CustomerLoginPrompt";
import { FloatingActionButton } from "@/components/morris/Fab";
import { Timeline, type TimelineStep } from "@/components/morris/Timeline";

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Request received",
    estimated: "Estimate ready",
    scheduled: "Scheduled",
    in_progress: "In progress",
    completed: "Complete",
  };
  return map[status] ?? status;
}

function getJobTimeline(status: string): TimelineStep[] {
  const steps = [
    { id: "submitted", label: "Request received", description: "We're reviewing your details" },
    { id: "estimated", label: "Estimate confirmed", description: "Price locked in" },
    { id: "scheduled", label: "Crew scheduled", description: "We'll confirm your window" },
    { id: "in_progress", label: "Crew on site", description: "Loading in progress" },
    { id: "completed", label: "Job complete", description: "Space restored" },
  ];
  const order = ["submitted", "estimated", "scheduled", "in_progress", "completed"];
  const idx = order.indexOf(status);
  return steps.map((s, i) => ({
    ...s,
    status: i < idx ? "completed" : i === idx ? "current" : "upcoming",
  })) as TimelineStep[];
}

export default function CustomerDashboard() {
  const { company } = useCompany();
  const { data, loading, requiresLogin } = useCustomerPortal();
  const jobs = data?.jobs ?? [];
  const activeJob = jobs.find((j) =>
    ["submitted", "estimated", "scheduled", "in_progress"].includes(j.status)
  );
  const tel = company.phone.replace(/\D/g, "");

  const quickActions = [
    { href: "/book", icon: CalendarPlus, label: "Book", color: "bg-brand-primary" },
    { href: "/customer/payments", icon: CreditCard, label: "Invoices", color: "bg-morris-success" },
    { href: `tel:${tel}`, icon: Phone, label: "Call us", color: "bg-[#0A0A0A]" },
  ];

  if (requiresLogin) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] p-6">
        <CustomerLoginPrompt redirectPath="/customer" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] p-6">
        <p className="text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] pb-32">
      <div className="relative overflow-hidden morris-gradient-bg px-4 pb-8 pt-7 text-white">
        <p className="text-sm font-medium text-white/70">Morris Home</p>
        <h1 className="mt-1 font-heading text-3xl font-medium tracking-tight">Your projects</h1>
        <p className="mt-1 text-sm text-white/60">{company.companyName}</p>

        {activeJob && (
          <PremiumCard className="mt-6 border-0 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <StatusChip label={statusLabel(activeJob.status)} variant="live" />
                  <p className="mt-1 truncate text-sm font-medium">{activeJob.address.street}</p>
                </div>
              </div>
              <Link href={`/customer/jobs/${activeJob.id}`} aria-label="View job">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </PremiumCard>
        )}
      </div>

      <main className="mx-auto -mt-4 max-w-lg px-4 md:max-w-2xl">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-brand-primary/20"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${action.color}`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>

        {activeJob && (
          <section className="mt-8">
            <h2 className="mb-4 font-heading text-xl font-medium tracking-tight">Job progress</h2>
            <PremiumCard className="p-5">
              <Timeline steps={getJobTimeline(activeJob.status)} />
            </PremiumCard>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-medium tracking-tight">Your jobs</h2>
            <ButtonLink
              href="/customer/jobs"
              variant="link"
              className="px-0 text-sm font-semibold text-brand-primary"
            >
              View all
            </ButtonLink>
          </div>
          {jobs.length === 0 ? (
            <PremiumCard className="p-8 text-center">
              <p className="font-medium">No projects yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Book Junk Removal or Hauling and track everything here.
              </p>
              <ButtonLink href="/book" className="mt-5 h-11 rounded-full">
                Book service
              </ButtonLink>
            </PremiumCard>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <JobCard key={job.id} job={job} href={`/customer/jobs/${job.id}`} />
              ))}
            </div>
          )}
        </section>
      </main>

      <FloatingActionButton href="/book" icon={<CalendarPlus className="h-5 w-5" />} label="Book" />
    </div>
  );
}
