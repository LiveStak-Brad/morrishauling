import type { Role } from "@/types";

/** Comma-separated in STAFF_OWNER_EMAILS; falls back to ADMIN_SETUP_EMAIL then default owner. */
function parseOwnerEmails(): string[] {
  const raw =
    process.env.STAFF_OWNER_EMAILS ??
    process.env.ADMIN_SETUP_EMAIL ??
    "wcba.mo@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const PRIVILEGED_STAFF_ROLES: Role[] = ["admin", "hr", "office_admin"];

export function getStaffOwnerEmails(): string[] {
  return parseOwnerEmails();
}

export function isStaffOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getStaffOwnerEmails().includes(email.trim().toLowerCase());
}

/** Only allowlisted emails may hold admin / HR / office-admin app roles. */
export function canHoldPrivilegedStaffRole(email: string | null | undefined): boolean {
  return isStaffOwnerEmail(email);
}

/**
 * Downgrade admin-like roles for non-owner accounts (e.g. seed/demo users).
 * Other staff keep employee / planner / customer roles as stored.
 */
export function normalizeStaffRole(role: Role, email: string | null | undefined): Role {
  if (PRIVILEGED_STAFF_ROLES.includes(role) && !canHoldPrivilegedStaffRole(email)) {
    return "employee";
  }
  return role;
}

export function isPrivilegedStaffRole(role: Role): boolean {
  return PRIVILEGED_STAFF_ROLES.includes(role);
}
