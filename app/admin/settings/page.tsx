"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SupabaseStatusCard } from "@/components/admin/SupabaseStatusCard";
import { ProductionEnvWarning } from "@/components/admin/ProductionEnvWarning";
import { QaTestDataWarning } from "@/components/admin/QaTestDataWarning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceAreaSection } from "@/components/admin/settings/ServiceAreaSection";
import { ScheduleCapacitySection } from "@/components/admin/settings/ScheduleCapacitySection";
import { PayDefaultsSection } from "@/components/admin/settings/PayDefaultsSection";
import { DocumentTemplatesSection } from "@/components/admin/settings/DocumentTemplatesSection";
import { EquipmentCategoriesSection } from "@/components/admin/settings/EquipmentCategoriesSection";
import { Loader2 } from "lucide-react";

type EffectiveSettings = {
  serviceArea: unknown;
  scheduleCapacity: unknown;
  payDefaults: unknown;
  documentTemplates: unknown;
  equipmentCategories: unknown;
};

export default function AdminSettingsPage() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [effective, setEffective] = useState<EffectiveSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/company-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.effective) return;
        setEffective({
          serviceArea: d.settings?.["service.areas"] ?? d.effective.serviceArea,
          scheduleCapacity: d.settings?.["schedule.capacity"] ?? d.effective.scheduleCapacity,
          payDefaults: d.settings?.["pay.defaults"] ?? d.effective.payDefaults,
          documentTemplates: d.settings?.["document.templates"] ?? d.effective.documentTemplates,
          equipmentCategories: d.settings?.["equipment.categories"] ?? d.effective.equipmentCategories,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageShell
      title="Company settings"
      description="Manage operations defaults, pay, documents, and equipment — no code required."
    >
      <div className="mb-6 max-w-3xl space-y-4">
        <ProductionEnvWarning />
        <QaTestDataWarning />
        <SupabaseStatusCard />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings…
        </div>
      ) : effective ? (
        <div className="max-w-3xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick contact reference</CardTitle>
              <CardDescription>
                Edit phone, email, and address under{" "}
                <a href="/admin/branding" className="text-brand-primary underline">
                  Branding
                </a>
                . Shown here for reference only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Company</Label>
                <Input defaultValue={company.companyName} readOnly className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input defaultValue={company.phone} readOnly className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={company.email} readOnly className="mt-1 bg-muted/40" />
              </div>
            </CardContent>
          </Card>

          <ServiceAreaSection initial={effective.serviceArea} />
          <ScheduleCapacitySection initial={effective.scheduleCapacity} />
          <PayDefaultsSection initial={effective.payDefaults} />
          <DocumentTemplatesSection initial={effective.documentTemplates} />
          <EquipmentCategoriesSection initial={effective.equipmentCategories} />
        </div>
      ) : (
        <p className="text-destructive text-sm">Could not load company settings.</p>
      )}
    </AdminPageShell>
  );
}
