import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";
import type { UserProfile } from "./types";
import { ROLE_HOME_ROUTES } from "./types";

export { ROLE_HOME_ROUTES };

export function getSupabaseBrowserClient() {
  return createClient();
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: { full_name?: string; phone?: string }
) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password: newPassword });
}

export async function fetchSessionProfile(): Promise<{
  profile: UserProfile | null;
  userId: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, userId: null };

  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return { profile: null, userId: user.id };

  const data = await res.json();
  return { profile: data.profile ?? null, userId: user.id };
}

export function redirectPathForRole(role: Role): string {
  return ROLE_HOME_ROUTES[role];
}

/** Post-login redirect; staff portal sends customers to /customer even if they used Staff Login. */
export function redirectPathAfterLogin(role: Role, portal?: string | null): string {
  if (portal === "staff" && role === "customer") return "/customer";
  if (portal === "staff") {
    if (role === "admin" || role === "hr" || role === "office_admin") return "/admin";
    if (role === "planner") return "/planner";
    if (role === "employee") return "/employee";
  }
  return redirectPathForRole(role);
}
