import { Suspense } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminPaymentCreateForm } from "@/components/admin/forms/AdminPaymentCreateForm";

export default function AdminPaymentNewPage() {
  return (
    <AdminPageShell
      title="Record payment"
      description="Pay one invoice here, or use Pay All Outstanding on the customer workspace"
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AdminPaymentCreateForm />
      </Suspense>
    </AdminPageShell>
  );
}
