"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { useCompany } from "@/lib/company-context";
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
  ScrollText,
  LayoutDashboard,
  Radio,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Mission Control", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/financing", label: "Financing", icon: DollarSign },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/fleet", label: "Fleet", icon: Truck },
  { href: "/admin/dump-sites", label: "Dump Sites", icon: MapPin },
  { href: "/planner", label: "Dispatch", icon: Radio },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/terms", label: "Terms", icon: ScrollText },
  { href: "/admin/branding", label: "Branding", icon: Palette },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { company } = useCompany();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card md:block">
      <div className="sticky top-0 p-4">
        <div className="mb-6 rounded-2xl border border-border/60 bg-white px-4 py-3">
          <CompanyLogo href="/admin" height={48} width={180} className="!h-12 !w-12" />
          <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Owner Console
          </p>
        </div>
        <nav className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
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

export { ADMIN_NAV };
