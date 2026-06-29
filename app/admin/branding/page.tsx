"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BrandingSection } from "@/components/admin/settings/BrandingSection";
import { Loader2 } from "lucide-react";

export default function AdminBrandingPage() {
  const [branding, setBranding] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/company-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setBranding(d.settings?.["branding.config"]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageShell
      title="Branding"
      description="Logo, colors, contact info, and service area messaging."
    >
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading branding…
        </div>
      ) : (
        <div className="max-w-3xl">
          <BrandingSection initial={branding} />
        </div>
      )}
    </AdminPageShell>
  );
}
