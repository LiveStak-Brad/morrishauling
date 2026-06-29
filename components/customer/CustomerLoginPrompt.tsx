"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { LogIn, UserPlus } from "lucide-react";

interface CustomerLoginPromptProps {
  title?: string;
  description?: string;
  redirectPath?: string;
}

export function CustomerLoginPrompt({
  title = "Sign in to view your account",
  description = "Log in or create an account to see your jobs, invoices, and payments. You can still book a pickup as a guest.",
  redirectPath,
}: CustomerLoginPromptProps) {
  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";
  const registerHref = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : "/register";

  return (
    <PremiumCard className="mx-auto max-w-md p-8 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <ButtonLink href={loginHref} className="inline-flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Sign in
        </ButtonLink>
        <ButtonLink href={registerHref} variant="outline" className="inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Create account
        </ButtonLink>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Or{" "}
        <Link href="/book" className="text-brand-primary underline">
          book as a guest
        </Link>
      </p>
    </PremiumCard>
  );
}
