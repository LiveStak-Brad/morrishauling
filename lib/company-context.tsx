"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { morrisConfig, MORRIS_COMPANY_ID, type MorrisConfig } from "@/lib/morris-config";
import { applyBrandTheme } from "@/lib/theme";

interface CompanyContextValue {
  company: MorrisConfig;
  companyId: typeof MORRIS_COMPANY_ID;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    applyBrandTheme(morrisConfig.brandColors);
    setHydrated(true);
  }, []);

  const value = useMemo(
    () => ({
      company: morrisConfig,
      companyId: MORRIS_COMPANY_ID,
    }),
    []
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
