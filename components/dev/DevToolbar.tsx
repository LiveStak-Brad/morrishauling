"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/auth/types";
import type { Role } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ROLES: Role[] = ["customer", "employee", "planner", "admin"];

export function DevToolbar() {
  const {
    profile,
    effectiveRole,
    setDevRole,
    devImpersonating,
    setDevImpersonating,
    homeRoute,
  } = useAuth();
  const router = useRouter();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[60] border-t-2 border-dashed border-amber-500 bg-amber-50 px-3 py-2 md:bottom-0">
      <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 md:max-w-5xl">
        <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Dev only
        </span>
        {profile && (
          <span className="hidden text-xs text-amber-900 sm:inline">
            Auth: {profile.full_name} ({ROLE_LABELS[profile.role]})
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="dev-impersonate"
            checked={devImpersonating}
            onCheckedChange={(c) => setDevImpersonating(c === true)}
          />
          <Label htmlFor="dev-impersonate" className="text-xs text-amber-900">
            Impersonate
          </Label>
        </div>
        <Select
          value={effectiveRole}
          disabled={!devImpersonating}
          onValueChange={(v) => v && setDevRole(v as Role)}
        >
          <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
            <SelectValue placeholder="Preview role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => router.push(homeRoute)}
        >
          Go to {ROLE_LABELS[effectiveRole]}
        </Button>
      </div>
    </div>
  );
}
