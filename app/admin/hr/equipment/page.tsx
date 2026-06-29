import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EquipmentManager } from "@/components/hr/EquipmentManager";

export default function AdminEquipmentPage() {
  return (
    <AdminPageShell title="Equipment Assets" description="Asset registry, assignments, and damage queue">
      <EquipmentManager />
    </AdminPageShell>
  );
}
