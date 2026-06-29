"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { useCompany } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicesPage() {
  const { company } = useCompany();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-24 md:max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Services</h1>
        <div className="grid gap-4">
          {company.services.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
