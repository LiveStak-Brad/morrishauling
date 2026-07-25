import type { Metadata } from "next";
import { BottomNav } from "@/components/dashboard/BottomNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      {children}
      <BottomNav />
    </div>
  );
}
