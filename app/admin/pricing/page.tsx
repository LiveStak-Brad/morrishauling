"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPricingPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Pricing rules">
      <Card>
        <CardHeader>
          <CardTitle>Load tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {company.pricingRules.loadTiers.map((t) => (
            <div key={t.tier} className="flex justify-between text-sm">
              <span>{t.label}</span>
              <span>${t.basePrice}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {company.pricingRules.modifiers.map((m) => (
            <div key={m.id} className="flex justify-between text-sm">
              <span>{m.label}</span>
              <span>{m.amount >= 0 ? "+" : ""}${m.amount}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
