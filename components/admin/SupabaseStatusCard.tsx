"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Database, ExternalLink } from "lucide-react";

interface SupabaseStatus {
  ok?: boolean;
  connected?: boolean;
  tablesReady?: boolean;
  tableError?: string | null;
  error?: string;
}

export function SupabaseStatusCard() {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health/supabase")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const enabled = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

  return (
    <PremiumCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10">
            <Database className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-bold">Supabase database</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {enabled ? "Cloud sync enabled" : "Using local mock data only"}
            </p>
          </div>
        </div>
        {!loading && status?.connected && status.tablesReady && (
          <StatusChip label="Connected" variant="success" />
        )}
        {!loading && status?.connected && !status.tablesReady && (
          <StatusChip label="Tables missing" variant="warning" />
        )}
        {!loading && !status?.connected && (
          <StatusChip label="Offline" variant="urgent" />
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking connection…</p>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          {status?.tableError && (
            <p className="rounded-lg bg-orange-50 p-3 text-orange-800">
              {status.tableError}. Run the SQL migration in Supabase SQL Editor (see{" "}
              <code className="text-xs">supabase/README.md</code>).
            </p>
          )}
          {status?.error && (
            <p className="rounded-lg bg-red-50 p-3 text-red-800">{status.error}</p>
          )}
          {status?.tablesReady && (
            <p className="text-emerald-700">
              API connected. App hydrates jobs, invoices, and payments on load.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="https://supabase.com/dashboard/project/wfdfyhrdqpozyavxxgob/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open SQL Editor
            </a>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
