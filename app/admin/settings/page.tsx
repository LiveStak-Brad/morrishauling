"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SupabaseStatusCard } from "@/components/admin/SupabaseStatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Company settings">
      <div className="mb-6 max-w-2xl">
        <SupabaseStatusCard />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contact info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Company name</Label>
            <Input defaultValue={company.companyName} readOnly />
          </div>
          <div>
            <Label>Phone</Label>
            <Input defaultValue={company.phone} readOnly />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={company.email} readOnly />
          </div>
          <div>
            <Label>Website</Label>
            <Input defaultValue={company.website} readOnly />
          </div>
          <p className="text-xs text-muted-foreground">
            Edit placeholder — will connect to admin settings store / Supabase later.
          </p>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
