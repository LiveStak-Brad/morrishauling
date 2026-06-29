"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFleetPanel } from "@/components/admin/AdminDepthPanels";

export default function AdminFleetPage() {
  return (
    <AdminPageShell title="Trucks & trailers" description="Maintenance status, odometer, and service logs">
      <AdminFleetPanel />
    </AdminPageShell>
  );
}
