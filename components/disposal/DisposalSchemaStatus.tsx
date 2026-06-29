"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { DisposalSchemaHealth } from "@/lib/disposal/disposal-schema-health";
import { cn } from "@/lib/utils";

export function DisposalSchemaStatus() {
  const [health, setHealth] = useState<DisposalSchemaHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/disposal/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setHealth(d.health);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying disposal schema…
      </div>
    );
  }

  if (!health) return null;

  const failed = health.checks.filter((c) => !c.ok);

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-xs",
        health.ready ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {health.ready ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-900">Disposal schema OK (migrations 033–037)</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-amber-900">
              {failed.length} schema check{failed.length === 1 ? "" : "s"} need attention
            </span>
          </>
        )}
      </div>
      {!health.ready && (
        <ul className="mt-2 space-y-0.5 text-amber-800">
          {failed.map((c) => (
            <li key={c.id}>
              {c.label}
              {c.detail ? ` — ${c.detail}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
