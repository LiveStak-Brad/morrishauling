"use client";

import { useEffect } from "react";
import { useCompany } from "@/lib/company-context";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { applySupabaseStore } from "@/lib/mock-data";

/**
 * Legacy bridge: sync Supabase data into the local mock store for demo/dev only.
 */
export function DataHydrator() {
  const { companyId } = useCompany();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_SUPABASE !== "true") return;
    if (!isDemoDataEnabled()) return;

    fetch(`/api/data/store?companyId=${encodeURIComponent(companyId)}`)
      .then((r) => r.json())
      .then((payload) => {
        if (payload.source === "supabase" && payload.tablesReady) {
          applySupabaseStore(companyId, {
            users: payload.users,
            jobs: payload.jobs,
            invoices: payload.invoices,
            payments: payload.payments,
            financingRequests: payload.financingRequests,
          });
          window.dispatchEvent(new CustomEvent("morris:data-refreshed"));
        }
      })
      .catch(() => {
        /* keep mock data */
      });
  }, [companyId]);

  return null;
}
