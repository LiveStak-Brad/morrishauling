"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { signInWithPassword, redirectPathAfterLogin } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Role } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  // Unified login: default customer experience; role still decides destination after auth.
  const portalParam = searchParams.get("portal") ?? "customer";
  const portal =
    portalParam === "employee" || portalParam === "admin" ? "staff" : portalParam;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;

      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const me = await meRes.json();
      const role = (me.profile?.role ?? "customer") as Role;
      // Always route by account role: customers → customer portal,
      // employees → employee, owners/managers → admin/planner as assigned.
      const path =
        redirect && redirect.startsWith("/")
          ? redirect
          : redirectPathAfterLogin(role, portal === "staff" ? "staff" : null);
      toast.success("Welcome back!");
      router.push(path);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="One login for customers, crew, managers, and owners. You’ll land in the right workspace for your account."
      footer={
        <>
          <span className="text-muted-foreground">New customer? </span>
          <Link href="/register" className="font-semibold text-brand-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-11"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-11"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-brand-primary hover:bg-brand-primary/90"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
