"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAdmin } from "@/lib/auth/permissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function EmployeeTopBar() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <p className="truncate text-sm font-medium text-muted-foreground">
        {profile.full_name || profile.email}
      </p>
      <div className="flex items-center gap-2">
        {isAdmin(profile) && (
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}>
            Admin
          </Link>
        )}
        <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => signOut()}
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        Sign out
      </Button>
      </div>
    </div>
  );
}
