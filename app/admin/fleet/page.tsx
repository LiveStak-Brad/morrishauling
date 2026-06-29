"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminFleetPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Trucks & trailers">
      <h3 className="mb-2 font-medium">Trucks</h3>
      <div className="mb-6 space-y-2">
        {company.trucks.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex justify-between p-4">
              <span>{t.name}</span>
              <Badge variant="outline">{t.licensePlate}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <h3 className="mb-2 font-medium">Trailers</h3>
      <div className="space-y-2">
        {company.trailers.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex justify-between p-4">
              <span>{t.name}</span>
              <Badge>{t.capacityPercent}% capacity</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
