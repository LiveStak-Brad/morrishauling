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
import type { UserProfile } from "@/lib/auth/types";
import { ROLE_HOME_ROUTES, ROLE_LABELS } from "@/lib/auth/types";
import { createClientOrNull } from "@/lib/supabase/client";

const DEV_ROLE_KEY = "dev-role";
const DEV_IMPERSONATE_KEY = "dev-impersonate";

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  role: Role;
  effectiveRole: Role;
  homeRoute: string;
  customerId: string | null;
  isAuthenticated: boolean;
  devImpersonating: boolean;
  setDevRole: (role: Role) => void;
  setDevImpersonating: (on: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devRole, setDevRoleState] = useState<Role>("customer");
  const [devImpersonating, setDevImpersonatingState] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile ?? null);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const storedRole = localStorage.getItem(DEV_ROLE_KEY) as Role | null;
      if (storedRole && ROLE_HOME_ROUTES[storedRole]) setDevRoleState(storedRole);
      setDevImpersonatingState(localStorage.getItem(DEV_IMPERSONATE_KEY) === "true");
    }
    void loadProfile();

    const supabase = createClientOrNull();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const setDevRole = useCallback((r: Role) => {
    setDevRoleState(r);
    localStorage.setItem(DEV_ROLE_KEY, r);
  }, []);

  const setDevImpersonating = useCallback((on: boolean) => {
    setDevImpersonatingState(on);
    localStorage.setItem(DEV_IMPERSONATE_KEY, on ? "true" : "false");
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    const supabase = createClientOrNull();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/login";
  }, []);

  const effectiveRole: Role = profile?.role ?? "customer";

  const value = useMemo(
    () => ({
      profile,
      loading,
      role: profile?.role ?? "customer",
      effectiveRole,
      homeRoute: ROLE_HOME_ROUTES[effectiveRole],
      customerId: profile?.customer_id ?? null,
      isAuthenticated: !!profile,
      devImpersonating,
      setDevRole,
      setDevImpersonating,
      refreshProfile: loadProfile,
      signOut,
    }),
    [
      profile,
      loading,
      effectiveRole,
      devImpersonating,
      setDevRole,
      setDevImpersonating,
      loadProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** @deprecated Use useAuth — kept for BottomNav / DevToolbar compatibility */
export function useRole() {
  const { effectiveRole, setDevRole, homeRoute } = useAuth();
  return {
    role: effectiveRole,
    setRole: setDevRole,
    homeRoute,
  };
}

export { ROLE_HOME_ROUTES, ROLE_LABELS };
