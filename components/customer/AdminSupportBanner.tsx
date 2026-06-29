"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAdmin } from "@/lib/auth/permissions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export function AdminSupportBanner() {
  const { profile } = useAuth();

  if (!profile || !isAdmin(profile)) return null;

  return (
    <div className="border-b border-sky-300 bg-sky-50 px-4 py-2">
      <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 md:max-w-6xl">
        <Shield className="h-4 w-4 shrink-0 text-sky-800" />
        <span className="text-sm font-semibold text-sky-950">Admin support view</span>
        <span className="text-xs text-sky-800">Read-only customer portal preview.</span>
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto h-8")}
        >
          Back to Mission Control
        </Link>
      </div>
    </div>
  );
}
