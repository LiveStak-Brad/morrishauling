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
  useEffect(() => {
    applyBrandTheme(morrisConfig.brandColors);
  }, []);

  const value = useMemo(
    () => ({
      company: morrisConfig,
      companyId: MORRIS_COMPANY_ID,
    }),
    []
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
