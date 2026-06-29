"use client";

import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

export function PublicFooter({ variant = "umbrella" }: { variant?: "umbrella" | "company" }) {
  const { company } = useCompany();
  const hauling = morrisServicesConfig.operatingCompanies[0];
  const isUmbrella = variant === "umbrella";

  return (
    <footer
      className={cn(
        "border-t",
        isUmbrella
          ? "border-border bg-gradient-to-b from-muted/30 to-background text-foreground"
          : "border-border bg-slate-950 text-white"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            {isUmbrella ? (
              <>
                <MorrisServicesLogo height={88} href={undefined} className="max-h-20 md:max-h-24" />
                <p className="mt-3 text-sm text-muted-foreground">{morrisServicesConfig.parentLegalName}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
                  {morrisServicesConfig.brandTagline}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">{hauling.name}</p>
                <p className="mt-1 text-sm text-white/70">
                  A {morrisServicesConfig.publicBrandName} Company
                </p>
                <p className="mt-1 text-xs text-white/50">{morrisServicesConfig.parentLegalName}</p>
              </>
            )}
            <p className={cn("mt-4 text-sm leading-relaxed", isUmbrella ? "text-muted-foreground" : "text-white/80")}>
              {morrisServicesConfig.footerMission}
            </p>
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                isUmbrella ? "text-muted-foreground" : "text-white/60"
              )}
            >
              {isUmbrella ? "Explore" : hauling.name}
            </p>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              {isUmbrella ? (
                <>
                  <Link href="/" className="text-foreground/90 hover:text-brand-primary hover:underline">
                    Home
                  </Link>
                  <Link href="/about" className="text-foreground/90 hover:text-brand-primary hover:underline">
                    About
                  </Link>
                  <Link href="/contact" className="text-foreground/90 hover:text-brand-primary hover:underline">
                    Contact
                  </Link>
                  <Link href={hauling.hubPath} className="text-foreground/90 hover:text-brand-primary hover:underline">
                    {hauling.name}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/junk-removal" className="text-white/90 hover:text-white hover:underline">
                    Home
                  </Link>
                  <Link href="/services" className="text-white/90 hover:text-white hover:underline">
                    Services
                  </Link>
                  <Link href="/pricing" className="text-white/90 hover:text-white hover:underline">
                    Pricing
                  </Link>
                  <Link href="/book" className="text-white/90 hover:text-white hover:underline">
                    Booking info
                  </Link>
                  <Link href="/careers" className="text-white/90 hover:text-white hover:underline">
                    Careers
                  </Link>
                  <Link href="/" className="text-white/90 hover:text-white hover:underline">
                    ← {morrisServicesConfig.publicBrandName}
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                isUmbrella ? "text-muted-foreground" : "text-white/60"
              )}
            >
              Contact
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`tel:${company.phone}`}
                className={cn(
                  "font-semibold hover:underline",
                  isUmbrella ? "text-brand-primary" : "text-white"
                )}
              >
                {company.phone}
              </a>
            </p>
            <p className={cn("mt-2 text-sm", isUmbrella ? "text-muted-foreground" : "text-white/70")}>
              Preparing to serve {company.serviceArea.label ?? PRELAUNCH_SERVICE_AREA}
            </p>
          </div>
        </div>
        <p
          className={cn(
            "mt-8 border-t pt-6 text-center text-xs",
            isUmbrella ? "border-border text-muted-foreground" : "border-white/10 text-white/50"
          )}
        >
          © {new Date().getFullYear()} {morrisServicesConfig.parentLegalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
