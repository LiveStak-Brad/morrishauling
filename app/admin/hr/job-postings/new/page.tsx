import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminJobPostingCreateForm } from "@/components/admin/forms/AdminHrCreateForms";

export default function AdminJobPostingNewPage() {
  return (
    <AdminPageShell title="Create job posting" description="Publish careers listings">
      <AdminJobPostingCreateForm />
    </AdminPageShell>
  );
}
