"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function AdminTermsPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Terms & disclaimers">
      <Card>
        <CardHeader>
          <CardTitle>Estimate disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea defaultValue={company.estimateDisclaimer} rows={5} readOnly />
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
