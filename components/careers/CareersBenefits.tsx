import { PremiumCard } from "@/components/morris/PremiumCard";
import { CAREERS_BENEFITS } from "@/lib/careers/constants";
import { DollarSign, TrendingUp, Users, MapPin, Truck, Building2 } from "lucide-react";

const ICONS = [DollarSign, TrendingUp, Users, MapPin, Truck, Building2];

export function CareersBenefits() {
  return (
    <section className="bg-[#F8F9FB] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#0A0A0A]">Why Work With Morris</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            We invest in people who show up, work hard, and care about doing the job right.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAREERS_BENEFITS.map((benefit, i) => {
            const Icon = ICONS[i] ?? Users;
            return (
              <PremiumCard key={benefit.title} className="p-6 h-full border border-black/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </PremiumCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
