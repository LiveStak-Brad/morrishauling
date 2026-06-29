"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { HrDashboard } from "@/components/hr/HrDashboard";

export default function HrDashboardPage() {
  return (
    <AdminPageShell title="HR Command Center" description="Workforce management dashboard">
      <HrDashboard />
    </AdminPageShell>
  );
}
