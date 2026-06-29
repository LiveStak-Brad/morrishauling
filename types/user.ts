// @supabase-table: users

export type Role =
  | "customer"
  | "employee"
  | "planner"
  | "admin"
  | "platform_admin";

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
}

export interface Customer extends User {
  role: "customer";
  address?: string;
}

export interface Employee extends User {
  role: "employee" | "planner" | "admin";
  employeeId?: string;
}
