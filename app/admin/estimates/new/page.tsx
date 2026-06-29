import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminJobIntake } from "@/components/admin/AdminJobIntake";

export default function AdminEstimateNewPage() {
  return (
    <AdminPageShell title="Create estimate" description="Build estimate and convert to scheduled job">
      <AdminJobIntake />
    </AdminPageShell>
  );
}
