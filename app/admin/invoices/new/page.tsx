import { Suspense } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminInvoiceCreateForm } from "@/components/admin/forms/AdminInvoiceCreateForm";

export default function AdminInvoiceNewPage() {
  return (
    <AdminPageShell
      title="Create invoice"
      description="Only from a completed job with proof — prefilled from the customer workspace when linked"
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AdminInvoiceCreateForm />
      </Suspense>
    </AdminPageShell>
  );
}
