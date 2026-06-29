"use client";

import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBrandingPage() {
  const { company } = useCompany();
  const { brandColors } = company;

  return (
    <AdminPageShell title="Branding">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyLogo height={64} width={220} className="!h-16 !w-16" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Brand colors</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(brandColors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border"
                style={{ backgroundColor: value }}
              />
              <div>
                <p className="text-xs capitalize">{key}</p>
                <p className="text-xs text-muted-foreground">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
