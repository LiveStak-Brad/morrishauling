"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ServicesCatalogSection } from "@/components/admin/settings/ServicesCatalogSection";
import { Loader2 } from "lucide-react";

export default function AdminServicesPage() {
  const [catalog, setCatalog] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/company-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCatalog(d.settings?.["services.catalog"]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageShell
      title="Services"
      description="Manage service offerings shown to customers during booking and on the website."
    >
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading services…
        </div>
      ) : (
        <div className="max-w-3xl">
          <ServicesCatalogSection initial={catalog} />
        </div>
      )}
    </AdminPageShell>
  );
}
