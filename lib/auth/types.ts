import type { Role } from "@/types";

export interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  name: string;
  role: Role;
  phone?: string | null;
  status: "active" | "inactive" | "suspended";
  employee_id?: string | null;
  address?: string | null;
  customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_HOME_ROUTES: Record<Role, string> = {
  customer: "/customer",
  employee: "/employee",
  planner: "/planner",
  admin: "/admin",
  hr: "/admin/hr",
  office_admin: "/admin/hr",
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  employee: "Employee",
  planner: "Planner / Dispatcher",
  admin: "Admin / Owner",
  hr: "HR",
  office_admin: "Office Admin",
};

export function roleHomeRoute(role: Role): string {
  return ROLE_HOME_ROUTES[role];
}
