"use client";

import Link from "next/link";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import {
  ArrowRight,
  Star,
  Shield,
  Zap,
  Clock,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroBanner, ServiceAreaStrip } from "@/components/public/HeroBanner";
import { useCompany } from "@/lib/company-context";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { BOOKING_CATEGORIES } from "@/lib/booking-categories";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { company } = useCompany();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeroBanner>
        <PublicHeader floating />

        {/* CTAs sit low — banner artwork carries the headline */}
        <section className="relative mx-auto mt-auto flex w-full max-w-lg flex-col px-4 pb-8 pt-24 md:max-w-6xl md:pb-12 md:pt-28">
          <div
            className="ml-auto w-full max-w-xl animate-slide-up opacity-0 md:max-w-md"
            style={{ animationFillMode: "forwards" }}
          >
            <div className="rounded-2xl bg-black/50 p-5 ring-1 ring-white/15 backdrop-blur-md sm:p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                Rated 4.9 · Same-week pickups
              </div>

              <p className="text-lg font-semibold leading-snug text-white sm:text-xl">
                Book online in minutes — upfront price, pro crew, no surprises.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/book"
                  size="lg"
                  className="h-12 flex-1 rounded-xl bg-brand-primary text-base font-semibold shadow-lg hover:bg-brand-primary/90 sm:h-13"
                >
                  Get instant estimate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </ButtonLink>
                <ButtonLink
                  href="/customer"
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/35 bg-white/10 text-base font-semibold text-white hover:bg-white/20 hover:text-white sm:h-13"
                >
                  Track pickup
                </ButtonLink>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { value: "2hr", label: "Avg response" },
                { value: "4.9★", label: "Rating" },
                { value: "45mi", label: "Service area" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="animate-slide-up rounded-xl bg-black/40 px-2 py-2.5 text-center ring-1 ring-white/10 backdrop-blur-sm opacity-0"
                  style={{
                    animationDelay: `${0.08 + i * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wide text-white/65">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </HeroBanner>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 md:max-w-6xl md:pb-16">
        <section className="py-6">
          <ServiceAreaStrip />
        </section>

        <section className="py-8">
          <SectionHeader
            title="Why Morris?"
            subtitle="The premium junk removal experience"
            size="lg"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Instant estimates",
                desc: "Know your price before we arrive. No surprises.",
                color: "from-orange-500/20 to-orange-600/5",
              },
              {
                icon: Shield,
                title: "Licensed & insured",
                desc: "Professional crews. Fully equipped trucks.",
                color: "from-blue-500/20 to-blue-600/5",
              },
              {
                icon: Clock,
                title: "On-time guarantee",
                desc: "We respect your schedule. Text updates included.",
                color: "from-green-500/20 to-green-600/5",
              },
            ].map((item, i) => (
              <PremiumCard
                key={item.title}
                interactive
                className={cn(
                  "p-6 bg-gradient-to-br",
                  item.color,
                  "animate-slide-up opacity-0"
                )}
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" } as React.CSSProperties}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </PremiumCard>
            ))}
          </div>
        </section>

        <section className="py-6">
          <SectionHeader
            title="What can we haul?"
            subtitle="Tap a category to start your booking"
            action={
              <ButtonLink href="/book" variant="link" className="text-brand-primary font-semibold">
                See all →
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {BOOKING_CATEGORIES.slice(0, 8).map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/book?category=${cat.id}`}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border border-transparent p-4 text-center transition-all",
                    "bg-gradient-to-br hover:border-brand-primary/20 hover:shadow-md",
                    cat.gradient,
                    "animate-scale-in opacity-0"
                  )}
                  style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "forwards" }}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-110",
                      cat.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="py-8">
          <PremiumCard className="overflow-hidden p-0">
            <div className="morris-gradient-bg p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <span className="text-sm font-semibold text-white/80">
                      Ready when you are
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold md:text-3xl">
                    Book your pickup in under 3 minutes
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {["Live price estimate", "Photo upload", "Flexible scheduling"].map(
                      (t) => (
                        <li key={t} className="flex items-center gap-2 text-sm text-white/90">
                          <CheckCircle2 className="h-4 w-4 text-white/70" />
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <ButtonLink
                  href="/book"
                  size="lg"
                  className="h-14 shrink-0 rounded-2xl bg-white px-8 text-brand-primary font-bold hover:bg-white/90"
                >
                  Start booking
                </ButtonLink>
              </div>
            </div>
          </PremiumCard>
        </section>

        <section className="py-8 text-center">
          <CompanyLogo height={64} width={220} className="mx-auto !h-16 !w-16" />
          <p className="mt-3 text-sm text-muted-foreground">
            Proudly serving {company.serviceArea.label ?? "your area"} · {company.phone}
          </p>
        </section>
      </main>
    </div>
  );
}