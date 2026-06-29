"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface EnvHealth {
  production?: {
    isProduction: boolean;
    ok: boolean;
    errors: string[];
    warnings: string[];
    demoDataEnabled: boolean;
    useSupabase: boolean;
    hasServiceRole: boolean;
    hasStaffOwnerEmails: boolean;
  };
  storage?: {
    available: boolean;
    warnings: string[];
  };
}

export function ProductionEnvWarning() {
  const [env, setEnv] = useState<EnvHealth["production"] | null>(null);
  const [storageWarnings, setStorageWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/health/supabase", { credentials: "include" })
      .then((r) => r.json())
      .then((d: EnvHealth) => {
        setEnv(d.production ?? null);
        setStorageWarnings(d.storage?.warnings ?? []);
      })
      .catch(() => setEnv(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const demoCritical = env?.isProduction && env.demoDataEnabled;

  if (demoCritical) {
    return (
      <PremiumCard className="mb-6 border-red-400 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-red-950">Critical: demo data enabled in production</h3>
              <StatusChip label="DEMO_DATA=true" variant="urgent" />
            </div>
            <p className="mt-2 text-sm text-red-900">
              Production is running with demo/mock fallbacks enabled. Unset{" "}
              <code className="text-xs">DEMO_DATA</code> immediately. Test employee creation, Data
              Inspector, and other developer tools are blocked.
            </p>
          </div>
        </div>
      </PremiumCard>
    );
  }

  if (!env) return null;

  const hasIssues = !env.ok || env.warnings.length > 0 || storageWarnings.length > 0;
  if (!hasIssues && env.useSupabase) return null;

  return (
    <PremiumCard
      className={`mb-6 p-5 ${!env.ok ? "border-red-300 bg-red-50/80" : "border-amber-300 bg-amber-50/80"}`}
    >
      <div className="flex items-start gap-3">
        {env.ok ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        ) : (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">
              {env.ok ? "Environment warnings" : "Unsafe production configuration"}
            </h3>
            {env.isProduction && (
              <StatusChip
                label={env.ok ? "Production" : "Production — misconfigured"}
                variant={env.ok ? "warning" : "urgent"}
              />
            )}
          </div>
          {env.errors.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
              {env.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {env.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {env.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          {storageWarnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {storageWarnings.map((w) => (
                <li key={w}>Storage: {w}</li>
              ))}
            </ul>
          )}
          {!env.useSupabase && (
            <p className="mt-2 text-sm text-muted-foreground">
              Set <code className="text-xs">NEXT_PUBLIC_USE_SUPABASE=true</code> and configure Supabase keys
              for production data.
            </p>
          )}
          {env.useSupabase && !env.hasServiceRole && (
            <p className="mt-2 text-sm text-amber-900">
              <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> is not set. File uploads,
              signed URLs, and invoice PDF generation require the service role key in{" "}
              <code className="text-xs">.env.local</code>.
            </p>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
