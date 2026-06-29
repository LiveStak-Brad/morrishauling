"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/auth/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message || "Could not update password. Request a new reset link.");
        return;
      }
      router.push("/login?message=password_updated");
    } catch {
      setError("Could not update password. Request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-primary hover:bg-brand-primary/90"
        >
          {submitting ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
