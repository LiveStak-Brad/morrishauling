"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { morrisConfig } from "@/lib/morris-config";
import { toast } from "@/lib/toast";
import { saveCompanySetting } from "@/lib/admin/save-company-setting";
import { PricingItemPricesSection } from "@/components/admin/settings/PricingItemPricesSection";
import { HaulingRatesSection } from "@/components/admin/settings/HaulingRatesSection";
import { DisposalCategoriesSection } from "@/components/admin/settings/DisposalCategoriesSection";
import { Loader2 } from "lucide-react";

type LoadTier = { tier: string; label: string; trailerPercent: number; basePrice: number };
type Modifier = { id: string; label: string; amount: number; type: string };

export default function AdminPricingPage() {
  const { company } = useCompany();
  const jp = morrisConfig.junkRemovalPricing;
  const [loadTiers, setLoadTiers] = useState<LoadTier[]>(company.pricingRules.loadTiers);
  const [modifiers, setModifiers] = useState<Modifier[]>(company.pricingRules.modifiers);
  const [minCharge, setMinCharge] = useState(String(company.pricingRules.minCharge));
  const [dumpFee, setDumpFee] = useState(String(company.pricingRules.dumpFee));
  const [itemPrices, setItemPrices] = useState<unknown>(null);
  const [haulingRates, setHaulingRates] = useState<unknown>(null);
  const [disposalCategories, setDisposalCategories] = useState<unknown>(null);
  const [fromDb, setFromDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/company-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.pricing) return;
        if (d.pricing.loadTiers?.length) {
          setLoadTiers(d.pricing.loadTiers);
          setFromDb(true);
        }
        if (d.pricing.modifiers?.length) setModifiers(d.pricing.modifiers);
        if (d.pricing.minCharge != null) setMinCharge(String(d.pricing.minCharge));
        if (d.pricing.dumpFee != null) setDumpFee(String(d.pricing.dumpFee));
        setItemPrices(d.settings?.["pricing.item_prices"] ?? d.pricing.itemPrices);
        setHaulingRates(d.settings?.["pricing.hauling_rates"] ?? d.pricing.haulingRates);
        setDisposalCategories(d.settings?.["pricing.disposal_categories"] ?? d.pricing.disposalCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveCorePricing = async () => {
    setSaving(true);
    try {
      await saveCompanySetting("pricing.load_tiers", loadTiers);
      await saveCompanySetting("pricing.modifiers", modifiers);
      await saveCompanySetting("pricing.min_charge", Number(minCharge));
      await saveCompanySetting("pricing.dump_fee", Number(dumpFee));
      toast.success("Core pricing saved");
      setFromDb(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      title="Pricing rules"
      description={fromDb ? "Using admin-edited database settings" : "Showing morris-config fallbacks — save to override"}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading pricing…
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Single item pickup</CardTitle>
              <CardDescription>Reference defaults from morris-config — tune item rows below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Priced per item from the common items catalog. Pickup service fee: ${jp.baseServiceFee}.
              </p>
              <p className="text-muted-foreground">Minimum single-item job: ${jp.minimumSingleItemPickup}</p>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Volume / trailer tiers</CardTitle>
              <CardDescription>Base prices by trailer load percentage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadTiers.map((t, i) => (
                <div key={t.tier} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-[140px] font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground w-12">{t.trailerPercent}%</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      type="number"
                      className="w-28 pl-5"
                      value={t.basePrice}
                      onChange={(e) => {
                        const next = [...loadTiers];
                        next[i] = { ...t, basePrice: Number(e.target.value) };
                        setLoadTiers(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Minimum charge</label>
                  <Input type="number" className="mt-1" value={minCharge} onChange={(e) => setMinCharge(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Dump fee default</label>
                  <Input type="number" className="mt-1" value={dumpFee} onChange={(e) => setDumpFee(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Junk removal modifiers</CardTitle>
              <CardDescription>Flat surcharges and discounts applied during estimation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {modifiers.map((m, i) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Input
                    className="flex-1 min-w-[120px]"
                    value={m.label}
                    onChange={(e) => {
                      const next = [...modifiers];
                      next[i] = { ...m, label: e.target.value };
                      setModifiers(next);
                    }}
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      type="number"
                      className="w-28 pl-5"
                      value={m.amount}
                      onChange={(e) => {
                        const next = [...modifiers];
                        next[i] = { ...m, amount: Number(e.target.value) };
                        setModifiers(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={() => void saveCorePricing()} disabled={saving}>
                {saving ? "Saving…" : "Save tiers & modifiers"}
              </Button>
            </CardContent>
          </Card>

          {itemPrices != null ? <PricingItemPricesSection initial={itemPrices} /> : null}
          {haulingRates != null ? <HaulingRatesSection initial={haulingRates} /> : null}
          {disposalCategories != null ? <DisposalCategoriesSection initial={disposalCategories} /> : null}

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Travel & minimums (morris-config fallback)</CardTitle>
              <CardDescription>Read-only reference — contact dev to expose these in admin if needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Minimum travel charge</span><span>${jp.minimumTravelFee}</span></div>
              <div className="flex justify-between"><span>Minimum dispatch fee</span><span>${jp.minimumDispatchFee}</span></div>
              <div className="flex justify-between"><span>Minimum fuel charge</span><span>${jp.minimumFuelFee}</span></div>
              <div className="flex justify-between"><span>Minimum job price (volume)</span><span>${jp.minimumJobPrice}</span></div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminPageShell>
  );
}
