"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DisposalManagementDashboard } from "@/components/disposal/DisposalManagementDashboard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminDumpSitesPage() {
  return (
    <AdminPageShell
      title="Disposal Management"
      description="Facility directory, material routing, and intelligent dispatch recommendations"
      action={
        <Link href="/admin/dump-sites/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add facility
          </Button>
        </Link>
      }
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <DisposalManagementDashboard />
      </Suspense>
    </AdminPageShell>
  );
}
