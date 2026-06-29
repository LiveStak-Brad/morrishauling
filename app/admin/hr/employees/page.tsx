"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EmployeeDirectory } from "@/components/hr/EmployeeDirectory";

export default function HrEmployeesPage() {
  return (
    <AdminPageShell title="Employee Directory" description="Search and manage workforce records">
      <EmployeeDirectory />
    </AdminPageShell>
  );
}
