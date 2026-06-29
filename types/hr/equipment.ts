export interface EquipmentCatalogItem {
  id: string;
  itemType: string;
  name: string;
  sku?: string;
  description?: string;
  replacementCost?: number;
  isTrackable: boolean;
  isActive: boolean;
}

export interface EquipmentAssignment {
  id: string;
  employeeId: string;
  catalogItemId?: string;
  itemType: string;
  itemName: string;
  serialNumber?: string;
  assignedAt: string;
  returnedAt?: string;
  conditionOnAssign?: string;
  conditionOnReturn?: string;
  status: "assigned" | "returned" | "lost" | "damaged";
  replacementCost?: number;
  notes?: string;
}

export interface EquipmentAsset {
  id: string;
  assetId: string;
  name: string;
  category: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpires?: string;
  condition: "excellent" | "good" | "fair" | "poor" | "out_of_service";
  location?: string;
  assignedEmployeeId?: string;
  assignedTruckId?: string;
  assignedTrailerId?: string;
  notes?: string;
  photoPaths: string[];
  expectedLifeMonths?: number;
  barcode?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
}

export interface EquipmentCheckoutEvent {
  id: string;
  assetId: string;
  employeeId: string;
  checkoutAt: string;
  returnRequestedAt?: string;
  returnedAt?: string;
  conditionOut: string;
  conditionIn?: string;
  employeeAcknowledgedAt?: string;
  signatureName?: string;
  notes?: string;
  asset?: EquipmentAsset;
}

export interface EquipmentDamageReport {
  id: string;
  assetId: string;
  reportedByEmployeeId: string;
  checkoutEventId?: string;
  severity: "minor" | "moderate" | "major" | "total_loss";
  description: string;
  photoPaths: string[];
  resolution?: string;
  status: "open" | "in_review" | "resolved" | "closed";
  createdAt: string;
  asset?: EquipmentAsset;
}

export interface EmployeeAssetSummary {
  asset: EquipmentAsset;
  checkout?: EquipmentCheckoutEvent;
  needsAcknowledgment: boolean;
}
