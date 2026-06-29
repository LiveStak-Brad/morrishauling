"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await requestPasswordReset(email, redirectTo);
      if (resetError) {
        setError("Could not send reset email. Please try again or contact support.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Could not send reset email. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we will send reset instructions."
      footer={
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <div className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            If an account exists for that email, we sent password reset instructions. Check your inbox
            and spam folder.
          </p>
          <ButtonLink href="/login" className="w-full bg-brand-primary hover:bg-brand-primary/90">
            Return to login
          </ButtonLink>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-primary hover:bg-brand-primary/90"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
