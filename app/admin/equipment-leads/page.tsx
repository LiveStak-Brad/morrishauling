"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_DIVISION_IDS, getDivision, isEquipmentDivision } from "@/lib/divisions";

type Lead = {
  id: string;
  estimate_id: string | null;
  job_id: string | null;
  division_id: string;
  service_slug: string | null;
  kind: string;
  intake: Record<string, unknown>;
  actual_acres: number | null;
  actual_machine_hours: number | null;
  actual_fuel_gallons: number | null;
  actual_repair_cost: number | null;
  quoted_price: number | null;
  created_at: string;
};

export default function AdminEquipmentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/equipment-leads?division=${filter}`);
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Failed to load");
    setLeads(json.leads ?? []);
  }, [filter]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const stats = useMemo(() => {
    const byDivision = ALL_DIVISION_IDS.filter(isEquipmentDivision).map((id) => ({
      id,
      count: leads.filter((l) => l.division_id === id).length,
    }));
    return { total: leads.length, byDivision };
  }, [leads]);

  return (
    <AdminPageShell
      title="Land & equipment leads"
      description="Upcoming project estimates from land clearing, site work, and equipment services."
    >
      {error && <p className="mb-4 text-sm text-red-800">{error}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Leads loaded" value={stats.total} />
        {stats.byDivision.map((d) => (
          <Stat key={d.id} label={getDivision(d.id).shortName} value={d.count} />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "land_clearing", "site_work", "equipment_services"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === id ? "bg-brand-primary text-white" : "border bg-white"
            }`}
          >
            {id === "all" ? "All" : id.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th>Division</th>
              <th>Service</th>
              <th>Property</th>
              <th>Estimate</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-black/5">
                <td className="px-3 py-2">{new Date(lead.created_at).toLocaleDateString()}</td>
                <td>{lead.division_id.replace(/_/g, " ")}</td>
                <td>{lead.service_slug ?? "—"}</td>
                <td>
                  {[lead.intake.city, lead.intake.zip].filter(Boolean).join(" ") || "—"}
                </td>
                <td>
                  {lead.estimate_id ? (
                    <Link href={`/admin/estimates/${lead.estimate_id}`} className="text-brand-primary hover:underline">
                      Open
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(lead)}>
                    Hours / actuals
                  </Button>
                </td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No equipment leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <LeadEditor
          lead={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </AdminPageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LeadEditor({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [actualAcres, setActualAcres] = useState(String(lead.actual_acres ?? ""));
  const [hours, setHours] = useState(String(lead.actual_machine_hours ?? ""));
  const [fuel, setFuel] = useState(String(lead.actual_fuel_gallons ?? ""));
  const [repair, setRepair] = useState(String(lead.actual_repair_cost ?? ""));
  const [quoted, setQuoted] = useState(String(lead.quoted_price ?? ""));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/equipment-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          actualAcres: actualAcres ? Number(actualAcres) : undefined,
          actualMachineHours: hours ? Number(hours) : undefined,
          actualFuelGallons: fuel ? Number(fuel) : undefined,
          actualRepairCost: repair ? Number(repair) : undefined,
          quotedPrice: quoted ? Number(quoted) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "Save failed");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Record actuals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Internal profitability fields — not shown to customers.</p>
        <div className="mt-4 grid gap-3">
          <Field label="Actual acres" value={actualAcres} onChange={setActualAcres} />
          <Field label="Actual machine hours" value={hours} onChange={setHours} />
          <Field label="Actual fuel gallons" value={fuel} onChange={setFuel} />
          <Field label="Repair / maintenance expense" value={repair} onChange={setRepair} />
          <Field label="Quoted price" value={quoted} onChange={setQuoted} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input className="mt-1" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
