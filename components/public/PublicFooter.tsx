"use client";

import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { FacebookFollow } from "@/components/seo/FacebookFollow";
import { PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";
import { SEO_ORG } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

export function PublicFooter({ variant = "umbrella" }: { variant?: "umbrella" | "company" }) {
  const { company } = useCompany();
  const junk = morrisServicesConfig.operatingCompanies[0];
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
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
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
                <p className="text-lg font-bold">{junk.name}</p>
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
              Services
            </p>
            <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer services">
              <Link
                href="/junk-removal"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Morris Junk Removal
              </Link>
              <Link
                href="/junk-removal/services"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Junk removal services
              </Link>
              <Link
                href="/junk-removal/areas"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Junk removal areas
              </Link>
              <Link
                href="/hauling"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Morris Hauling
              </Link>
              <Link
                href="/hauling/services"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Hauling services
              </Link>
              <Link
                href="/hauling/areas"
                className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}
              >
                Hauling areas
              </Link>
            </nav>
          </div>

          <div>
            <p
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                isUmbrella ? "text-muted-foreground" : "text-white/60"
              )}
            >
              Company
            </p>
            <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer company">
              <Link href="/" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                Home
              </Link>
              <Link href="/about" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                About
              </Link>
              <Link href="/pricing" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                Pricing
              </Link>
              <Link href="/book" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                Request an estimate
              </Link>
              <Link href="/contact" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                Contact
              </Link>
              <Link href="/careers" className={cn(isUmbrella ? "hover:text-brand-primary hover:underline" : "text-white/90 hover:underline")}>
                Careers
              </Link>
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
              {PRELAUNCH_SERVICE_AREA}
            </p>
            <p className={cn("mt-1 text-xs", isUmbrella ? "text-muted-foreground" : "text-white/50")}>
              Service-area business — no public storefront.
            </p>
            <a
              href={SEO_ORG.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline",
                isUmbrella ? "text-[#1877F2]" : "text-white"
              )}
            >
              Follow on Facebook
            </a>
          </div>
        </div>

        <div className="mt-8">
          <FacebookFollow
            compact
            className={cn(
              isUmbrella ? "" : "border-white/15 bg-white/5 text-white [&_a]:border-white/20 [&_a]:bg-white/10 [&_a]:text-white"
            )}
          />
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
