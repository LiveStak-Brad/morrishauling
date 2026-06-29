"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Role } from "@/types";

const STORAGE_KEY = "dev-role";

export const ROLE_HOME_ROUTES: Record<Role, string> = {
  customer: "/customer",
  employee: "/employee",
  planner: "/planner",
  admin: "/admin",
  platform_admin: "/platform",
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  employee: "Employee",
  planner: "Planner / Dispatcher",
  admin: "Admin / Owner",
  platform_admin: "Platform Super Admin",
};

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  homeRoute: string;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("customer");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored && ROLE_HOME_ROUTES[stored]) {
      setRoleState(stored);
    }
    setHydrated(true);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      homeRoute: ROLE_HOME_ROUTES[role],
    }),
    [role, setRole]
  );

  if (!hydrated) return null;

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
