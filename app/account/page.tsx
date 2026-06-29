"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ROLE_LABELS } from "@/lib/auth/types";
import { morrisConfig } from "@/lib/morris-config";

export default function AccountPage() {
  const { profile, signOut, homeRoute } = useAuth();

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-muted-foreground">Please sign in to view your account.</p>
        <ButtonLink href="/login" className="mt-4">
          Sign in
        </ButtonLink>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 pb-24">
      <PageHeader title="My account" description={morrisConfig.companyName} />
      <PremiumCard className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
          <p className="font-medium">{profile.full_name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
          <p className="font-medium">{profile.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
          <p className="font-medium">{ROLE_LABELS[profile.role]}</p>
        </div>
        {profile.phone && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
            <p className="font-medium">{profile.phone}</p>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <ButtonLink href={homeRoute} variant="outline">
            Dashboard
          </ButtonLink>
          <Button variant="destructive" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </PremiumCard>
    </main>
  );
}
