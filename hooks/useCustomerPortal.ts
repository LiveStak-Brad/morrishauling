"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveDemoCustomerId } from "@/lib/demo-customer";
import type { Job } from "@/types/job";
import type { Invoice, Payment } from "@/types/payment";
import type { FinancingRequest } from "@/types/financing";

export interface CustomerPortalData {
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financing: FinancingRequest[];
}

export function useCustomerPortal() {
  const { customerId: authCustomerId, isAuthenticated, loading: authLoading } = useAuth();
  const customerId = resolveDemoCustomerId(authCustomerId);
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setTick((t) => t + 1);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!customerId) {
      setData({ jobs: [], invoices: [], payments: [], financing: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch("/api/me/customer")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setData({
            jobs: d.jobs ?? [],
            invoices: d.invoices ?? [],
            payments: d.payments ?? [],
            financing: d.financing ?? [],
          });
        } else {
          setError(d.error ?? "Failed to load account");
          setData({ jobs: [], invoices: [], payments: [], financing: [] });
        }
      })
      .catch(() => {
        setError("Failed to load account");
        setData({ jobs: [], invoices: [], payments: [], financing: [] });
      })
      .finally(() => setLoading(false));
  }, [customerId, authLoading, tick]);

  const requiresLogin =
    !authLoading && !customerId;

  return {
    data,
    loading: loading || authLoading,
    error,
    customerId,
    requiresLogin,
    isAuthenticated,
    refresh,
  };
}
