import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminApplicantCreateForm } from "@/components/admin/forms/AdminHrCreateForms";

export default function AdminApplicantNewPage() {
  return (
    <AdminPageShell title="Add applicant" description="Manual entry from phone, text, or referral">
      <AdminApplicantCreateForm />
    </AdminPageShell>
  );
}
