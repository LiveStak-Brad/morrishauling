"use client";

import { useEffect } from "react";
import { useCompany } from "@/lib/company-context";
import { applySupabaseStore } from "@/lib/mock-data";

/**
 * On app load, pull company data from Supabase when enabled and merge into the local store.
 */
export function DataHydrator() {
  const { companyId } = useCompany();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_SUPABASE !== "true") return;

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
