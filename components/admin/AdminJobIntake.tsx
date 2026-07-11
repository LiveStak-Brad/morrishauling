"use client";

import { useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSelector } from "@/components/admin/CustomerSelector";
import { EmployeeSelector } from "@/components/hr/EmployeeSelector";
import { FleetUnitSelector } from "@/components/hr/FleetUnitSelector";
import { toast } from "@/lib/toast";

interface Props {
  onCreated?: () => void;
}

export function AdminJobIntake({ onCreated }: Props) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [serviceType, setServiceType] = useState<"junk_removal" | "hauling_transport">("junk_removal");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("MO");
  const [zip, setZip] = useState("");
  const [junkType, setJunkType] = useState("mixed");
  const [notes, setNotes] = useState("");
  const [estimatedTotal, setEstimatedTotal] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledWindow, setScheduledWindow] = useState("Morning");
  const [crewId, setCrewId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (
      !confirm(
        "Owner exception: create a job without an agreed estimate?\n\nNormal path is Customer → Estimate → dual approval → Job."
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      let resolvedCustomerId = customerId;
      if (mode === "new") {
        const cr = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCustomer),
        });
        const cd = await cr.json();
        if (!cd.ok) throw new Error(cd.error ?? "Failed to create customer");
        resolvedCustomerId = cd.customer.id;
      }
      if (!resolvedCustomerId) throw new Error("Select or create a customer");

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: resolvedCustomerId,
          serviceType,
          street,
          city,
          state,
          zip,
          junkType,
          notes,
          estimatedTotal: estimatedTotal ? Number(estimatedTotal) : undefined,
          scheduledDate: scheduledDate || undefined,
          scheduledWindowLabel: scheduledDate ? scheduledWindow : undefined,
          assignedEmployeeIds: crewId ? [crewId] : undefined,
          truckId: truckId || undefined,
          trailerId: trailerId || undefined,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error ?? "Failed to create job");
      toast.success(`Job created — ${d.job.id}`);
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={() => setMode("existing")}
        >
          Existing customer
        </Button>
        <Button
          size="sm"
          variant={mode === "new" ? "default" : "outline"}
          onClick={() => setMode("new")}
        >
          New customer
        </Button>
      </div>

      {mode === "existing" ? (
        <div>
          <Label>Customer</Label>
          <CustomerSelector value={customerId} onChange={(id) => setCustomerId(id)} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>First name</Label><Input value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} /></div>
          <div><Label>Last name</Label><Input value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
        </div>
      )}

      <div>
        <Label>Service type</Label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value as typeof serviceType)}
        >
          <option value="junk_removal">Junk Removal</option>
          <option value="hauling_transport">Hauling &amp; Transport</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Street</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} /></div>
        <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
        <div><Label>ZIP</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} /></div>
        {serviceType === "junk_removal" && (
          <div><Label>Junk type</Label><Input value={junkType} onChange={(e) => setJunkType(e.target.value)} /></div>
        )}
      </div>

      <div>
        <Label>Job notes / photos placeholder</Label>
        <textarea
          className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px]"
          placeholder="Describe load, access, photos to add later…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label>Estimate total ($)</Label><Input type="number" value={estimatedTotal} onChange={(e) => setEstimatedTotal(e.target.value)} /></div>
        <div><Label>Schedule date</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /></div>
        <div>
          <Label>Window</Label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={scheduledWindow} onChange={(e) => setScheduledWindow(e.target.value)}>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>All day</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label>Crew</Label><EmployeeSelector value={crewId} onChange={(id) => setCrewId(id)} /></div>
        <div><Label>Truck</Label><FleetUnitSelector kind="truck" value={truckId} onChange={(id) => setTruckId(id)} /></div>
        <div><Label>Trailer</Label><FleetUnitSelector kind="trailer" value={trailerId} onChange={(id) => setTrailerId(id)} /></div>
      </div>

      <Button onClick={() => void submit()} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Creating…" : "Create job"}
      </Button>
    </PremiumCard>
  );
}
