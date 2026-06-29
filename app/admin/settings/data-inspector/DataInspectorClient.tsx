"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { toast } from "@/lib/toast";
import { Copy, ArrowLeft, ExternalLink } from "lucide-react";

type InspectorStatus = {
  filteringActive: boolean;
  demoDataEnabled: boolean;
  excludedCount: number;
  hasHiddenRecords: boolean;
  message: string | null;
  counts: Record<string, { total: number; hidden: number; visible: number }>;
  moduleLinks: Record<string, string>;
  excludedSamples: Record<string, Array<{ id: string; label: string; excluded: boolean; exclusionReason?: string; source: string }>>;
  cleanupRecommendations: string[];
  cleanupSql: string;
};

export function DataInspectorClient() {
  const [status, setStatus] = useState<InspectorStatus | null>(null);

  useEffect(() => {
    void fetchStatus().then(setStatus);
  }, []);

  const copySql = async () => {
    if (!status?.cleanupSql) return;
    await navigator.clipboard.writeText(status.cleanupSql);
    toast.success("Cleanup SQL copied");
  };

  return (
    <AdminPageShell
      title="Data Inspector"
      description="Real records, filtered demo/test rows, and cleanup guidance"
      action={
        <Link href="/admin/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Settings
          </Button>
        </Link>
      }
    >
      {!status ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4 max-w-4xl">
          <PremiumCard className="p-5">
            <p className="font-semibold">
              {status.hasHiddenRecords
                ? `${status.excludedCount} record(s) excluded from production views`
                : "No seed/test records detected in database"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-record filter: {status.filteringActive ? "active" : "off"} · DEMO_DATA:{" "}
              {status.demoDataEnabled ? "true (demo rows visible)" : "false (demo rows hidden)"}
            </p>
            {status.message && <p className="mt-2 text-sm text-amber-800">{status.message}</p>}
          </PremiumCard>

          <PremiumCard className="p-5">
            <h3 className="mb-3 font-bold text-sm">Records by table</h3>
            <dl className="grid gap-2 sm:grid-cols-2">
              {Object.entries(status.counts).map(([table, c]) => (
                <div key={table} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <dt className="flex items-center justify-between font-medium capitalize">
                    {table}
                    {status.moduleLinks[table] && (
                      <ButtonLink href={status.moduleLinks[table]} variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        Open <ExternalLink className="ml-1 h-3 w-3" />
                      </ButtonLink>
                    )}
                  </dt>
                  <dd className="text-muted-foreground">
                    {c.visible} visible · {c.hidden} excluded · {c.total} total in DB
                  </dd>
                </div>
              ))}
            </dl>
          </PremiumCard>

          {status.cleanupRecommendations.length > 0 && (
            <PremiumCard className="p-5">
              <h3 className="mb-2 font-bold text-sm">Cleanup recommendations</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {status.cleanupRecommendations.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </PremiumCard>
          )}

          {Object.entries(status.excludedSamples).some(([, rows]) => rows.some((r) => r.excluded)) && (
            <PremiumCard className="p-5">
              <h3 className="mb-3 font-bold text-sm">Why records were excluded (sample)</h3>
              <div className="space-y-4">
                {Object.entries(status.excludedSamples).map(([table, rows]) => {
                  const excluded = rows.filter((r) => r.excluded);
                  if (excluded.length === 0) return null;
                  return (
                    <div key={table}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {table}
                        {status.moduleLinks[table] && (
                          <Link href={status.moduleLinks[table]} className="ml-2 normal-case text-brand-primary hover:underline">
                            View module →
                          </Link>
                        )}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {excluded.slice(0, 5).map((r) => (
                          <li key={r.id} className="rounded border px-2 py-1 text-muted-foreground">
                            <span className="font-mono text-xs">{r.id}</span> — {r.label}
                            {r.exclusionReason && (
                              <span className="ml-1 text-amber-700">({r.exclusionReason.replace(/_/g, " ")})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
          )}

          <PremiumCard className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-sm">Cleanup SQL (review before running in Supabase)</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => void copySql()}>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy SQL
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs">{status.cleanupSql}</pre>
          </PremiumCard>
        </div>
      )}
    </AdminPageShell>
  );
}

async function fetchStatus(): Promise<InspectorStatus> {
  const res = await fetch("/api/admin/test-data-status");
  const d = await res.json();
  if (!d.ok) throw new Error(d.error ?? "Failed");
  return d as InspectorStatus;
}
