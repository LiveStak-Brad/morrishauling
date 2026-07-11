"use client";

import Link from "next/link";
import { morrisConfig } from "@/lib/morris-config";
import { MANUAL_PAYMENT_METHODS } from "@/lib/payments/manual-methods";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ButtonLink } from "@/components/ui/button-link";
import { Banknote, Phone } from "lucide-react";

/** Shown when Stripe/online card is off — lists owner-configured manual methods. */
export function OnlinePaymentsDisabledNotice({ className }: { className?: string }) {
  const phone = morrisConfig.phone;
  const phoneDigits = phone.replace(/\D/g, "");

  return (
    <PremiumCard className={`border-black/5 bg-white p-5 text-sm ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          <Banknote className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-semibold">How to pay this invoice</p>
          <p className="mt-1 text-muted-foreground">
            Online card checkout is not enabled yet. Use one of the methods below, or call us to arrange
            payment.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {MANUAL_PAYMENT_METHODS.map((m) => (
          <li key={m.id} className="rounded-xl border border-black/5 bg-[#F7F5F2] px-4 py-3">
            <p className="font-semibold">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
          </li>
        ))}
      </ul>

      <a
        href={`tel:${phoneDigits}`}
        className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"
      >
        <Phone className="h-4 w-4" />
        {phone}
      </a>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/customer/financing" variant="outline" size="sm">
          Request financing
        </ButtonLink>
        <ButtonLink href="/contact" variant="outline" size="sm">
          Contact office
        </ButtonLink>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Prefer to message us?{" "}
        <Link href="/customer" className="font-medium text-brand-primary hover:underline">
          Open your account
        </Link>
      </p>
    </PremiumCard>
  );
}
