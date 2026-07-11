"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { morrisServicesConfig } from "@/lib/morris-services-config";

export function CompanyBreadcrumbBar({
  currentLabel,
}: {
  currentLabel?: string;
}) {
  const pathname = usePathname();
  const junk = morrisServicesConfig.operatingCompanies[0];
  const hauling = morrisServicesConfig.haulingDivision;

  const label =
    currentLabel ??
    (pathname?.startsWith("/hauling") ? hauling.name : junk.name);

  return (
    <div className="border-b border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-muted-foreground">
          <Link href="/" className="font-medium hover:text-foreground hover:underline">
            {morrisServicesConfig.publicBrandName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate font-medium text-foreground">{label}</span>
        </nav>
        <Link
          href="/"
          className="shrink-0 font-semibold text-brand-primary hover:underline sm:text-sm"
        >
          ← Back to {morrisServicesConfig.publicBrandName}
        </Link>
      </div>
    </div>
  );
}
