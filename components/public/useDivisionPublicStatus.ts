"use client";

import { useEffect, useState } from "react";
import type { DivisionId, DivisionLaunchStatus } from "@/lib/divisions";

export type DivisionPublicStatus = {
  id: DivisionId;
  launchStatus: DivisionLaunchStatus;
  statusLabel: string;
  bookingCtaLabel: string;
  acceptsBookings: boolean;
  acceptsEstimateRequests: boolean;
  acceptsInterest: boolean;
  bookPath: string;
};

export function useDivisionPublicStatus(divisionId: DivisionId) {
  const [status, setStatus] = useState<DivisionPublicStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/divisions/status")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const row = json?.data?.divisions?.[divisionId];
        if (row) setStatus(row as DivisionPublicStatus);
      })
      .catch(() => {
        /* keep null — callers show conservative CTA */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [divisionId]);

  return { status, loading };
}
