import type { Metadata } from "next";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { AdminSupportBanner } from "@/components/customer/AdminSupportBanner";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-32">
      <AdminSupportBanner />
      {children}
      <BottomNav />
    </div>
  );
}
