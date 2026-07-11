"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { ButtonLink } from "@/components/ui/button-link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import {
  MORRIS_STANDARD_PILLARS,
  PRELAUNCH_SERVICE_AREA,
} from "@/lib/public-copy";

export default function AboutPage() {
  const junk = morrisServicesConfig.operatingCompanies[0];
  const hauling = morrisServicesConfig.haulingDivision;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 pb-28 sm:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">About</p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          {morrisServicesConfig.promise}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {morrisServicesConfig.publicBrandName} exists to raise the standard for how American homes get
          cared for — one craft, one county, one crew at a time.
        </p>

        <article className="mt-12 space-y-6 text-base leading-relaxed text-foreground/90">
          <p>
            Most home-service experiences feel loud, opaque, and disposable. We are building the opposite:
            a calm relationship with a company that shows its work, explains its price, and treats your
            property like it matters.
          </p>
          <p>
            We start in {PRELAUNCH_SERVICE_AREA} with {junk.name} — junk removal and property cleanouts
            done with protocol, not chaos. When that craft meets the Morris Standard, we add the next —
            including {hauling.name} for equipment and material transport.
          </p>
          <p className="font-medium text-foreground">
            {morrisServicesConfig.footerMission}
          </p>
        </article>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium tracking-tight">The Morris Standard</h2>
          <div className="mt-6 space-y-6">
            {MORRIS_STANDARD_PILLARS.map((pillar) => (
              <div key={pillar.title} className="border-l-2 border-brand-primary/30 pl-5">
                <h3 className="font-semibold">{pillar.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm">
          <div className="flex flex-col items-center bg-gradient-to-br from-brand-primary/8 via-white to-[#F7F5F2] px-6 py-10 text-center">
            <Image
              src="/logo.png?v=4"
              alt={junk.name}
              width={1146}
              height={758}
              unoptimized
              className="h-auto w-full max-w-[14rem] object-contain sm:max-w-[16rem]"
              sizes="256px"
            />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Flagship craft
            </p>
          </div>
          <div className="border-t border-black/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">{junk.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{junk.tagline}</p>
            <ButtonLink href={junk.hubPath} className="mt-6 h-11 rounded-full">
              Enter Junk Removal
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </section>

        <section className="mt-14 rounded-[1.5rem] bg-[#0A0A0A] p-8 text-white">
          <h2 className="font-heading text-2xl font-medium">Talk to us</h2>
          <p className="mt-2 text-sm text-white/65">
            Commercial accounts, careers, or questions about a booking — we&apos;re here.
          </p>
          <a
            href="tel:6367514645"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary/90"
          >
            <Phone className="h-5 w-5" aria-hidden />
            (636) 751-4645
          </a>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-brand-primary hover:underline">
            ← Back to {morrisServicesConfig.publicBrandName}
          </Link>
        </p>
      </main>
      <PublicFooter />
      <StickyMobileConcierge />
    </div>
  );
}
