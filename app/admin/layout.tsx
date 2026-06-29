import { BottomNav } from "@/components/dashboard/BottomNav";

import { FloatingQuickActions } from "@/components/admin/command-center/FloatingQuickActions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32 md:pb-8">
      {children}
      <FloatingQuickActions />
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
