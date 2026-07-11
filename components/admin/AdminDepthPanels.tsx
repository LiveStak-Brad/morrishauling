"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCompany } from "@/lib/company-context";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OperationsDepthSnapshot } from "@/types/operations-depth";
import type { Customer } from "@/types/user";
import { getMockOperationsDepthSnapshot } from "@/lib/mock-operations-depth";

type HrEmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
};

const emptyDepth = (): OperationsDepthSnapshot => ({
  trucks: [],
  dumpSites: [],
  maintenanceLogs: [],
  timeclock: [],
  interactions: [],
});

async function loadDepth(companyId: string): Promise<OperationsDepthSnapshot> {
  try {
    const res = await fetch(`/api/admin/operations-depth?companyId=${encodeURIComponent(companyId)}`);
    const json = await res.json();
    if (json.ok && json.data) return json.data as OperationsDepthSnapshot;
  } catch {
    /* fall through */
  }
  return isDemoDataEnabled() ? getMockOperationsDepthSnapshot(companyId) : emptyDepth();
}

async function loadHrEmployees(): Promise<HrEmployeeRow[]> {
  try {
    const res = await fetch("/api/hr/employees?lifecycleStatus=active");
    const json = await res.json();
    if (json.ok && json.employees) return json.employees as HrEmployeeRow[];
  } catch {
    /* fall through */
  }
  return [];
}

