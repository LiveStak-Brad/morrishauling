"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PayrollCenter } from "@/components/hr/PayrollCenter";

export default function PayrollPage() {
  return (
    <AdminPageShell title="Payroll Center" description="Pay periods, timesheet rollups, and exports">
      <PayrollCenter />
    </AdminPageShell>
  );
}
