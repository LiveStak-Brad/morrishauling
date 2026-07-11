import { redirect } from "next/navigation";

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminInvoiceEditPage({ params }: Ctx) {
  const { id } = await params;
  redirect(`/admin/invoices/${id}`);
}
