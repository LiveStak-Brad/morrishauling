import { BottomNav } from "@/components/dashboard/BottomNav";

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      {children}
      <BottomNav />
    </div>
  );
}
