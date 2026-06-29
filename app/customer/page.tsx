"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  CreditCard,
  Gift,
  MessageCircle,
  Star,
  Truck,
  Upload,
} from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { getJobs, DEMO_CUSTOMER_IDS } from "@/lib/mock-data";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { JobCard } from "@/components/customer/JobCard";
import { FloatingActionButton } from "@/components/morris/Fab";
import { Timeline, type TimelineStep } from "@/components/morris/Timeline";

function getJobTimeline(status: string): TimelineStep[] {
  const steps = [
    { id: "submitted", label: "Request received", description: "We're reviewing your details" },
    { id: "estimated", label: "Estimate confirmed", description: "Price locked in" },
    { id: "scheduled", label: "Crew scheduled", description: "You'll get a text when we're on the way" },
    { id: "in_progress", label: "Crew on site", description: "Loading in progress" },
    { id: "completed", label: "Job complete", description: "Thank you!" },
  ];
  const order = ["submitted", "estimated", "scheduled", "in_progress", "completed"];
  const idx = order.indexOf(status);
  return steps.map((s, i) => ({
    ...s,
    status: i < idx ? "completed" : i === idx ? "current" : "upcoming",
    time: i === idx && status === "scheduled" ? "Today, 10am–2pm" : undefined,
  })) as TimelineStep[];
}

export default function CustomerDashboard() {
  const { company, companyId } = useCompany();
  const customerId = DEMO_CUSTOMER_IDS[companyId];
  const jobs = getJobs(companyId).filter((j) => j.customerId === customerId);
  const activeJob = jobs.find((j) =>
    ["submitted", "estimated", "scheduled", "in_progress"].includes(j.status)
  );

  const quickActions = [
    { href: "/book", icon: CalendarPlus, label: "Book pickup", color: "bg-brand-primary" },
    { href: "/customer/payments", icon: CreditCard, label: "Pay invoice", color: "bg-morris-success" },
    { href: "#", icon: MessageCircle, label: "Chat", color: "bg-morris-info" },
    { href: "#", icon: Gift, label: "Refer", color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero header */}
      <div className="relative overflow-hidden morris-gradient-bg px-4 pb-8 pt-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm font-medium text-white/70">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold">Your pickups</h1>
        <p className="mt-1 text-sm text-white/60">{company.companyName}</p>

        {activeJob && (
          <PremiumCard className="mt-6 border-0 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <StatusChip label="Crew en route" variant="live" pulse />
                  <p className="mt-1 text-sm font-medium">{activeJob.address.street}</p>
                </div>
              </div>
              <Link href={`/customer/jobs/${activeJob.id}`}>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </PremiumCard>
        )}
      </div>

      <main className="mx-auto max-w-lg px-4 -mt-4 md:max-w-2xl">
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 shadow-sm transition-transform hover:scale-105"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>

        {activeJob && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold">Live tracking</h2>
            <PremiumCard className="p-5">
              <Timeline steps={getJobTimeline(activeJob.status)} />
            </PremiumCard>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Your jobs</h2>
            <ButtonLink href="/customer/jobs" variant="link" className="text-brand-primary text-sm font-semibold px-0">
              View all
            </ButtonLink>
          </div>
          <div className="space-y-3">
            {jobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} href={`/customer/jobs/${job.id}`} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <PremiumCard className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Love our service?</p>
              <p className="text-sm text-muted-foreground">Leave a review & earn $10 off</p>
            </div>
            <Upload className="h-5 w-5 text-muted-foreground" />
          </PremiumCard>
        </section>
      </main>

      <FloatingActionButton
        href="/book"
        icon={<CalendarPlus className="h-5 w-5" />}
        label="Book"
      />
    </div>
  );
}
