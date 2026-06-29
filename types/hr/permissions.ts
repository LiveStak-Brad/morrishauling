export type WorkforceRole =
  | "owner"
  | "operations_manager"
  | "dispatcher"
  | "office_admin"
  | "hr"
  | "crew_leader"
  | "driver"
  | "employee";

export type HrPermission =
  | "hr.applicants.read"
  | "hr.applicants.write"
  | "hr.applicants.hire"
  | "hr.employees.read"
  | "hr.employees.write"
  | "hr.employees.terminate"
  | "hr.documents.read"
  | "hr.documents.manage"
  | "hr.documents.sign"
  | "hr.payroll.read"
  | "hr.payroll.export"
  | "hr.payroll.lock"
  | "hr.tax.read"
  | "hr.notes.read"
  | "hr.notes.private.read"
  | "hr.discipline.write"
  | "timeclock.approve"
  | "schedule.manage"
  | "equipment.assign"
  | "training.manage"
  | "performance.manage";

export interface PermissionDefinition {
  id: string;
  permissionKey: HrPermission;
  label: string;
  category: string;
  description?: string;
}
