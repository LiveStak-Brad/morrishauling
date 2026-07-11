"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEstimateDetail } from "@/components/admin/AdminEstimateDetail";
import { ArrowLeft } from "lucide-react";

export default function AdminEstimateDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <AdminPageShell
      title="Estimate"
      description="Edit, send, revise, approve, and convert"
      action={
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All estimates
        </Link>
      }
    >
      <AdminEstimateDetail estimateId={id} />
    </AdminPageShell>
  );
}
