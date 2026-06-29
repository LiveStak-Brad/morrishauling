"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { TermsSection } from "@/components/admin/settings/TermsSection";
import { Loader2 } from "lucide-react";

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/company-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTerms(d.settings?.["terms.config"]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageShell
      title="Terms & disclaimers"
      description="Legal copy shown on estimates, invoices, and financing flows."
    >
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading terms…
        </div>
      ) : (
        <div className="max-w-3xl">
          <TermsSection initial={terms} />
        </div>
      )}
    </AdminPageShell>
  );
}
