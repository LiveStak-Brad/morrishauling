import { format, subDays } from "date-fns";
import { morrisConfig, MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { getJobs } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getHrEmployeeById, getOnboardingProgress } from "./employees";
import { getAssignedCourses } from "./training";
import { getEmployeeAssets } from "./equipment";
import { getPunchesForEmployee, getEmployeeShifts } from "./time-schedule";
import { getHrEmployees } from "./employees";
import type { Job } from "@/types/job";
import type { PunchType } from "@/types/hr/time";
import type {
  ClockState,
  ClockSummary,
  EmployeeDashboardData,
  EmployeeProfileSelf,
  EmployeeProfileUpdate,
  RouteStop,
} from "@/types/hr/employee-portal";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fleetName(truckId?: string | null, kind: "truck" | "trailer" = "truck") {
  if (!truckId) return undefined;
  if (isDemoDataEnabled()) {
    const list = kind === "truck" ? morrisConfig.trucks : morrisConfig.trailers;
    return list.find((t) => t.id === truckId)?.name;
  }
  return truckId;
}

function deriveClockState(punches: { punchType: string; punchedAt: string }[], today: string): {
  state: ClockState;
  label: string;
  clockedInAt?: string;
  lunchStatus: ClockSummary["lunchStatus"];
  breakStatus: ClockSummary["breakStatus"];
} {
  const todayPunches = punches
    .filter((p) => p.punchedAt.startsWith(today))
    .sort((a, b) => a.punchedAt.localeCompare(b.punchedAt));

  if (todayPunches.length === 0) {
    return { state: "out", label: "Not clocked in", lunchStatus: "none", breakStatus: "none" };
  }

  const firstIn = todayPunches.find((p) => p.punchType === "clock_in");
  const last = todayPunches[todayPunches.length - 1];

  if (last.punchType === "clock_out") {
    return {
      state: "out",
      label: "Clocked out",
      clockedInAt: firstIn?.punchedAt,
      lunchStatus: todayPunches.some((p) => p.punchType === "lunch_in") ? "completed" : "none",
      breakStatus: todayPunches.some((p) => p.punchType === "break_end") ? "completed" : "none",
    };
  }

  if (last.punchType === "lunch_out") {
    return {
      state: "lunch",
      label: "On lunch",
      clockedInAt: firstIn?.punchedAt,
      lunchStatus: "on_lunch",
      breakStatus: "none",
    };
  }

  if (last.punchType === "break_start") {
    return {
      state: "break",
      label: "On break",
      clockedInAt: firstIn?.punchedAt,
      lunchStatus: todayPunches.some((p) => p.punchType === "lunch_in") ? "completed" : "none",
      breakStatus: "on_break",
    };
  }

  return {
    state: "in",
    label: "Clocked in",
    clockedInAt: firstIn?.punchedAt,
    lunchStatus: todayPunches.some((p) => p.punchType === "lunch_in") ? "completed" : "none",
    breakStatus: todayPunches.some((p) => p.punchType === "break_end") ? "completed" : "none",
  };
}

function allowedPunches(state: ClockState): PunchType[] {
  switch (state) {
    case "out":
      return ["clock_in"];
    case "in":
      return ["lunch_out", "break_start", "clock_out"];
    case "lunch":
      return ["lunch_in"];
    case "break":
      return ["break_end"];
    default:
      return [];
  }
}

