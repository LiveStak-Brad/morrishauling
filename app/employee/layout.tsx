import { BottomNav } from "@/components/dashboard/BottomNav";
import { EmployeeTopBar } from "@/components/employee/EmployeeTopBar";
import { AdminPreviewBanner } from "@/components/employee/AdminPreviewBanner";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      <AdminPreviewBanner />
      <EmployeeTopBar />
      {children}
      <BottomNav />
    </div>
  );
}
