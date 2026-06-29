"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, ShieldAlert } from "lucide-react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

type TableCounts = { total: number; hidden: number };
type HiddenRecord = { id: string; label: string };

type TestDataStatus = {
  hasHiddenRecords: boolean;
  excludedCount: number;
  message: string | null;
  counts: Record<string, TableCounts>;
  hiddenRecords: Record<string, HiddenRecord[]>;
  cleanupSql: string;
};

const isDev = process.env.NODE_ENV !== "production";

export function QaTestDataWarning() {
  const [status, setStatus] = useState<TestDataStatus | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [demoInProduction, setDemoInProduction] = useState(false);

  useEffect(() => {
    if (isDev) {
      fetch("/api/admin/test-data-status")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setStatus(d);
        })
        .catch(() => {});
      return;
    }

    fetch("/api/admin/health/supabase", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.production?.demoDataEnabled) setDemoInProduction(true);
      })
      .catch(() => {});
  }, []);

  if (!isDev && demoInProduction) {
    return (
      <PremiumCard className="mb-4 border-red-400 bg-red-50 p-4">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div className="text-sm text-red-950">
            <p className="font-semibold">Critical: DEMO_DATA is enabled in production</p>
            <p className="mt-1">
              Demo and test fallbacks are active. Remove <code className="text-xs">DEMO_DATA</code> from
              production environment variables before go-live. Developer tools and test actions are blocked.
            </p>
          </div>
        </div>
      </PremiumCard>
    );
  }

  if (!isDev || !status?.hasHiddenRecords) return null;

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(status.cleanupSql);
      toast.success("Cleanup SQL copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <PremiumCard className="mb-4 border-amber-300 bg-amber-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1 text-sm text-amber-950">
          <p className="font-semibold">Hidden seed / demo / test data</p>
          <p className="mt-1 text-amber-900">
            {status.message} ({status.excludedCount} record(s) filtered across dashboards.)
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {Object.entries(status.counts).map(([table, c]) =>
              c.hidden > 0 ? (
                <div key={table} className="rounded-lg bg-white/60 px-2 py-1.5">
                  <dt className="font-medium capitalize text-amber-900">{table}</dt>
                  <dd className="text-amber-800">
                    {c.hidden} hidden / {c.total} total
                  </dd>
                </div>
              ) : null
            )}
          </dl>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide records" : "View hidden records"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void copySql()}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy cleanup SQL
            </Button>
          </div>

          {expanded && (
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-amber-200 bg-white/70 p-3 text-xs">
              {Object.entries(status.hiddenRecords).map(([table, rows]) =>
                rows.length > 0 ? (
                  <div key={table}>
                    <p className="mb-1 font-semibold capitalize text-amber-950">{table}</p>
                    <ul className="space-y-0.5 text-amber-900">
                      {rows.map((r) => (
                        <li key={r.id}>
                          <span className="font-mono text-[11px]">{r.id}</span>
                          {" — "}
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          )}

          <p className="mt-3 text-xs text-amber-800">
            Use the Data Inspector in development to review cleanup SQL before running in Supabase.
          </p>
        </div>
      </div>
    </PremiumCard>
  );
}