export function calculateHoursFromPunches(
  punches: { punchType: string; punchedAt: string }[],
  today: string
): number {
  const sorted = punches
    .filter((p) => p.punchedAt.startsWith(today))
    .sort((a, b) => a.punchedAt.localeCompare(b.punchedAt));

  let hours = 0;
  let clockIn: Date | null = null;
  for (const p of sorted) {
    if (p.punchType === "clock_in" || p.punchType === "lunch_in" || p.punchType === "break_end") {
      clockIn = new Date(p.punchedAt);
    } else if (
      clockIn &&
      (p.punchType === "clock_out" || p.punchType === "lunch_out" || p.punchType === "break_start")
    ) {
      hours += (new Date(p.punchedAt).getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      clockIn = null;
    }
  }
  if (clockIn) {
    hours += (Date.now() - clockIn.getTime()) / (1000 * 60 * 60);
  }
  return Math.round(hours * 100) / 100;
}

function buildRouteStops(jobs: Job[]): RouteStop[] {
  const stops: RouteStop[] = [
    {
      id: "yard-start",
      type: "yard",
      label: "Start yard",
      address: morrisConfig.yardLocation
        ? `${morrisConfig.operatingBases[0]?.city ?? "Yard"}, MO`
        : "Morris Yard",
      status: jobs.some((j) => j.status === "in_progress") ? "completed" : "pending",
      time: jobs[0]?.scheduledWindowLabel?.split("–")[0]?.trim(),
    },
  ];

  const sorted = [...jobs].sort((a, b) =>
    (a.scheduledWindowLabel ?? "").localeCompare(b.scheduledWindowLabel ?? "")
  );

  sorted.forEach((job, idx) => {
    const loadTier = job.loadSizeTier;
    const loadPercent = loadTier
      ? ({ min_10: 10, quarter_25: 25, half_50: 50, three_quarter_75: 75, full_100: 100, multi_150: 100 } as Record<string, number>)[loadTier]
      : undefined;

    stops.push({
      id: job.id,
      type: "job",
      label: `Stop ${idx + 1}`,
      time: job.scheduledWindowLabel,
      address: `${job.address.street}, ${job.address.city}`,
      status:
        job.status === "completed"
          ? "completed"
          : job.status === "in_progress"
            ? "active"
            : "pending",
      jobId: job.id,
      jobType: job.serviceType.replace(/_/g, " "),
      loadPercent,
    });

    if (job.status === "needs_dump" || (idx > 0 && idx % 3 === 0)) {
      stops.push({
        id: `dump-${job.id}`,
        type: "dump",
        label: "Dump run",
        address: morrisConfig.dumpSites[0]?.name,
        status: "pending",
      });
    }
  });

  if (sorted.length >= 2) {
    stops.push({
      id: "lunch",
      type: "lunch",
      label: "Lunch",
      time: "12:00 PM",
      status: "pending",
    });
  }

  stops.push({
    id: "yard-end",
    type: "yard",
    label: "Return yard",
    address: morrisConfig.operatingBases[0]?.name ?? "Yard",
    status: sorted.every((j) => j.status === "completed") ? "completed" : "pending",
  });

  return stops;
}

export async function getEmployeeDashboard(
  companyId: string,
  employeeId: string
): Promise<EmployeeDashboardData | null> {
  const employee = await getHrEmployeeById(companyId, employeeId);
  if (!employee) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const sb = await sbWrite();
  const [allJobs, shifts, punches, weekPunches, allEmployees, onboarding, trainingAssigned, pendingDocs, assets, announcements] = await Promise.all([
    getJobs(companyId, { scheduledDate: today }),
    getEmployeeShifts(companyId, { employeeId, from: today, to: today }),
    getPunchesForEmployee(companyId, employeeId, today),
    getPunchesForEmployee(companyId, employeeId),
    getHrEmployees(companyId, { lifecycleStatus: "active" }),
    getOnboardingProgress(companyId, employeeId).catch(() => null),
    getAssignedCourses(companyId, employeeId).catch(() => []),
    sb
      .from("employee_documents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .in("status", ["pending", "awaiting_signature"])
      .then((r) => r.count ?? 0),
    getEmployeeAssets(companyId, employeeId).catch(() => []),
    sb
      .from("company_announcements")
      .select("id, title, body_html, priority")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(3)
      .then((r) => r.data ?? []),
  ]);

  const todayJobs = allJobs.filter((j) =>
    j.assignedEmployeeIds?.includes(employeeId) &&
    !["cancelled", "draft"].includes(j.status)
  );

  const currentJob =
    todayJobs.find((j) => j.status === "in_progress") ??
    todayJobs.find((j) => ["scheduled", "estimated"].includes(j.status));

  const crewIds = new Set<string>();
  todayJobs.forEach((j) => j.assignedEmployeeIds?.forEach((id) => {
    if (id !== employeeId) crewIds.add(id);
  }));

  const crew = [...crewIds].map((cid) => {
    const e = allEmployees.find((x) => x.id === cid);
    const legacy = isDemoDataEnabled()
      ? morrisConfig.employees.find((x) => x.id === cid)
      : undefined;
    return {
      id: cid,
      name: e ? `${e.firstName} ${e.lastName}` : legacy?.name ?? "Crew member",
      role: e?.role ?? legacy?.role ?? "helper",
    };
  });

  const todayShift = shifts[0];
  const shiftLabel = todayShift
    ? `${format(new Date(todayShift.startTime), "h:mm a")} – ${format(new Date(todayShift.endTime), "h:mm a")}`
    : todayJobs.length
      ? "See job windows below"
      : "No shift scheduled";

  const clockMeta = deriveClockState(punches, today);
  const hoursWorkedToday = calculateHoursFromPunches(punches, today);
  const hourlyRate = employee.hourlyRate ?? 18;

  let hoursThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    hoursThisWeek += calculateHoursFromPunches(weekPunches, d);
  }
  hoursThisWeek = Math.round(hoursThisWeek * 100) / 100;

  let weather: EmployeeDashboardData["weather"];
  try {
    const wRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=38.8114&longitude=-91.1415&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago"
    );
    const w = await wRes.json();
    const code = w.current?.weather_code ?? 0;
    const condition = code === 0 ? "Clear" : code < 3 ? "Partly cloudy" : code < 50 ? "Foggy" : code < 70 ? "Rain" : "Stormy";
    weather = { tempF: Math.round(w.current?.temperature_2m ?? 70), condition };
  } catch {
    weather = undefined;
  }

  const clock: ClockSummary = {
    state: clockMeta.state,
    stateLabel: clockMeta.label,
    clockedInAt: clockMeta.clockedInAt,
    hoursWorkedToday,
    estimatedGrossPayToday: Math.round(hoursWorkedToday * hourlyRate * 100) / 100,
    lunchStatus: clockMeta.lunchStatus,
    breakStatus: clockMeta.breakStatus,
    recentPunches: punches.slice(0, 8),
    allowedPunches: allowedPunches(clockMeta.state),
  };

  return {
    employee,
    greeting: greeting(),
    todayShift,
    shiftLabel,
    crew,
    truckName: fleetName(employee.primaryTruckId, "truck"),
    trailerName: fleetName(employee.primaryTrailerId, "trailer"),
    routeStopCount: todayJobs.length,
    todayJobs,
    currentJob,
    routeStops: buildRouteStops(todayJobs),
    clock,
    onboarding: onboarding ?? undefined,
    trainingOverdueCount: trainingAssigned.filter((t) => t.isOverdue || t.status === "expired").length,
    pendingDocumentsCount: pendingDocs,
    equipmentAssignedCount: assets.length,
    hoursThisWeek,
    projectedPaycheck: Math.round(hoursThisWeek * hourlyRate * 100) / 100,
    weather,
    announcements: announcements.map((a) => ({
      id: String(a.id),
      title: String(a.title),
      bodyHtml: String(a.body_html),
      priority: String(a.priority),
    })),
  };
}

