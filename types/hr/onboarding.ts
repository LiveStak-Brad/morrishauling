export type OnboardingItemStatus = "pending" | "complete" | "waived";

export interface OnboardingTemplate {
  id: string;
  companyId: string;
  name: string;
  employmentType: string;
  isActive: boolean;
  items?: OnboardingTemplateItem[];
}

export interface OnboardingTemplateItem {
  id: string;
  templateId: string;
  itemKey: string;
  label: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface EmployeeOnboardingItem {
  id: string;
  employeeId: string;
  itemKey: string;
  label: string;
  status: OnboardingItemStatus;
  isRequired: boolean;
  completedAt?: string;
  completedByProfileId?: string;
  waivedReason?: string;
  sortOrder: number;
}

export interface OnboardingProgress {
  employeeId: string;
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  requiredComplete: number;
  percentComplete: number;
  canActivate: boolean;
  items: EmployeeOnboardingItem[];
}
