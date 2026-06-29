"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmployeeTimeCard } from "./EmployeeTimeCard";
import { CurrentAssignmentCard } from "./CurrentAssignmentCard";
import { RouteTimeline } from "./RouteTimeline";
import type { EmployeeDashboardData } from "@/types/hr/employee-portal";
import {
  Clock, Truck, Users, Route, ChevronRight, ClipboardList,
  Calendar, FileText, Wrench, GraduationCap, Palmtree,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export function EmployeeDashboard() {
  const { profile, signOut } = useAuth();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/me/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d.dashboard); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="p-4 text-muted-foreground animate-pulse">Loading your day…</div>;
  }

  if (!data) {
    return (
      <div className="p-4 space-y-3">
        <PremiumCard className="p-6 text-center">
          <p className="text-destructive font-medium">Could not load your dashboard.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure your account is linked to an HR employee record, or sign in with your employee account.
          </p>
        </PremiumCard>
        <div className="flex flex-col gap-2">
          <ButtonLink href="/employee/profile" variant="outline" className="w-full h-11">
            Go to profile
          </ButtonLink>
          <Button
            type="button"
            variant="destructive"
            className="w-full h-11"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const firstName = data.employee.firstName || profile?.full_name?.split(" ")[0] || "there";
  const primaryAction = getPrimaryAction(data);

  return (
    <div className="pb-4">
      <div className="morris-gradient-bg px-4 pb-6 pt-6 text-white">
        <p className="text-sm text-white/70">{data.greeting}</p>
        <h1 className="text-2xl font-bold mt-1">{firstName}</h1>

        <div className="mt-4 space-y-2 text-sm">
          <Row icon={Clock} label="Clock" value={data.clock.stateLabel} />
          <Row icon={Calendar} label="Today" value={data.shiftLabel ?? "—"} />
          {data.crew.length > 0 && (
            <Row icon={Users} label="Crew" value={data.crew.map((c) => c.name).join(", ")} />
          )}
          {data.truckName && <Row icon={Truck} label="Truck" value={data.truckName} />}
          {data.trailerName && <Row icon={Truck} label="Trailer" value={data.trailerName} />}
          <Row icon={Route} label="Route" value={`${data.routeStopCount} stop${data.routeStopCount === 1 ? "" : "s"}`} />
        </div>

        {primaryAction.href ? (
          <ButtonLink
            href={primaryAction.href}
            className="mt-5 h-14 w-full rounded-2xl bg-white text-brand-primary font-bold text-base shadow-lg hover:bg-white/95 flex items-center justify-center"
          >
            {primaryAction.label}
          </ButtonLink>
        ) : (
          <Button
            className="mt-5 h-14 w-full rounded-2xl bg-white text-brand-primary font-bold text-base shadow-lg"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {data.onboarding && data.onboarding.percentComplete < 100 && (
          <Link href="/employee/onboarding">
            <PremiumCard className="p-4 flex items-center justify-between border-amber-200 bg-amber-50/80">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-semibold text-amber-900">Onboarding {data.onboarding.percentComplete}%</p>
                  <p className="text-xs text-amber-700">Complete required tasks</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-700" />
            </PremiumCard>
          </Link>
        )}

        {(data.trainingOverdueCount ?? 0) > 0 && (
          <Link href="/employee/training">
            <PremiumCard className="p-4 flex items-center justify-between border-red-200 bg-red-50/80">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-red-700" />
                <div>
                  <p className="font-semibold text-red-900">{data.trainingOverdueCount} training due</p>
                  <p className="text-xs text-red-700">Complete or renew required courses</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-red-700" />
            </PremiumCard>
          </Link>
        )}

        {(data.pendingDocumentsCount ?? 0) > 0 && (
          <Link href="/employee/documents">
            <PremiumCard className="p-4 flex items-center justify-between border-blue-200 bg-blue-50/80">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-semibold text-blue-900">{data.pendingDocumentsCount} document(s) to sign</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-700" />
            </PremiumCard>
          </Link>
        )}

        {data.weather && (
          <PremiumCard className="p-3 text-sm flex justify-between items-center">
            <span className="text-muted-foreground">Warrenton weather</span>
            <span className="font-medium">{data.weather.tempF}°F · {data.weather.condition}</span>
          </PremiumCard>
        )}

        {(data.hoursThisWeek ?? 0) > 0 && (
          <PremiumCard className="p-3 text-sm">
            <p>
              <strong>{data.hoursThisWeek}h</strong> this week
              {data.projectedPaycheck != null && (
                <span className="text-muted-foreground"> · est. gross ${data.projectedPaycheck}</span>
              )}
            </p>
          </PremiumCard>
        )}

        {data.announcements?.map((a) => (
          <PremiumCard key={a.id} className="p-3 text-sm">
            <p className="font-medium">{a.title}</p>
            <div className="text-muted-foreground mt-1 prose prose-sm" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
          </PremiumCard>
        ))}

        <CurrentAssignmentCard job={data.currentJob} />
        <RouteTimeline stops={data.routeStops} />

        <EmployeeTimeCard
          clock={data.clock}
          employeeId={data.employee.id}
          compact
          onPunch={load}
        />

        <QuickLinks />
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-white/60 shrink-0" />
      <span className="text-white/60 shrink-0">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function getPrimaryAction(data: EmployeeDashboardData): {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
} {
  if (data.clock.state === "out") {
    return { label: "Clock In", href: "/employee/clock" };
  }
  if (data.currentJob?.status === "in_progress") {
    return { label: "Complete Job", href: `/employee/jobs/${data.currentJob.id}` };
  }
  if (data.currentJob) {
    return { label: "Start Route", href: `/employee/jobs/${data.currentJob.id}` };
  }
  if (data.todayJobs.length > 0) {
    return { label: "View Route", href: `/employee/jobs/${data.todayJobs[0].id}` };
  }
  if (data.clock.state === "in") {
    return { label: "Clock Out", href: "/employee/clock" };
  }
  return { label: "View Schedule", href: "/employee/schedule" };
}

function QuickLinks() {
  const links = [
    { href: "/employee/schedule", label: "Schedule", icon: Calendar },
    { href: "/employee/time-off", label: "Time Off", icon: Palmtree },
    { href: "/employee/documents", label: "Documents", icon: FileText },
    { href: "/employee/training", label: "Training", icon: GraduationCap },
    { href: "/employee/equipment", label: "Equipment", icon: Wrench },
    { href: "/employee/profile", label: "Profile", icon: Users },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <PremiumCard className="p-3 text-center hover:shadow-md transition-shadow h-full">
            <Icon className="h-5 w-5 mx-auto text-brand-primary mb-1" />
            <p className="text-xs font-semibold">{label}</p>
          </PremiumCard>
        </Link>
      ))}
    </div>
  );
}
