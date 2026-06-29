"use client";

import { useState } from "react";
import { useCompany } from "@/lib/company-context";
import { listCompanies } from "@/lib/mock-company";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function PlatformAdminPage() {
  const { companyId, setCompanyId } = useCompany();
  const companies = listCompanies();
  const [features, setFeatures] = useState({
    financing: true,
    routePlanner: true,
    payments: true,
    multiTrailer: false,
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 md:max-w-4xl">
      <PageHeader
        title="Platform Super Admin"
        description="SaaS control panel (placeholder)"
      />

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Companies</h2>
        <div className="space-y-3">
          {companies.map((c) => (
            <Card key={c.companyId}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Image src={c.logo} alt={c.companyName} width={80} height={28} />
                  <div>
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-xs text-muted-foreground">{c.companyId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {companyId === c.companyId && <Badge>Active</Badge>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCompanyId(c.companyId)}
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Dialog>
          <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Add new company
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add company (placeholder)</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Company onboarding wizard will be built here for SaaS tenants.
            </p>
          </DialogContent>
        </Dialog>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Subscription & billing</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Placeholder</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Plan: Professional · $99/mo per company</p>
            <p className="mt-1">Billing integration (Stripe Billing) coming soon.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Feature toggles</h2>
        <Card>
          <CardContent className="space-y-4 p-4">
            {Object.entries(features).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={(c) =>
                    setFeatures((f) => ({ ...f, [key]: c }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
