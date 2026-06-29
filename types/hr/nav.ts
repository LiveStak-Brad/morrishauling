export interface HrNavStats {
  activeApplicants: number;
  onboardingIncomplete: number;
  payrollPending: number;
  expiringDocuments: number;
}

export interface DispatchReadyEmployee {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  lifecycleStatus: string;
  employmentType?: string;
  employeeNumber?: string;
  onboardingComplete: boolean;
  onboardingPercent: number;
  driverLicenseOk: boolean;
  licenseWarning?: string;
  warnings: string[];
  profileId?: string;
}
