import { BottomNav } from "@/components/dashboard/BottomNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32 md:pb-8">
      {children}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
