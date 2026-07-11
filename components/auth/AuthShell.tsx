"use client";

import Link from "next/link";
import { morrisConfig } from "@/lib/morris-config";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { PremiumCard } from "@/components/morris/PremiumCard";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-background to-[#C8102E]/10"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-5 md:px-8">
        <Link href="/junk-removal" className="flex items-center gap-3">
          <CompanyLogo height={44} href={undefined} />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight">{morrisConfig.companyName}</p>
            <p className="text-xs text-muted-foreground">
              A {morrisServicesConfig.publicBrandName} Company · {morrisConfig.phone}
            </p>
          </div>
        </Link>
        <Link href="/book" className="text-sm font-semibold text-brand-primary hover:underline">
          Booking info
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <PremiumCard className="p-6 shadow-xl">{children}</PremiumCard>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Preparing to serve {morrisConfig.serviceArea.label}.
        </p>
      </main>
    </div>
  );
}
