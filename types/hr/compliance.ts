export interface EmployeeCredential {
  id: string;
  employeeId: string;
  credentialType: "drivers_license" | "cdl" | "dot_medical" | "other";
  credentialNumberMasked?: string;
  issuingState?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: "active" | "expired" | "revoked" | "pending";
  notes?: string;
}

export interface SafetyIncident {
  id: string;
  employeeId?: string;
  truckId?: string;
  incidentType: string;
  incidentDate: string;
  location?: string;
  description: string;
  severity?: string;
  workersCompClaimNumber?: string;
  claimStatus?: string;
  estimatedCost?: number;
}
