"use client";

import { useRouter } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import { useRole, ROLE_HOME_ROUTES, ROLE_LABELS } from "@/lib/role-context";
import type { Role } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ROLES: Role[] = [
  "customer",
  "employee",
  "planner",
  "admin",
  "platform_admin",
];

export function DevToolbar() {
  const { companyId, setCompanyId, companies } = useCompany();
  const { role, setRole, homeRoute } = useRole();
  const router = useRouter();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[60] border-t border-dashed border-amber-400 bg-amber-50 px-3 py-2 md:bottom-0">
      <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 md:max-w-5xl">
        <span className="text-xs font-semibold text-amber-800">DEV</span>
        <Select value={companyId} onValueChange={(v) => v && setCompanyId(v)}>
          <SelectTrigger className="h-8 w-[160px] bg-white text-xs">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.companyId} value={c.companyId}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={(v) => v && setRole(v as Role)}>
          <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
            <SelectValue placeholder="Role" />
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
          Go to {ROLE_LABELS[role]}
        </Button>
      </div>
    </div>
  );
}
