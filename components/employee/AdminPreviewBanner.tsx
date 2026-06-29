"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAdmin } from "@/lib/auth/permissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";

const PREVIEW_COOKIE = "morris_preview_employee_id";

type HrEmployeeOption = { id: string; firstName: string; lastName: string };

export function AdminPreviewBanner() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<HrEmployeeOption[]>([]);
  const [selected, setSelected] = useState<string>("");

  const showAdmin = profile && isAdmin(profile);

  useEffect(() => {
    if (!showAdmin) return;
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${PREVIEW_COOKIE}=`))
      ?.split("=")[1];
    if (stored) setSelected(decodeURIComponent(stored));

    fetch("/api/hr/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.employees) {
          setEmployees(
            d.employees.map((e: HrEmployeeOption) => ({
              id: e.id,
              firstName: e.firstName,
              lastName: e.lastName,
            }))
          );
        }
      });
  }, [showAdmin]);

  const pickEmployee = (id: string | null) => {
    if (!id) return;
    setSelected(id);
    document.cookie = `${PREVIEW_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=86400; SameSite=Lax`;
    window.location.reload();
  };

  const clearPreview = () => {
    document.cookie = `${PREVIEW_COOKIE}=; path=/; max-age=0`;
    setSelected("");
  };

  if (!showAdmin) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2">
      <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 md:max-w-6xl">
        <Shield className="h-4 w-4 shrink-0 text-amber-800" />
        <span className="text-sm font-semibold text-amber-950">Admin preview mode</span>
        <Select value={selected || undefined} onValueChange={pickEmployee}>
          <SelectTrigger className="h-8 w-[220px] bg-white text-sm">
            <SelectValue placeholder="Select employee to preview" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!selected && (
          <span className="text-xs text-amber-800">Choose an employee to view their portal data.</span>
        )}
        <Link
          href="/admin"
          onClick={clearPreview}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto h-8")}
        >
          Exit to Mission Control
        </Link>
      </div>
    </div>
  );
}

export { PREVIEW_COOKIE };