export function AdminEmployeesPanel() {
  const { company, companyId } = useCompany();
  const [depth, setDepth] = useState<OperationsDepthSnapshot | null>(null);
  const [employees, setEmployees] = useState<HrEmployeeRow[]>([]);
  const [todayJobs, setTodayJobs] = useState<Array<{ id: string; assignedEmployeeIds?: string[]; address: { city: string }; scheduledWindowLabel?: string; status: string }>>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  const refresh = useCallback(async () => {
    const [d, jobsRes, hrRes] = await Promise.all([
      loadDepth(companyId),
      fetch(`/api/admin/jobs?scheduledDate=${today}`).then((r) => r.json()),
      loadHrEmployees(),
    ]);
    setDepth(d);
    if (jobsRes.ok) setTodayJobs(jobsRes.jobs ?? []);
    if (hrRes.length > 0) {
      setEmployees(hrRes);
    } else if (isDemoDataEnabled()) {
      setEmployees(
        company.employees.map((e) => ({
          id: e.id,
          firstName: e.name.split(" ")[0] ?? e.name,
          lastName: e.name.split(" ").slice(1).join(" ") || "",
          phone: e.phone,
          role: e.role,
        }))
      );
    } else {
      setEmployees([]);
    }
  }, [companyId, today, company.employees]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const jobs = todayJobs;
  const todayClock = depth?.timeclock.filter((t) => t.shiftDate === today) ?? [];

  const clockAction = async (employeeId: string, action: "in" | "out") => {
    await fetch(`/api/timeclock/clock-${action === "in" ? "in" : "out"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, employeeId }),
    });
    await refresh();
  };

  return (
    <div className="space-y-3">
      {employees.length === 0 && (
        <PremiumCard className="p-4 text-sm text-muted-foreground">
          No HR employees found. Add employees in HR to manage clock-in and assignments.
        </PremiumCard>
      )}
      {employees.map((e) => {
        const name = `${e.firstName} ${e.lastName}`.trim();
        const active = todayClock.find(
          (t) => t.employeeId === e.id && (t.shiftStatus === "clocked_in" || t.shiftStatus === "on_break")
        );
        const assignment = jobs.find((j) => j.assignedEmployeeIds?.includes(e.id));
        return (
          <PremiumCard key={e.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground capitalize">{e.role ?? "employee"} · {e.phone ?? "—"}</p>
                {assignment && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Assignment: {assignment.address.city} — {assignment.scheduledWindowLabel ?? assignment.status}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusChip
                  label={
                    active
                      ? active.shiftStatus === "on_break"
                        ? "On break"
                        : "Clocked in"
                      : "Not clocked in"
                  }
                  variant={active ? "success" : "neutral"}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={!!active} onClick={() => void clockAction(e.id, "in")}>
                    Clock in
                  </Button>
                  <Button size="sm" variant="outline" disabled={!active} onClick={() => void clockAction(e.id, "out")}>
                    Clock out
                  </Button>
                </div>
              </div>
            </div>
          </PremiumCard>
        );
      })}
      {todayClock.length > 0 && (
        <PremiumCard className="p-4">
          <h3 className="mb-2 font-bold text-sm">Today&apos;s clock history</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {todayClock.map((t) => {
              const emp = employees.find((e) => e.id === t.employeeId);
              const name = emp ? `${emp.firstName} ${emp.lastName}`.trim() : t.employeeId;
              return (
                <li key={t.id}>
                  {name}: {format(new Date(t.clockInAt), "h:mm a")}
                  {t.clockOutAt ? ` – ${format(new Date(t.clockOutAt), "h:mm a")}` : " (active)"}
                </li>
              );
            })}
          </ul>
        </PremiumCard>
      )}
    </div>
  );
}

export function AdminFleetPanel() {
  const { companyId } = useCompany();
  const [depth, setDepth] = useState<OperationsDepthSnapshot | null>(null);
  const [trailers, setTrailers] = useState<Array<{ id: string; name: string; status: string; licensePlate?: string }>>([]);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [showAddTrailer, setShowAddTrailer] = useState(false);
  const [truckForm, setTruckForm] = useState({ name: "", licensePlate: "" });
  const [trailerForm, setTrailerForm] = useState({ name: "", licensePlate: "" });
  const [form, setForm] = useState({
    serviceType: "Oil change",
    serviceDate: format(new Date(), "yyyy-MM-dd"),
    odometerMiles: "",
    cost: "",
    vendor: "",
    nextDueDate: "",
    nextDueMiles: "",
  });

  const refresh = useCallback(async () => {
    const [d, trailerRes] = await Promise.all([
      loadDepth(companyId),
      fetch("/api/hr/fleet/trailers").then((r) => r.json()),
    ]);
    setDepth(d);
    if (trailerRes.ok) setTrailers(trailerRes.trailers ?? []);
    else setTrailers([]);
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitMaintenance = async () => {
    if (!selectedTruck) return;
    await fetch(`/api/trucks/${selectedTruck}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        ...form,
        odometerMiles: form.odometerMiles ? Number(form.odometerMiles) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        nextDueMiles: form.nextDueMiles ? Number(form.nextDueMiles) : undefined,
      }),
    });
    await refresh();
  };

  const createTruck = async () => {
    await fetch("/api/hr/fleet/trucks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(truckForm),
    });
    setTruckForm({ name: "", licensePlate: "" });
    setShowAddTruck(false);
    await refresh();
  };

  const createTrailer = async () => {
    await fetch("/api/hr/fleet/trailers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trailerForm),
    });
    setTrailerForm({ name: "", licensePlate: "" });
    setShowAddTrailer(false);
    await refresh();
  };

  const statusVariant = (s: string) =>
    s === "overdue" || s === "out_of_service" ? "urgent" : s === "due_soon" ? "warning" : "success";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setShowAddTruck(true)}>Add truck</Button>
        <Button size="sm" variant="outline" onClick={() => setShowAddTrailer(true)}>Add trailer</Button>
      </div>

      {showAddTruck && (
        <PremiumCard className="p-4 space-y-3 max-w-md">
          <p className="font-medium">New truck</p>
          <div><Label>Name</Label><Input value={truckForm.name} onChange={(e) => setTruckForm({ ...truckForm, name: e.target.value })} /></div>
          <div><Label>License plate</Label><Input value={truckForm.licensePlate} onChange={(e) => setTruckForm({ ...truckForm, licensePlate: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button onClick={() => void createTruck()}>Save</Button>
            <Button variant="outline" onClick={() => setShowAddTruck(false)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {showAddTrailer && (
        <PremiumCard className="p-4 space-y-3 max-w-md">
          <p className="font-medium">New trailer</p>
          <div><Label>Name</Label><Input value={trailerForm.name} onChange={(e) => setTrailerForm({ ...trailerForm, name: e.target.value })} /></div>
          <div><Label>License plate</Label><Input value={trailerForm.licensePlate} onChange={(e) => setTrailerForm({ ...trailerForm, licensePlate: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button onClick={() => void createTrailer()}>Save</Button>
            <Button variant="outline" onClick={() => setShowAddTrailer(false)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {(depth?.trucks ?? []).length === 0 && !showAddTruck && (
        <AdminEmptyState
          title="No trucks or trailers have been added."
          description="Add your first truck or trailer to start tracking maintenance and assignments."
        />
      )}

      {(depth?.trucks ?? []).map((t) => (
        <PremiumCard key={t.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.licensePlate}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Odometer: {t.odometerMiles?.toLocaleString() ?? "—"} mi
                {t.nextServiceDueAt && ` · Service due ${t.nextServiceDueAt}`}
              </p>
              {t.maintenanceNotes && (
                <p className="mt-1 text-xs text-amber-700">{t.maintenanceNotes}</p>
              )}
            </div>
            <StatusChip label={t.maintenanceStatus.replace(/_/g, " ")} variant={statusVariant(t.maintenanceStatus)} />
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setSelectedTruck(t.id)}>
            Log maintenance
          </Button>
        </PremiumCard>
      ))}

      {selectedTruck && (
        <PremiumCard className="p-4">
          <h3 className="mb-3 font-bold">Add maintenance log</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Service type</Label><Input value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} /></div>
            <div><Label>Service date</Label><Input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} /></div>
            <div><Label>Odometer</Label><Input value={form.odometerMiles} onChange={(e) => setForm({ ...form, odometerMiles: e.target.value })} /></div>
            <div><Label>Cost</Label><Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><Label>Next due date</Label><Input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void submitMaintenance()}>Save log</Button>
            <Button variant="outline" onClick={() => setSelectedTruck(null)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {depth?.maintenanceLogs && depth.maintenanceLogs.length > 0 && (
        <PremiumCard className="p-4">
          <h3 className="mb-2 font-bold text-sm">Recent maintenance</h3>
          <ul className="space-y-2 text-sm">
            {depth.maintenanceLogs.slice(0, 5).map((l) => (
              <li key={l.id} className="text-muted-foreground">
                {l.serviceDate}: {l.serviceType} — ${l.cost ?? 0} ({l.vendor ?? "—"})
              </li>
            ))}
          </ul>
        </PremiumCard>
      )}

      <h3 className="mt-6 font-medium">Trailers</h3>
      {trailers.length === 0 && !showAddTrailer && (
        <p className="text-sm text-muted-foreground">No trailers on file — add one above.</p>
      )}
      <div className="space-y-2">
        {trailers.map((t) => (
          <PremiumCard key={t.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{t.name}</p>
              {t.licensePlate && <p className="text-sm text-muted-foreground">{t.licensePlate}</p>}
            </div>
            <StatusChip label={t.status.replace(/_/g, " ")} variant="neutral" />
          </PremiumCard>
        ))}
      </div>
    </div>
  );
}

export function AdminDumpSitesPanel() {
  const { companyId } = useCompany();
  const [sites, setSites] = useState<OperationsDepthSnapshot["dumpSites"]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", baseFee: "" });

  const refresh = useCallback(async () => {
    const d = await loadDepth(companyId);
    setSites(d.dumpSites);
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleClosed = async (id: string, isClosed: boolean) => {
    await fetch(`/api/dump-sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        updates: {
          isClosed,
          closureReason: isClosed ? "Temporarily closed — admin toggle" : null,
        },
      }),
    });
    await refresh();
  };

  const createSite = async () => {
    await fetch("/api/dump-sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address,
        city: form.city || undefined,
        baseFee: form.baseFee ? Number(form.baseFee) : undefined,
      }),
    });
    setForm({ name: "", address: "", city: "", baseFee: "" });
    setShowAdd(false);
    await refresh();
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setShowAdd(true)}>Add dump site</Button>

      {showAdd && (
        <PremiumCard className="p-4 space-y-3 max-w-md">
          <p className="font-medium">New dump site</p>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Base fee ($)</Label><Input type="number" value={form.baseFee} onChange={(e) => setForm({ ...form, baseFee: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button onClick={() => void createSite()}>Save</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {sites.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground">No dump sites — add your disposal locations above.</p>
      )}
      {sites.map((d) => (
        <PremiumCard key={d.id} className={`p-4 ${d.isClosed ? "border-amber-300 bg-amber-50/50" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-muted-foreground">{d.address}</p>
              {d.isClosed && d.closureReason && (
                <p className="mt-1 text-sm text-amber-800">{d.closureReason}</p>
              )}
            </div>
            <StatusChip label={d.isClosed ? "Closed" : "Open"} variant={d.isClosed ? "warning" : "success"} />
          </div>
          {d.hoursJson && (
            <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground sm:grid-cols-4">
              {Object.entries(d.hoursJson).map(([day, hours]) => (
                <div key={day}>
                  <dt className="font-medium uppercase">{day}</dt>
                  <dd>{hours}</dd>
                </div>
              ))}
            </dl>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => void toggleClosed(d.id, !d.isClosed)}
          >
            Mark {d.isClosed ? "open" : "closed"}
          </Button>
        </PremiumCard>
      ))}
    </div>
  );
}

export function AdminCustomersPanel() {
  const { companyId } = useCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [interactions, setInteractions] = useState<OperationsDepthSnapshot["interactions"]>([]);
  const [noteCustomer, setNoteCustomer] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const refresh = useCallback(async () => {
    const [custRes, d] = await Promise.all([
      fetch("/api/admin/customers").then((r) => r.json()),
      loadDepth(companyId),
    ]);
    if (custRes.ok) setCustomers(custRes.customers ?? []);
    setInteractions(d.interactions);
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeCallback = async (customerId: string) => {
    await fetch(`/api/customers/${customerId}/callback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, callbackStatus: "completed" }),
    });
    await refresh();
  };

  const addInteraction = async () => {
    if (!noteCustomer) return;
    await fetch(`/api/customers/${noteCustomer}/interaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        interactionType: "note",
        direction: "internal",
        subject,
        body,
      }),
    });
    setSubject("");
    setBody("");
    setNoteCustomer(null);
    await refresh();
  };

  const createCustomer = async () => {
    await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    setNewCustomer({ firstName: "", lastName: "", phone: "", email: "" });
    setShowAdd(false);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setShowAdd(true)}>Add customer</Button>

      {showAdd && (
        <PremiumCard className="p-4 space-y-3 max-w-md">
          <p className="font-medium">New customer</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>First name</Label><Input value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} /></div>
            <div><Label>Last name</Label><Input value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void createCustomer()}>Save</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </PremiumCard>
      )}

      {customers.length === 0 && !showAdd && (
        <AdminEmptyState title="No customers yet." description="Add phone or text callers when they contact Morris Hauling." />
      )}
      {customers.map((c) => (
        <PremiumCard key={c.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.email}</p>
              {c.callbackStatus === "due" && c.callbackDueAt && (
                <p className="mt-1 text-sm text-amber-700">
                  Callback due: {format(new Date(c.callbackDueAt), "MMM d, h:mm a")}
                  {c.callbackNotes && ` — ${c.callbackNotes}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/customers/${c.id}`}
                className="inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
              >
                Open workspace
              </Link>
              {c.callbackStatus === "due" && (
                <Button size="sm" variant="outline" onClick={() => void completeCallback(c.id)}>
                  Mark callback done
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setNoteCustomer(c.id)}>
                Add note
              </Button>
            </div>
          </div>
        </PremiumCard>
      ))}

      {noteCustomer && (
        <PremiumCard className="p-4">
          <h3 className="mb-3 font-bold">Add interaction</h3>
          <div className="space-y-3">
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div><Label>Notes</Label><Input value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={() => void addInteraction()}>Save</Button>
              <Button variant="outline" onClick={() => setNoteCustomer(null)}>Cancel</Button>
            </div>
          </div>
        </PremiumCard>
      )}

      {interactions.length > 0 && (
        <PremiumCard className="p-4">
          <h3 className="mb-2 font-bold text-sm">Recent interactions</h3>
          <ul className="space-y-2 text-sm">
            {interactions.slice(0, 8).map((i) => {
              const cust = customers.find((c) => c.id === i.customerId);
              return (
                <li key={i.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{cust?.name ?? i.customerId}</span>
                  {" — "}
                  {i.interactionType}: {i.subject ?? i.body?.slice(0, 60)}
                </li>
              );
            })}
          </ul>
        </PremiumCard>
      )}
    </div>
  );
}
