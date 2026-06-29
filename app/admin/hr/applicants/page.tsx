"use client";

import { Suspense } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ApplicantPipeline } from "@/components/hr/ApplicantPipeline";
import { ButtonLink } from "@/components/ui/button-link";
import { useSearchParams } from "next/navigation";

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? undefined;
  return <ApplicantPipeline filterStatus={status} />;
}

export default function ApplicantsPage() {
  return (
    <AdminPageShell
      title="Applicant Tracking"
      description="Manage hiring pipeline from application to offer"
      action={<ButtonLink href="/admin/hr/postings" variant="outline">Job Postings</ButtonLink>}
    >
      <Suspense fallback={<p>Loading applicants…</p>}>
        <ApplicantsContent />
      </Suspense>
    </AdminPageShell>
  );
}
