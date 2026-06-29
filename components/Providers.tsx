"use client";

import { useEffect } from "react";
import { CompanyProvider } from "@/lib/company-context";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { DataHydrator } from "@/components/data/DataHydrator";
import { ToastProvider } from "@/components/ui/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <AuthProvider>
        <DataHydrator />
        <ToastProvider />
        {children}
      </AuthProvider>
    </CompanyProvider>
  );
}
