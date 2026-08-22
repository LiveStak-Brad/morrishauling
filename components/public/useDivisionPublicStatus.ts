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

type StatusMap = Partial<Record<DivisionId, DivisionPublicStatus>>;

let cached: Promise<StatusMap> | null = null;

function fetchDivisionStatuses(): Promise<StatusMap> {
  if (!cached) {
    cached = fetch("/api/public/divisions/status")
      .then((r) => r.json())
      .then((json) => (json?.data?.divisions ?? {}) as StatusMap)
      .catch(() => {
        cached = null;
        return {} as StatusMap;
      });
  }
  return cached;
}

export function useAllDivisionPublicStatuses() {
  const [byId, setById] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDivisionStatuses()
      .then((rows) => {
        if (!cancelled) setById(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { byId, loading };
}

export function useDivisionPublicStatus(divisionId: DivisionId) {
  const { byId, loading } = useAllDivisionPublicStatuses();
  return { status: byId[divisionId] ?? null, loading };
}
