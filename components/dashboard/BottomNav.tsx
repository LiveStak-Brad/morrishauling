"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Briefcase,
  CalendarPlus,
  CreditCard,
  User,
  Truck,
  Map,
  LayoutDashboard,
  Settings,
  Radio,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  customer: [
    { href: "/customer", label: "Home", icon: Home },
    { href: "/customer/jobs", label: "Jobs", icon: Briefcase },
    { href: "/book", label: "Book", icon: CalendarPlus },
    { href: "/customer/payments", label: "Pay", icon: CreditCard },
    { href: "/login", label: "Account", icon: User },
  ],
  employee: [
    { href: "/employee", label: "Today", icon: Truck },
    { href: "/employee", label: "Route", icon: Map, match: "/employee" },
    { href: "/login", label: "Profile", icon: User },
  ],
  planner: [
    { href: "/planner", label: "Dispatch", icon: Radio },
    { href: "/planner", label: "Routes", icon: Map },
    { href: "/planner", label: "Schedule", icon: CalendarPlus },
  ],
  admin: [
    { href: "/admin", label: "Control", icon: LayoutDashboard },
    { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  platform_admin: [
    { href: "/platform", label: "Platform", icon: LayoutDashboard },
  ],
};

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useRole();
  const items = NAV_BY_ROLE[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-auto max-w-lg px-3 pb-safe">
        <div className="morris-glass flex items-center justify-around rounded-2xl border border-white/50 px-1 py-2 shadow-lg">
          {items.map((item, idx) => {
            const matchPath = item.match ?? item.href;
            const active =
              pathname === matchPath ||
              (matchPath !== "/" && pathname.startsWith(matchPath + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={`${item.href}-${item.label}-${idx}`}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200",
                  active
                    ? "text-brand-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-brand-primary/10" />
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="relative text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
