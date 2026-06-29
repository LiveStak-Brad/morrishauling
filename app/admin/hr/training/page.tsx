import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { TrainingManager } from "@/components/hr/TrainingManager";

export default function AdminTrainingPage() {
  return (
    <AdminPageShell title="Training Manager" description="Courses, compliance matrix, and retraining">
      <TrainingManager />
    </AdminPageShell>
  );
}
