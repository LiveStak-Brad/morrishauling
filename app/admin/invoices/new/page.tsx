import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminInvoiceCreateForm } from "@/components/admin/forms/AdminInvoiceCreateForm";

export default function AdminInvoiceNewPage() {
  return (
    <AdminPageShell title="Create invoice" description="Manual invoice for phone or field billing">
      <AdminInvoiceCreateForm />
    </AdminPageShell>
  );
}