export async function getEmployeeProfileSelf(
  companyId: string,
  employeeId: string,
  profileId: string
): Promise<EmployeeProfileSelf | null> {
  const sb = await sbWrite();
  const employee = await getHrEmployeeById(companyId, employeeId);
  if (!employee) return null;

  const [{ data: profile }, { data: contacts }, { data: uniforms }, { data: license }, { data: deposit }, { data: notif }] = await Promise.all([
    sb.from("profiles").select("name, full_name").eq("id", profileId).maybeSingle(),
    sb.from("employee_emergency_contacts").select("*").eq("employee_id", employeeId).eq("is_primary", true).maybeSingle(),
    sb.from("employee_uniform_sizes").select("item_type, size").eq("employee_id", employeeId),
    sb.from("employee_driver_credentials").select("*").eq("employee_id", employeeId).maybeSingle(),
    sb.from("employee_direct_deposits").select("account_number_last4").eq("employee_id", employeeId).eq("is_active", true).maybeSingle(),
    sb.from("employee_notification_preferences").select("channels").eq("employee_id", employeeId).maybeSingle(),
  ]);

  return {
    employee,
    preferredName: profile?.name ?? profile?.full_name,
    emergencyContact: contacts
      ? {
          id: contacts.id as string,
          name: contacts.name as string,
          relationship: contacts.relationship as string | undefined,
          phone: contacts.phone as string,
          email: contacts.email as string | undefined,
        }
      : undefined,
    uniformSizes: (uniforms ?? []).map((u) => ({
      itemType: u.item_type as string,
      size: u.size as string,
    })),
    readOnly: {
      employmentType: employee.employmentType,
      role: employee.role,
      hourlyRate: employee.hourlyRate,
      payType: employee.payType,
      employeeNumber: employee.employeeNumber,
    },
    driverLicense: license
      ? {
          licenseNumber: String(license.license_number),
          licenseClass: license.license_class as string | undefined,
          licenseState: String(license.license_state ?? "MO"),
          expiresAt: String(license.expires_at),
        }
      : undefined,
    directDepositLast4: deposit?.account_number_last4 as string | undefined,
    notificationPreferences: {
      email: Boolean((notif?.channels as { email?: boolean })?.email ?? true),
      sms: Boolean((notif?.channels as { sms?: boolean })?.sms ?? false),
      push: Boolean((notif?.channels as { push?: boolean })?.push ?? false),
    },
  };
}

