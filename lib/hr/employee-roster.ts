import type { CompanyConfig } from "@/types";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { filterHrEmployees } from "@/lib/data/real-record-filter";

export type EmployeeRosterEntry = {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
};

export function avatarForEmployee(name: string, employeeId: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || employeeId)}`;
}

/** HR employees from Supabase; config employees only when demo mode is explicitly enabled. */
export function resolveEmployeeRoster(
  hrEmployees:
    | Array<{
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: string;
      }>
    | undefined,
  configEmployees: CompanyConfig["employees"]
): EmployeeRosterEntry[] {
  if (hrEmployees?.length) {
    const list = isDemoDataEnabled() ? hrEmployees : filterHrEmployees(hrEmployees);
    return list.map((e) => {
      const name = e.name ?? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim();
      return {
        id: e.id,
        name: name || e.id,
        phone: e.phone,
        role: e.role,
        avatarUrl: avatarForEmployee(name, e.id),
      };
    });
  }
  if (isDemoDataEnabled()) {
    return configEmployees.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      role: e.role,
      avatarUrl: e.avatarUrl ?? avatarForEmployee(e.name, e.id),
    }));
  }
  return [];
}

export function findEmployeeInRoster(
  roster: EmployeeRosterEntry[],
  employeeId: string
): EmployeeRosterEntry | undefined {
  return roster.find((e) => e.id === employeeId);
}

export function employeeDisplayName(
  roster: EmployeeRosterEntry[],
  employeeId: string
): string {
  return findEmployeeInRoster(roster, employeeId)?.name ?? employeeId;
}
