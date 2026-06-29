import type { EmploymentType } from "./ats";

export type LifecycleStatus = "onboarding" | "active" | "on_leave" | "terminated" | "archived";

export interface HrEmployee {
  id: string;
  companyId: string;
  profileId?: string;
  employeeNumber?: string;
  sourceApplicationId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role: string;
  status: string;
  lifecycleStatus: LifecycleStatus;
  employmentType?: EmploymentType;
  departmentId?: string;
  positionId?: string;
  managerEmployeeId?: string;
  hireDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  payType?: string;
  hourlyRate?: number;
  commissionRate?: number;
  overtimeEligible: boolean;
  primaryTruckId?: string;
  primaryTrailerId?: string;
  secondaryTruckId?: string;
  secondaryTrailerId?: string;
  driverLicenseOnFile: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string };
  position?: { id: string; title: string };
  manager?: { id: string; firstName: string; lastName: string };
}

export interface EmployeeEmergencyContact {
  id: string;
  employeeId: string;
  name: string;
  relationship?: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface EmployeePayRate {
  id: string;
  employeeId: string;
  payType: string;
  amount: number;
  commissionRate?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  reason?: string;
}

export interface EmployeeDispatchStats {
  employeeId: string;
  todayJobs: number;
  lifetimeJobs: number;
  avgJobValue: number;
  revenueProduced: number;
  profitProduced: number;
  laborCost: number;
}
