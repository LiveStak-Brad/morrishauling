"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import type { HrNavStats } from "@/types/hr/nav";
import {
  Briefcase,
  Users,
  UserCog,
  FileText,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  Wrench,
  Truck,
  MapPin,
  Settings,
  Palette,
  ClipboardCheck,
  ScrollText,
  LayoutDashboard,
  Radio,
  Building2,
  UserSearch,
  ClipboardList,
  Shield,
  GraduationCap,
  Timer,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const HR_NAV = [
  { href: "/admin/hr", label: "HR Dashboard", icon: LayoutDashboard, badgeKey: null as keyof HrNavStats | null },
  { href: "/admin/hr/applicants", label: "Applicants", icon: UserSearch, badgeKey: "activeApplicants" as const },
  { href: "/admin/hr/employees", label: "HR Employees", icon: Users, badgeKey: null },
  { href: "/admin/hr/onboarding", label: "Onboarding", icon: ClipboardList, badgeKey: "onboardingIncomplete" as const },
  { href: "/admin/hr/postings", label: "Job Postings", icon: Briefcase, badgeKey: null },
  { href: "/admin/hr/payroll", label: "Payroll", icon: DollarSign, badgeKey: "payrollPending" as const },
  { href: "/admin/hr/taxes", label: "Tax Tracking", icon: Receipt, badgeKey: null },
  { href: "/admin/hr/time", label: "Time & Attendance", icon: Timer, badgeKey: null },
  { href: "/admin/hr/schedule", label: "Scheduling", icon: Calendar, badgeKey: null },
  { href: "/admin/hr/compliance", label: "Compliance", icon: Shield, badgeKey: "expiringDocuments" as const },
  { href: "/admin/hr/training", label: "Training", icon: GraduationCap, badgeKey: null },
  { href: "/admin/hr/equipment", label: "Equipment", icon: Wrench, badgeKey: null },
  { href: "/admin/hr/performance", label: "Performance", icon: ClipboardCheck, badgeKey: null },
];

export const ADMIN_NAV = [
  { href: "/admin", label: "Mission Control", icon: LayoutDashboard },
  { href: "/admin/hr", label: "HR Platform", icon: Building2, badgeKey: "hrTotal" as const },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/financing", label: "Financing", icon: DollarSign },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/fleet", label: "Fleet", icon: Truck },
  { href: "/admin/dump-sites", label: "Disposal", icon: MapPin },
  { href: "/admin/disposal-review", label: "Disposal review", icon: ClipboardCheck },
  { href: "/planner", label: "Dispatch", icon: Radio },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/terms", label: "Terms", icon: ScrollText },
  { href: "/admin/branding", label: "Branding", icon: Palette },
];

export { HR_NAV };

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center px-1.5 text-[10px]">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [hrStats, setHrStats] = useState<HrNavStats | null>(null);
  const inHrSection = pathname.startsWith("/admin/hr");
  const [hrExpanded, setHrExpanded] = useState(inHrSection);

  useEffect(() => {
    fetch("/api/hr/nav-stats")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setHrStats(d.stats); })
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    if (inHrSection) setHrExpanded(true);
  }, [inHrSection]);

  const hrTotalBadge =
  hrStats
    ? hrStats.activeApplicants + hrStats.onboardingIncomplete + hrStats.payrollPending + hrStats.expiringDocuments
    : 0;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card md:block">
      <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
        <div className="mb-6 rounded-2xl border border-border/60 bg-white px-4 py-3">
          <CompanyLogo href="/admin" height={48} width={180} className="!h-12 !w-12" />
          <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Owner Console
          </p>
        </div>
        <nav className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isHrRoot = item.href === "/admin/hr";
            const active = isHrRoot ? inHrSection : pathname === item.href;
            const badgeCount = isHrRoot ? hrTotalBadge : 0;

            if (isHrRoot) {
              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-brand-primary text-white shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      <NavBadge count={badgeCount} />
                    </Link>
                    <button
                      type="button"
                      aria-label={hrExpanded ? "Collapse HR menu" : "Expand HR menu"}
                      onClick={() => setHrExpanded((v) => !v)}
                      className={cn(
                        "rounded-lg p-2 text-muted-foreground hover:bg-muted",
                        active && "text-white hover:bg-white/10"
                      )}
                    >
                      {hrExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {hrExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/60 pl-2">
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        ← Mission Control
                      </Link>
                      <Link
                        href="/employee"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Employee portal preview
                      </Link>
                      <Link
                        href="/admin/hr/employees/new"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Create employee
                      </Link>
                      <Link
                        href="/admin/hr/applicants/new"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Create applicant
                      </Link>
                      <Link
                        href="/admin/hr/job-postings/new"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Create job posting
                      </Link>
                      {HR_NAV.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href;
                        const subBadge = sub.badgeKey && hrStats ? hrStats[sub.badgeKey] : 0;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                              subActive
                                ? "bg-brand-primary/10 text-brand-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                            <NavBadge count={subBadge} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand-primary text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
