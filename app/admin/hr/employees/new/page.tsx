import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEmployeeCreateForm } from "@/components/admin/forms/AdminHrCreateForms";

export default function AdminEmployeeNewPage() {
  return (
    <AdminPageShell title="Create employee" description="Direct hire without applicant flow">
      <AdminEmployeeCreateForm />
    </AdminPageShell>
  );
}
