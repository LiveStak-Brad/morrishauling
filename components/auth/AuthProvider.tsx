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
const DEV_ROLE_COOKIE = "morris_dev_role";
const DEV_IMPERSONATE_COOKIE = "morris_dev_impersonate";

function isDevRuntime() {
  return process.env.NODE_ENV === "development";
}

function writeDevCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  if (value == null || value === "") {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
}

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
    if (isDevRuntime()) {
      const storedRole = localStorage.getItem(DEV_ROLE_KEY) as Role | null;
      if (storedRole && ROLE_HOME_ROUTES[storedRole]) setDevRoleState(storedRole);
      const impersonating = localStorage.getItem(DEV_IMPERSONATE_KEY) === "true";
      setDevImpersonatingState(impersonating);
      if (impersonating && storedRole && ROLE_HOME_ROUTES[storedRole]) {
        writeDevCookie(DEV_ROLE_COOKIE, storedRole);
        writeDevCookie(DEV_IMPERSONATE_COOKIE, "true");
      }
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
    if (isDevRuntime()) {
      localStorage.setItem(DEV_ROLE_KEY, r);
      writeDevCookie(DEV_ROLE_COOKIE, r);
    }
  }, []);

  const setDevImpersonating = useCallback((on: boolean) => {
    setDevImpersonatingState(on);
    if (isDevRuntime()) {
      localStorage.setItem(DEV_IMPERSONATE_KEY, on ? "true" : "false");
      writeDevCookie(DEV_IMPERSONATE_COOKIE, on ? "true" : null);
      if (!on) {
        writeDevCookie(DEV_ROLE_COOKIE, null);
      } else {
        const stored = (localStorage.getItem(DEV_ROLE_KEY) as Role | null) ?? "customer";
        writeDevCookie(DEV_ROLE_COOKIE, stored);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    const supabase = createClientOrNull();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/login";
  }, []);

  // Dev toolbar: when Impersonate is on, use the selected preview role for nav/home.
  const effectiveRole: Role =
    isDevRuntime() && devImpersonating && ROLE_HOME_ROUTES[devRole]
      ? devRole
      : (profile?.role ?? "customer");

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
