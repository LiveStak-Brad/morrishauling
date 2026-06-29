"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCustomersPanel } from "@/components/admin/AdminDepthPanels";

export default function AdminCustomersPage() {
  return (
    <AdminPageShell title="Customers" description="Callbacks, follow-ups, and interaction history">
      <AdminCustomersPanel />
    </AdminPageShell>
  );
}
