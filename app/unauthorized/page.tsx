"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/button-link";
import { ROLE_LABELS } from "@/lib/auth/types";
import { morrisConfig } from "@/lib/morris-config";

export default function UnauthorizedPage() {
  const { profile, homeRoute } = useAuth();

  return (
    <AuthShell title="Access not allowed" subtitle="Your account doesn't have permission to view this page.">
      <div className="space-y-4 text-center text-sm">
        {profile ? (
          <p className="text-muted-foreground">
            Signed in as <strong>{profile.full_name}</strong> ({ROLE_LABELS[profile.role]}).
          </p>
        ) : (
          <p className="text-muted-foreground">Please sign in with the correct account type.</p>
        )}
        <ButtonLink
          href={profile ? homeRoute : "/login"}
          className="w-full bg-brand-primary hover:bg-brand-primary/90"
        >
          {profile ? `Go to ${ROLE_LABELS[profile.role]} dashboard` : "Sign in"}
        </ButtonLink>
        <Link href="/" className="block text-brand-primary hover:underline">
          Return to {morrisConfig.companyName}
        </Link>
      </div>
    </AuthShell>
  );
}
