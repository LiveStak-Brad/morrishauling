import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminPaymentCreateForm } from "@/components/admin/forms/AdminPaymentCreateForm";

export default function AdminPaymentNewPage() {
  return (
    <AdminPageShell title="Record payment" description="Cash, check, card placeholder, ACH, or financing">
      <AdminPaymentCreateForm />
    </AdminPageShell>
  );
}
