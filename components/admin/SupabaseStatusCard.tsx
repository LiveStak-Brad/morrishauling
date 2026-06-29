"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Database, ExternalLink, HardDrive } from "lucide-react";

interface BucketStatus {
  bucket: string;
  exists: boolean | null;
  canUpload: boolean;
  canSignUrl: boolean;
  skipped?: boolean;
  error?: string;
}

interface SupabaseStatus {
  ok?: boolean;
  connected?: boolean;
  tablesReady?: boolean;
  error?: string;
  migration032?: {
    employee_document_uploads?: boolean;
    applicant_documents?: boolean;
    document_audit_log?: boolean;
  };
  production?: {
    hasServiceRole?: boolean;
  };
  storage?: {
    available: boolean;
    serviceRoleConfigured?: boolean;
    buckets: BucketStatus[];
    warnings: string[];
  };
}

function bucketLabel(b: BucketStatus): string {
  if (b.skipped || b.exists === null) return "Not tested (service role key missing)";
  if (b.exists && b.canUpload && b.canSignUrl) return "OK";
  if (!b.exists) return b.error ?? "Bucket not found";
  return b.error ?? "Unavailable";
}

export function SupabaseStatusCard() {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/health/supabase", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 403) {
          const publicRes = await fetch("/api/health/supabase");
          const publicData = await publicRes.json();
          return {
            ok: publicData.ok,
            connected: publicData.ok,
            tablesReady: publicData.ok,
            error: "Sign in as admin for full diagnostics.",
          } satisfies SupabaseStatus;
        }
        return r.json() as Promise<SupabaseStatus>;
      })
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const enabled = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
  const hasServiceRole = status?.storage?.serviceRoleConfigured === true;
  const storageOk = status?.storage?.available === true;
  const migrationOk =
    status?.migration032?.employee_document_uploads &&
    status?.migration032?.applicant_documents &&
    status?.migration032?.document_audit_log;

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
          {status?.error && (
            <p className="rounded-lg bg-red-50 p-3 text-red-800">{status.error}</p>
          )}
          {status?.tablesReady && (
            <p className="text-emerald-700">Database tables reachable.</p>
          )}
          {migrationOk && (
            <p className="text-emerald-700">Migration 032 tables present (uploads, applicant docs, audit log).</p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Storage buckets</span>
            {!loading && (
              <StatusChip
                label={
                  !hasServiceRole
                    ? "Key missing"
                    : storageOk
                      ? "Ready"
                      : "Issues"
                }
                variant={storageOk ? "success" : "warning"}
                className="ml-auto"
              />
            )}
          </div>

          {!hasServiceRole && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
              Storage buckets exist, but the service role key is missing, so upload/signed URL
              tests cannot run locally. Add{" "}
              <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
              <code className="text-xs">.env.local</code> (Supabase → Settings → API →{" "}
              <em>service_role</em>) and restart the dev server.
            </p>
          )}

          {(status?.storage?.buckets ?? []).length > 0 && (
            <ul className="space-y-1 text-xs">
              {status?.storage?.buckets.map((b) => {
                const ok = b.exists === true && b.canUpload && b.canSignUrl;
                const skipped = b.skipped || b.exists === null;
                return (
                  <li key={b.bucket} className="flex justify-between gap-2">
                    <span className="font-mono">{b.bucket}</span>
                    <span
                      className={
                        ok
                          ? "text-emerald-700"
                          : skipped
                            ? "text-muted-foreground"
                            : "text-amber-700"
                      }
                    >
                      {bucketLabel(b)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {hasServiceRole && (status?.storage?.warnings ?? []).length > 0 && (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
              {status?.storage?.warnings.join(" · ")}
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
