"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import {
  DIVISION_LAUNCH_LABELS,
  type DivisionId,
  type DivisionLaunchStatus,
} from "@/lib/divisions";
import { AlertTriangle } from "lucide-react";

type DivisionRow = {
  id: DivisionId;
  name: string;
  shortName: string;
  launchStatus: DivisionLaunchStatus;
  logoPath: string | null;
};

type Report = {
  combined: {
    openJobs: number;
    completedJobs: number;
    revenue: number;
    averageTicket: number;
    unassigned: number;
    missingProof: number;
  };
  divisions: Record<
    DivisionId,
    {
      name: string;
      openJobs: number;
      completedJobs: number;
      revenue: number;
      averageTicket: number;
      unassigned: number;
      missingProof: number;
    }
  >;
  recentJobs: {
    id: string;
    divisionId: DivisionId;
    status: string;
    address: string;
    total: number | null;
  }[];
};

const STATUS_OPTIONS: DivisionLaunchStatus[] = [
  "setup",
  "internal_testing",
  "accepting_interest",
  "accepting_estimate_requests",
  "accepting_bookings",
  "temporarily_paused",
];

export default function AdminDivisionsPage() {
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<"all" | DivisionId>("all");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<DivisionId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [divRes, repRes] = await Promise.all([
        fetch("/api/admin/divisions"),
        fetch(`/api/admin/divisions/report${filter === "all" ? "" : `?division=${filter}`}`),
      ]);
      const divJson = await divRes.json();
      const repJson = await repRes.json();
      if (!divRes.ok || divJson.ok === false) throw new Error(divJson.error || "Failed to load divisions");
      if (!repRes.ok || repJson.ok === false) throw new Error(repJson.error || "Failed to load report");
      setDivisions(divJson.divisions ?? []);
      setReport(repJson as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const setLaunchStatus = async (divisionId: DivisionId, launchStatus: DivisionLaunchStatus) => {
    setMessage(null);
    setError(null);
    if (launchStatus === "accepting_bookings") {
      const ok = window.confirm(
        "Enable LIVE BOOKINGS for this division?\n\nCustomers will be able to select guaranteed appointment windows when global APP_STATUS=live and ALLOW_PUBLIC_BOOKING=true.\n\nOnly continue if insurance, banking, and crew capacity are ready."
      );
      if (!ok) return;
    }
    setSaving(divisionId);
    try {
      const res = await fetch("/api/admin/divisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionId,
          launchStatus,
          confirmLiveBookings: launchStatus === "accepting_bookings",
        }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "Update failed");
      setMessage(`${json.division?.name ?? divisionId} → ${DIVISION_LAUNCH_LABELS[launchStatus]}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(null);
    }
  };

  const card = (title: string, s?: Report["combined"]) => (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {!s ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Open jobs</dt>
            <dd className="text-xl font-semibold">{s.openJobs}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="text-xl font-semibold">{s.completedJobs}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Revenue (est.)</dt>
            <dd className="text-xl font-semibold">${s.revenue.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Avg ticket</dt>
            <dd className="text-xl font-semibold">${s.averageTicket.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Unassigned</dt>
            <dd className="font-semibold text-amber-700">{s.unassigned}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Missing proof</dt>
            <dd className="font-semibold text-amber-700">{s.missingProof}</dd>
          </div>
        </dl>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <main className="mx-auto max-w-6xl px-4 py-10 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Owner
            </p>
            <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              Divisions
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Launch controls and cross-division operations for Junk Removal and Hauling.
            </p>
          </div>
          <ButtonLink href="/admin" variant="outline" className="h-10 rounded-full">
            Back to admin
          </ButtonLink>
        </div>

        {message && (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <section className="mt-8 space-y-4">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Launch status</h2>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>accepting bookings</strong> is the normal operating mode — customers book
              windows against real capacity. Use <strong>temporarily paused</strong> to freeze a
              division without taking the whole site offline. Estimate-request status is legacy and
              still accepts submissions that convert through review → approval → schedule.
            </span>
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {divisions.map((d) => (
              <div key={d.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{d.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current: {DIVISION_LAUNCH_LABELS[d.launchStatus]}
                    </p>
                  </div>
                  <Link href={d.id === "hauling" ? "/hauling" : "/junk-removal"} className="text-sm font-semibold text-brand-primary hover:underline">
                    Public page →
                  </Link>
                </div>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Change status
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <select
                    className="h-11 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm"
                    value={d.launchStatus}
                    disabled={saving === d.id}
                    onChange={(e) =>
                      void setLaunchStatus(d.id, e.target.value as DivisionLaunchStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {DIVISION_LAUNCH_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full"
                    disabled={saving === d.id}
                    onClick={() => void setLaunchStatus(d.id, "accepting_estimate_requests")}
                  >
                    Estimate requests
                  </Button>
                </div>
              </div>
            ))}
            {!divisions.length && (
              <p className="text-sm text-muted-foreground">Loading divisions from database…</p>
            )}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["all", "junk_removal", "hauling"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === id
                  ? "bg-brand-primary text-white"
                  : "border border-black/10 bg-white hover:border-brand-primary/30"
              }`}
            >
              {id === "all" ? "All divisions" : id === "junk_removal" ? "Junk Removal" : "Hauling"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {card("Combined", report?.combined)}
          {card("Junk Removal", report?.divisions.junk_removal)}
          {card("Hauling", report?.divisions.hauling)}
        </div>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Recent jobs</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(report?.recentJobs ?? []).map((j) => (
                  <tr key={j.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      {j.divisionId === "hauling" ? "Hauling" : "Junk Removal"}
                    </td>
                    <td className="px-4 py-3">{j.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{j.address}</td>
                    <td className="px-4 py-3">
                      {j.total != null ? `$${j.total.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
                {!report?.recentJobs?.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No jobs yet — or still loading.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
