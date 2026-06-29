"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { ADMIN_NAV } from "./AdminSidebar";
import { usePathname } from "next/navigation";

interface AdminPageShellProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  action,
  children,
}: AdminPageShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-4 pb-24 md:pb-8">
        <div className="mb-4 md:hidden">
          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Menu className="mr-2 h-4 w-4" /> Admin menu
            </SheetTrigger>
            <SheetContent side="left" className="w-64 overflow-y-auto">
              <nav className="mt-8 space-y-1">
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm",
                      pathname === item.href ? "bg-brand-primary text-white" : ""
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <PageHeader title={title} description={description} action={action} />
        {children}
      </div>
    </div>
  );
}
