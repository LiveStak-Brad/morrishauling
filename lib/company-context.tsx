"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CompanyConfig } from "@/types";
import {
  DEFAULT_COMPANY_ID,
  getCompany,
  listCompanies,
} from "@/lib/mock-company";
import { applyBrandTheme } from "@/lib/theme";

const STORAGE_KEY = "dev-company-id";

interface CompanyContextValue {
  company: CompanyConfig;
  companyId: string;
  setCompanyId: (id: string) => void;
  companies: CompanyConfig[];
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyIdState] = useState(DEFAULT_COMPANY_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getCompany(stored)) {
      setCompanyIdState(stored);
    }
    setHydrated(true);
  }, []);

  const setCompanyId = useCallback((id: string) => {
    setCompanyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const company = useMemo(() => getCompany(companyId), [companyId]);

  useEffect(() => {
    if (hydrated) applyBrandTheme(company.brandColors);
  }, [company, hydrated]);

  const value = useMemo(
    () => ({
      company,
      companyId,
      setCompanyId,
      companies: listCompanies(),
    }),
    [company, companyId, setCompanyId]
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
