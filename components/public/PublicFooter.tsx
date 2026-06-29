"use client";

import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";

export function PublicFooter({ variant = "umbrella" }: { variant?: "umbrella" | "company" }) {
  const { company } = useCompany();
  const hauling = morrisServicesConfig.operatingCompanies[0];

  return (
    <footer className="border-t border-border bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            {variant === "company" ? (
              <>
                <p className="text-lg font-bold">{hauling.name}</p>
                <p className="mt-1 text-sm text-white/70">
                  A {morrisServicesConfig.publicBrandName} Company
                </p>
                <p className="mt-1 text-xs text-white/50">{morrisServicesConfig.parentLegalName}</p>
              </>
            ) : (
              <>
                <MorrisServicesLogo height={72} href={undefined} onDark className="max-h-16 md:max-h-[4.5rem]" />
                <p className="mt-3 text-sm text-white/70">{morrisServicesConfig.parentLegalName}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-primary/90">
                  {morrisServicesConfig.brandTagline}
                </p>
              </>
            )}
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {morrisServicesConfig.footerMission}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {variant === "company" ? hauling.name : "Explore"}
            </p>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              {variant === "company" ? (
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
                </>
              ) : (
                <>
                  <Link href="/" className="text-white/90 hover:text-white hover:underline">
                    Home
                  </Link>
                  <Link href="/about" className="text-white/90 hover:text-white hover:underline">
                    About
                  </Link>
                  <Link href="/contact" className="text-white/90 hover:text-white hover:underline">
                    Contact
                  </Link>
                  <Link href={hauling.hubPath} className="text-white/90 hover:text-white hover:underline">
                    {hauling.name}
                  </Link>
                </>
              )}
              <Link href="/" className="text-white/90 hover:text-white hover:underline">
                ← {morrisServicesConfig.publicBrandName}
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">Contact</p>
            <p className="mt-3 text-sm text-white/80">
              <a href={`tel:${company.phone}`} className="font-semibold text-white hover:underline">
                {company.phone}
              </a>
            </p>
            <p className="mt-2 text-sm text-white/70">
              Preparing to serve {company.serviceArea.label ?? PRELAUNCH_SERVICE_AREA}
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {morrisServicesConfig.parentLegalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