export async function updateEmployeeProfileSelf(
  companyId: string,
  employeeId: string,
  profileId: string,
  updates: EmployeeProfileUpdate
) {
  const sb = await sbWrite();

  const empRow: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.phone !== undefined) empRow.phone = updates.phone;
  if (updates.addressLine1 !== undefined) empRow.address_line1 = updates.addressLine1;
  if (updates.city !== undefined) empRow.city = updates.city;
  if (updates.state !== undefined) empRow.state = updates.state;
  if (updates.zip !== undefined) empRow.zip = updates.zip;

  if (Object.keys(empRow).length > 1) {
    await sb.from("employees").update(empRow).eq("id", employeeId).eq("company_id", companyId);
  }

  if (updates.preferredName) {
    await sb.from("profiles").update({
      name: updates.preferredName,
      full_name: updates.preferredName,
      phone: updates.phone,
      updated_at: new Date().toISOString(),
    }).eq("id", profileId);
  } else if (updates.phone !== undefined) {
    await sb.from("profiles").update({
      phone: updates.phone,
      updated_at: new Date().toISOString(),
    }).eq("id", profileId);
  }

  if (updates.emergencyContact?.name && updates.emergencyContact.phone) {
    const { data: existing } = await sb
      .from("employee_emergency_contacts")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("is_primary", true)
      .maybeSingle();

    const row = {
      name: updates.emergencyContact.name,
      relationship: updates.emergencyContact.relationship,
      phone: updates.emergencyContact.phone,
      email: updates.emergencyContact.email,
      is_primary: true,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await sb.from("employee_emergency_contacts").update(row).eq("id", existing.id);
    } else {
      await sb.from("employee_emergency_contacts").insert({
        id: id("ec"),
        company_id: companyId,
        employee_id: employeeId,
        ...row,
      });
    }
  }

  if (updates.uniformSizes?.length) {
    for (const u of updates.uniformSizes) {
      if (!u.itemType || !u.size) continue;
      const { data: existing } = await sb
        .from("employee_uniform_sizes")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("item_type", u.itemType)
        .maybeSingle();

      if (existing?.id) {
        await sb.from("employee_uniform_sizes").update({
          size: u.size,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await sb.from("employee_uniform_sizes").insert({
          id: id("uni"),
          company_id: companyId,
          employee_id: employeeId,
          item_type: u.itemType,
          size: u.size,
        });
      }
    }
  }

  if (updates.driverLicense?.licenseNumber && updates.driverLicense.expiresAt) {
    const { data: existing } = await sb
      .from("employee_driver_credentials")
      .select("id")
      .eq("employee_id", employeeId)
      .maybeSingle();
    const licRow = {
      license_number: updates.driverLicense.licenseNumber,
      license_class: updates.driverLicense.licenseClass,
      license_state: updates.driverLicense.licenseState ?? "MO",
      expires_at: updates.driverLicense.expiresAt,
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await sb.from("employee_driver_credentials").update(licRow).eq("id", existing.id);
    } else {
      await sb.from("employee_driver_credentials").insert({
        id: id("dl"),
        company_id: companyId,
        employee_id: employeeId,
        ...licRow,
      });
    }
  }

  if (updates.notificationPreferences) {
    const { data: existing } = await sb
      .from("employee_notification_preferences")
      .select("id")
      .eq("employee_id", employeeId)
      .maybeSingle();
    const row = {
      channels: updates.notificationPreferences,
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await sb.from("employee_notification_preferences").update(row).eq("id", existing.id);
    } else {
      await sb.from("employee_notification_preferences").insert({
        id: id("np"),
        company_id: companyId,
        employee_id: employeeId,
        ...row,
      });
    }
  }
}

export async function reportEquipmentIssue(
  companyId: string,
  employeeId: string,
  assignmentId: string,
  issueType: "damaged" | "lost" | "needs_replacement",
  notes?: string
) {
  const sb = await sbWrite();
  const status = issueType === "lost" ? "lost" : "damaged";
  await sb.from("equipment_assignments").update({
    status,
    notes: notes ?? issueType,
    updated_at: new Date().toISOString(),
  }).eq("id", assignmentId).eq("employee_id", employeeId).eq("company_id", companyId);
}

export async function getEmployeeJob(
  companyId: string,
  employeeId: string | null | undefined,
  jobId: string,
  options?: { privileged?: boolean }
): Promise<Job | null> {
  const job = await import("@/lib/db/operations").then((m) => m.getJobById(companyId, jobId));
  if (!job) return null;
  if (options?.privileged) return job;
  if (!employeeId) return null;
  if (!job.assignedEmployeeIds?.includes(employeeId)) return null;
  return job;
}

export { MORRIS_COMPANY_ID };
