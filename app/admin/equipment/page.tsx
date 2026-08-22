"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICE_STATUS_LABELS, type ServiceStatus } from "@/types/equipment";

type ServiceRow = {
  id: string;
  divisionId: string;
  slug: string;
  name: string;
  status: ServiceStatus;
  publiclyListed: boolean;
};

export default function AdminEquipmentPage() {
  const [types, setTypes] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [capabilities, setCapabilities] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [reserve, setReserve] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/equipment-catalog");
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Failed to load");
    setTypes(json.types ?? []);
    setAttachments(json.attachments ?? []);
    setCapabilities(json.capabilities ?? []);
    setServices(json.services ?? []);
    setReserve(String(json.maintenanceReservePerHour ?? 25));
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/equipment-catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Update failed");
    setMessage("Saved");
    await load();
  }

  return (
    <AdminPageShell
      title="Equipment & capabilities"
      description="Enable machines, attachments, and services. Changing status here updates public CTAs when the division is accepting estimates or bookings."
    >
      {message && <p className="mb-4 text-sm text-emerald-800">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-800">{error}</p>}

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-lg font-semibold">Maintenance reserve / hour</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal only. Estimated job reserve = machine hours × this amount.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
            aria-label="Maintenance reserve per hour"
            className="max-w-[10rem]"
          />
          <Button
            type="button"
            onClick={() => void patch({ kind: "settings", maintenanceReservePerHour: Number(reserve) })}
          >
            Save
          </Button>
        </div>
      </section>

      <ToggleList title="Equipment types" rows={types} kind="type" onToggle={(id, enabled) => void patch({ kind: "type", id, enabled })} />
      <ToggleList title="Attachments" rows={attachments} kind="attachment" onToggle={(id, enabled) => void patch({ kind: "attachment", id, enabled })} />
      <ToggleList title="Capabilities" rows={capabilities} kind="capability" onToggle={(id, enabled) => void patch({ kind: "capability", id, enabled })} />

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-lg font-semibold">Services</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Service</th>
                <th>Division</th>
                <th>Status</th>
                <th>Listed</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-t border-black/5">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td>{s.divisionId.replace(/_/g, " ")}</td>
                  <td>
                    <select
                      className="h-9 rounded-lg border px-2"
                      value={s.status}
                      onChange={(e) =>
                        void patch({ kind: "service", id: s.id, status: e.target.value })
                      }
                    >
                      {Object.entries(SERVICE_STATUS_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.publiclyListed}
                      onChange={(e) =>
                        void patch({ kind: "service", id: s.id, publiclyListed: e.target.checked })
                      }
                      aria-label={`List ${s.name} publicly`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}

function ToggleList({
  title,
  rows,
  onToggle,
}: {
  title: string;
  kind: string;
  rows: Array<{ id: string; name: string; enabled: boolean }>;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 divide-y">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between py-2 text-sm">
            <span>{row.name}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => onToggle(row.id, e.target.checked)}
              />
              Enabled
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
