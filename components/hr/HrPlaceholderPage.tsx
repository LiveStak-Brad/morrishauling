"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";

export default function HrPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <AdminPageShell title={title} description={description}>
      <PremiumCard className="p-6 text-center text-muted-foreground">
        Module connected to database — use employee profiles and API for full data.
      </PremiumCard>
    </AdminPageShell>
  );
}
