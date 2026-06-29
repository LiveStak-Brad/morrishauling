"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeSelector } from "@/components/hr/EmployeeSelector";
import { FleetUnitSelector } from "@/components/hr/FleetUnitSelector";
import type { EquipmentAsset, EquipmentDamageReport } from "@/types/hr/equipment";
import { toast } from "@/lib/toast";

const CATEGORIES = ["truck", "trailer", "dolly", "strap", "tool", "uniform", "electronics", "general"];

const emptyForm = {
  assetId: "",
  name: "",
  category: "general",
  serialNumber: "",
  purchasePrice: "",
  location: "",
  notes: "",
};

export function EquipmentManager() {
  const [assets, setAssets] = useState<EquipmentAsset[]>([]);
  const [damage, setDamage] = useState<EquipmentDamageReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [assignAssetId, setAssignAssetId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignFleetId, setAssignFleetId] = useState("");
  const [assignFleetKind, setAssignFleetKind] = useState<"truck" | "trailer">("truck");
  const [actionAssetId, setActionAssetId] = useState("");

  const load = () => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/hr/equipment/assets${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setAssets(d.assets ?? []);
          setDamage(d.damage ?? []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const postAsset = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/hr/equipment/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error ?? "Request failed");
    return d;
  };

  const patchAsset = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/hr/equipment/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error ?? "Update failed");
    return d;
  };

  const saveAsset = async () => {
    try {
      if (editId) {
        await patchAsset(editId, {
          assetId: form.assetId || editId,
          name: form.name,
          category: form.category,
          serialNumber: form.serialNumber || undefined,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
        });
        toast.success("Asset updated");
      } else {
        await postAsset({
          action: "create",
          assetId: form.assetId || undefined,
          name: form.name,
          category: form.category,
          serialNumber: form.serialNumber || undefined,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
        });
        toast.success("Asset created");
      }
      setShowAdd(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const startEdit = (a: EquipmentAsset) => {
    setEditId(a.id);
    setForm({
      assetId: a.assetId,
      name: a.name,
      category: a.category,
      serialNumber: a.serialNumber ?? "",
      purchasePrice: a.purchasePrice != null ? String(a.purchasePrice) : "",
      location: a.location ?? "",
      notes: a.notes ?? "",
    });
    setShowAdd(true);
  };

  const assignEmployee = async () => {
    try {
      await postAsset({
        action: "assign-employee",
        assetId: assignAssetId,
        employeeId: assignEmployeeId,
      });
      toast.success("Assigned — employee must acknowledge checkout");
      setAssignAssetId("");
      setAssignEmployeeId("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assign failed");
    }
  };

  const assignFleet = async () => {
    try {
      await postAsset({
        action: "assign-fleet",
        assetId: assignAssetId,
        fleetUnitId: assignFleetId,
        fleetKind: assignFleetKind,
      });
      toast.success(`Assigned to ${assignFleetKind}`);
      setAssignFleetId("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assign failed");
    }
  };

  const returnAsset = async (assetId: string) => {
    try {
      await postAsset({ action: "return", assetId });
      toast.success("Asset returned");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    }
  };

  const retireAsset = async (assetId: string) => {
    if (!confirm("Retire this asset?")) return;
    try {
      await postAsset({ action: "retire", assetId, reason: "Retired by admin" });
      toast.success("Asset retired");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retire failed");
    }
  };

  const markDamaged = async (assetId: string) => {
    try {
      await patchAsset(assetId, { action: "mark_condition", condition: "poor", status: "maintenance" });
      toast.success("Marked damaged / maintenance");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm("Delete this asset permanently?")) return;
    try {
      const res = await fetch(`/api/hr/equipment/assets/${assetId}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("Asset deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const uploadPhotoPlaceholder = async (assetId: string) => {
    try {
      await patchAsset(assetId, {
        photoPaths: [`placeholder://${assetId}/photo-pending`],
        notes: "Photo upload pending — attach in storage when ready",
      });
      toast.success("Photo placeholder saved");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading && assets.length === 0) {
    return <p className="text-muted-foreground">Loading asset registry…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <input
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Button variant="outline" onClick={load}>Search</Button>
        <Button onClick={() => { setShowAdd(true); setEditId(null); setForm(emptyForm); }}>
          Add asset
        </Button>
      </div>

      {damage.length > 0 && (
        <PremiumCard className="p-4 border-amber-200 bg-amber-50/50">
          <p className="font-medium mb-2">Damage queue ({damage.length})</p>
          <ul className="text-sm space-y-2">
            {damage.map((d) => (
              <li key={d.id} className="flex justify-between gap-2">
                <span>{d.asset?.name ?? d.assetId} — {d.description.slice(0, 60)}</span>
                <Badge variant="destructive" className="capitalize shrink-0">{d.severity}</Badge>
              </li>
            ))}
          </ul>
        </PremiumCard>
      )}

      {showAdd && (
        <PremiumCard className="p-4 space-y-3 max-w-lg">
          <p className="font-medium">{editId ? "Edit asset" : "New asset"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Asset tag</Label><Input value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} placeholder="MH-001" /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Category</Label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Serial #</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
            <div><Label>Purchase price</Label><Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button onClick={() => void saveAsset()}>{editId ? "Save" : "Create"}</Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <PremiumCard className="p-4 space-y-3">
          <p className="font-medium">Assign to employee</p>
          <select className="w-full border rounded px-3 py-2 text-sm" value={assignAssetId} onChange={(e) => setAssignAssetId(e.target.value)}>
            <option value="">Select asset</option>
            {assets.filter((a) => a.status !== "retired").map((a) => (
              <option key={a.id} value={a.id}>{a.assetId} — {a.name}</option>
            ))}
          </select>
          <EmployeeSelector value={assignEmployeeId} onChange={(id) => setAssignEmployeeId(id)} />
          <Button onClick={() => void assignEmployee()} className="w-full" disabled={!assignAssetId || !assignEmployeeId}>
            Check out to employee
          </Button>
        </PremiumCard>

        <PremiumCard className="p-4 space-y-3">
          <p className="font-medium">Assign to truck / trailer</p>
          <select className="w-full border rounded px-3 py-2 text-sm" value={assignAssetId} onChange={(e) => setAssignAssetId(e.target.value)}>
            <option value="">Select asset</option>
            {assets.filter((a) => a.status !== "retired").map((a) => (
              <option key={a.id} value={a.id}>{a.assetId} — {a.name}</option>
            ))}
          </select>
          <select className="w-full border rounded px-3 py-2 text-sm" value={assignFleetKind} onChange={(e) => setAssignFleetKind(e.target.value as "truck" | "trailer")}>
            <option value="truck">Truck</option>
            <option value="trailer">Trailer</option>
          </select>
          <FleetUnitSelector kind={assignFleetKind} value={assignFleetId} onChange={(id) => setAssignFleetId(id)} />
          <Button onClick={() => void assignFleet()} className="w-full" disabled={!assignAssetId || !assignFleetId}>
            Assign to fleet unit
          </Button>
        </PremiumCard>
      </div>

      <PremiumCard className="p-4 space-y-2 max-w-md">
        <p className="font-medium text-sm">Quick actions</p>
        <select className="w-full border rounded px-3 py-2 text-sm" value={actionAssetId} onChange={(e) => setActionAssetId(e.target.value)}>
          <option value="">Select asset</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.assetId} — {a.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!actionAssetId} onClick={() => void returnAsset(actionAssetId)}>Return</Button>
          <Button size="sm" variant="outline" disabled={!actionAssetId} onClick={() => void markDamaged(actionAssetId)}>Mark damaged</Button>
          <Button size="sm" variant="outline" disabled={!actionAssetId} onClick={() => void uploadPhotoPlaceholder(actionAssetId)}>Photo placeholder</Button>
          <Button size="sm" variant="outline" disabled={!actionAssetId} onClick={() => void retireAsset(actionAssetId)}>Retire</Button>
          <Button size="sm" variant="destructive" disabled={!actionAssetId} onClick={() => void deleteAsset(actionAssetId)}>Delete</Button>
        </div>
      </PremiumCard>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {assets.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No equipment yet — add assets or keep the Flagship Truck placeholder after migration 030.</p>
        ) : (
          assets.map((a) => (
            <PremiumCard key={a.id} className="p-3 text-sm">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{a.name}</p>
                <Badge variant="outline" className="capitalize">{a.status}</Badge>
              </div>
              <p className="text-muted-foreground">{a.assetId}</p>
              <p className="capitalize">{a.category} · {a.condition}</p>
              {a.assignedEmployeeId && <p className="text-xs mt-1">Employee: {a.assignedEmployeeId}</p>}
              {a.assignedTruckId && <p className="text-xs">Truck: {a.assignedTruckId}</p>}
              {a.assignedTrailerId && <p className="text-xs">Trailer: {a.assignedTrailerId}</p>}
              {a.photoPaths?.length > 0 && <p className="text-xs text-muted-foreground">Photo placeholder set</p>}
              <Button size="sm" variant="ghost" className="mt-2 h-7 px-2" onClick={() => startEdit(a)}>Edit</Button>
            </PremiumCard>
          ))
        )}
      </div>
    </div>
  );
}
