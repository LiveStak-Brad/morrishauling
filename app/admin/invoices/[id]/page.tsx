"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminInvoiceDetail } from "@/components/admin/AdminInvoiceDetail";
import { ArrowLeft } from "lucide-react";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  return (
    <AdminPageShell
      title="Invoice detail"
      description="View, edit, and manage invoice payments"
      action={
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All invoices
        </Link>
      }
    >
      <AdminInvoiceDetail invoiceId={invoiceId} />
    </AdminPageShell>
  );
}
