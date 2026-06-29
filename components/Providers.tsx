"use client";

import { useEffect } from "react";
import { CompanyProvider } from "@/lib/company-context";
import { RoleProvider } from "@/lib/role-context";
import { DataHydrator } from "@/components/data/DataHydrator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <RoleProvider>
        <DataHydrator />
        {children}
      </RoleProvider>
    </CompanyProvider>
  );
}
