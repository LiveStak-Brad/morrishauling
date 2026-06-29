"use client";

import Link from "next/link";
import { morrisConfig } from "@/lib/morris-config";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ButtonLink } from "@/components/ui/button-link";
import { Phone } from "lucide-react";

export function OnlinePaymentsDisabledNotice({ className }: { className?: string }) {
  const phone = morrisConfig.phone;
  const phoneDigits = phone.replace(/\D/g, "");

  return (
    <PremiumCard className={`border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950 ${className ?? ""}`}>
      <p className="font-semibold">Online payments are not enabled yet</p>
      <p className="mt-2 text-amber-900">
        Please contact Morris Hauling to pay your balance. We accept cash and check in the field, and our
        team can help with payment arrangements.
      </p>
      <a
        href={`tel:${phoneDigits}`}
        className="mt-3 inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"
      >
        <Phone className="h-4 w-4" />
        {phone}
      </a>
      <div className="mt-4">
        <ButtonLink href="/customer/financing" variant="outline" size="sm">
          Request financing
        </ButtonLink>
      </div>
    </PremiumCard>
  );
}
