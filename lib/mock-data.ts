import type {
  Customer,
  Employee,
  FinancingRequest,
  Invoice,
  Job,
  Payment,
  User,
} from "@/types";
import type { ScheduleSlot } from "@/types/schedule";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { generateSeedScheduleSlots } from "@/lib/schedule/seed-schedule-slots";
import { computeSlotStatus } from "@/lib/schedule/slot-status";
import { applyCustomerCallbackFields } from "@/lib/mock-operations-depth";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const now = new Date().toISOString();
const today = new Date().toISOString().split("T")[0];

// --- Users ---

const morrisCustomer: Customer = {
  id: "cust-m1",
  companyId: MORRIS_COMPANY_ID,
  email: "alex.customer@email.com",
  name: "Alex Johnson",
  role: "customer",
  phone: "(636) 555-8800",
  address: "142 Main St, St. Charles, MO 63301",
};


const morrisEmployees: Employee[] = [
  { id: "user-m-admin", companyId: MORRIS_COMPANY_ID, email: "admin@morrisjunk.com", name: "James Morris", role: "admin", employeeId: "emp-m1" },
  { id: "user-m-planner", companyId: MORRIS_COMPANY_ID, email: "dispatch@morrisjunk.com", name: "Dana Chen", role: "planner", employeeId: "emp-m4" },
  { id: "user-m-emp", companyId: MORRIS_COMPANY_ID, email: "marcus@morrisjunk.com", name: "Marcus Webb", role: "employee", employeeId: "emp-m2" },
];

// --- Jobs ---

const morrisJobs: Job[] = [
  {
    id: "job-m1",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "scheduled",
    junkType: "residential",
    items: [{ id: "item-1", name: "Old couch", quantity: 1 }, { id: "item-2", name: "Boxes", quantity: 8 }],
    loadSizeTier: "quarter_25",
    accessDetails: { stairs: true, stairFlights: 2, elevator: false, longCarryFt: 30, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
    address: { street: "142 Main St", city: "St. Charles", state: "MO", zip: "63301", location: { lat: 38.79, lng: -90.48 } },
    photos: [],
    estimate: { id: "est-m1", jobId: "job-m1", subtotal: 199, modifiers: [{ id: "stairs", label: "Stairs", amount: 50 }], total: 249, trailerPercent: 25, disclaimerAccepted: true, createdAt: now },
    warnings: ["stairs_access"],
    scheduledDate: today,
    routeOrder: 1,
    assignedTruckId: "truck-m1",
    assignedTrailerId: "trailer-m1",
    assignedEmployeeIds: ["emp-m2", "emp-m3"],
    customerNotes: "Gate code 4521. Dog in backyard.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m2",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "scheduled",
    junkType: "estate",
    items: [{ id: "item-3", name: "Furniture set", quantity: 1 }, { id: "item-4", name: "Mattresses", quantity: 3 }],
    loadSizeTier: "half_50",
    accessDetails: { stairs: false, elevator: true, longCarryFt: 80, basement: true, attic: false, tightAccess: true, heavyItems: true, specialDisposal: false, notes: "Narrow hallway" },
    address: { street: "88 Oakwood Dr", city: "Warrenton", state: "MO", zip: "63383", location: { lat: 38.81, lng: -91.13 } },
    photos: [],
    estimate: { id: "est-m2", jobId: "job-m2", subtotal: 349, modifiers: [{ id: "basement", label: "Basement", amount: 40 }, { id: "long_carry", label: "Long carry (50+ ft)", amount: 75 }, { id: "tight_access", label: "Tight access", amount: 50 }, { id: "heavy_items", label: "Heavy items", amount: 100 }], total: 614, trailerPercent: 50, disclaimerAccepted: true, createdAt: now },
    warnings: ["heavy_load", "long_carry", "price_may_need_adjustment"],
    scheduledDate: today,
    routeOrder: 2,
    assignedTruckId: "truck-m1",
    assignedTrailerId: "trailer-m1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m3",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "scheduled",
    junkType: "construction",
    items: [{ id: "item-5", name: "Drywall", quantity: 20 }],
    loadSizeTier: "three_quarter_75",
    accessDetails: { stairs: false, elevator: false, longCarryFt: 10, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
    address: { street: "210 Builder Way", city: "O'Fallon", state: "MO", zip: "63368", location: { lat: 38.78, lng: -90.70 } },
    photos: [],
    estimate: { id: "est-m3", jobId: "job-m3", subtotal: 499, modifiers: [], total: 499, trailerPercent: 75, disclaimerAccepted: true, createdAt: now },
    warnings: [],
    scheduledDate: today,
    routeOrder: 3,
    assignedTruckId: "truck-m1",
    assignedTrailerId: "trailer-m1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m4",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "completed",
    junkType: "appliance",
    items: [{ id: "item-6", name: "Refrigerator", quantity: 1 }],
    loadSizeTier: "min_10",
    accessDetails: { stairs: false, elevator: false, longCarryFt: 0, basement: false, attic: false, tightAccess: false, heavyItems: true, specialDisposal: true },
    address: { street: "55 Maple St", city: "Troy", state: "MO", zip: "63379", location: { lat: 38.98, lng: -90.97 } },
    photos: [],
    estimate: { id: "est-m4", jobId: "job-m4", subtotal: 99, modifiers: [{ id: "heavy_items", label: "Heavy items", amount: 100 }, { id: "special_disposal", label: "Special disposal", amount: 150 }], total: 349, trailerPercent: 10, disclaimerAccepted: true, createdAt: now },
    warnings: ["special_disposal"],
    paymentCollected: true,
    finalLoadSizeTier: "min_10",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m5",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "estimated",
    junkType: "furniture",
    items: [],
    loadSizeTier: "min_10",
    accessDetails: { stairs: false, elevator: false, longCarryFt: 0, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
    address: { street: "220 Pine St", city: "St. Charles", state: "MO", zip: "63301", location: { lat: 38.79, lng: -90.49 } },
    photos: [],
    estimate: { id: "est-m5", jobId: "job-m5", subtotal: 95, modifiers: [{ id: "items", label: "Item pickup total", amount: 95 }], total: 287, trailerPercent: 12, disclaimerAccepted: true, createdAt: now },
    junkRemovalDetails: {
      id: "jrd-m5",
      companyId: MORRIS_COMPANY_ID,
      jobId: "job-m5",
      estimateMode: "single_item",
      selectedItems: [{ itemId: "couch", quantity: 1 }],
      selectedCategory: "furniture",
      loadPercentage: 12,
      estimatedLaborMinutes: 25,
      estimatedCrewSize: 1,
      stairsFlights: 0,
      reviewRequired: false,
      reviewReasons: [],
      reviewStatus: "auto_ready",
      originBaseName: "Warrenton Operating Base",
      selectedDisposalSiteId: "dump-warren-county",
      selectedDisposalSiteName: "Warren County Disposal",
      disposalCategory: "general_junk",
      estimatedDispatchMiles: 28,
      estimatedCustomerToDisposalMiles: 12,
      estimatedReturnMiles: 18,
      estimatedTotalRouteMiles: 58,
      estimatedDriveMinutes: 72,
      disposalSelectionReason: "Nearest general junk disposal accepting furniture",
      disposalUncertain: false,
      customerPricingBreakdown: [
        { id: "service_call", label: "Removal Service", amount: 79 },
        { id: "junk_removal", label: "Couch Removal", amount: 95 },
        { id: "transportation", label: "Travel & Transportation", amount: 49, helperText: "Includes travel, loading, and transportation." },
        { id: "disposal", label: "Disposal & Recycling", amount: 45 },
      ],
      internalCostBreakdown: [],
      minimumsApplied: [],
      estimatedProfit: 198,
      estimatedMargin: 69,
      priorityLevel: "standard",
      dumpFeeEstimate: 45,
      mileageEstimate: 58,
      fuelAdjustment: 25,
      createdAt: now,
      updatedAt: now,
    },
    reviewStatus: "auto_ready",
    warnings: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m6",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "submitted",
    junkType: "hottub",
    items: [{ id: "i-ht", name: "6-person hot tub", quantity: 1 }],
    loadSizeTier: "three_quarter_75",
    accessDetails: { stairs: false, elevator: false, longCarryFt: 60, basement: false, attic: false, tightAccess: true, heavyItems: true, specialDisposal: true, notes: "Not sure if it is drained yet" },
    address: { street: "501 Lakeview Dr", city: "Lake St. Louis", state: "MO", zip: "63367", location: { lat: 38.78, lng: -90.78 } },
    photos: [{ id: "ph-1", url: "/placeholder-photo.jpg" }],
    estimate: { id: "est-m6", jobId: "job-m6", subtotal: 499, modifiers: [], total: 892, trailerPercent: 75, disclaimerAccepted: true, createdAt: now },
    junkRemovalDetails: {
      id: "jrd-m6",
      companyId: MORRIS_COMPANY_ID,
      jobId: "job-m6",
      estimateMode: "cleanout",
      selectedCategory: "hottub",
      loadPercentage: 75,
      estimatedLaborMinutes: 180,
      estimatedCrewSize: 3,
      longCarryDistanceFt: 60,
      heavyItems: true,
      specialDisposal: true,
      reviewRequired: true,
      reviewReasons: ["Photos uploaded — visual review requested", "Hot tub removal", "Long carry (60 ft)", "Customer notes indicate uncertainty"],
      reviewStatus: "needs_review",
      originBaseName: "Warrenton Operating Base",
      selectedDisposalSiteId: "dump-danville-yard",
      selectedDisposalSiteName: "Danville Yard — Morris storage / bulky",
      disposalCategory: "bulky_special",
      estimatedDispatchMiles: 32,
      estimatedCustomerToDisposalMiles: 22,
      estimatedReturnMiles: 28,
      estimatedTotalRouteMiles: 82,
      estimatedDriveMinutes: 98,
      disposalSelectionReason: "Bulky special item routed to Danville yard",
      disposalUncertain: true,
      customerPricingBreakdown: [],
      internalCostBreakdown: [],
      minimumsApplied: ["Minimum travel fee applied"],
      estimatedProfit: 520,
      estimatedMargin: 58,
      priorityLevel: "standard",
      dumpFeeEstimate: 85,
      mileageEstimate: 82,
      fuelAdjustment: 25,
      createdAt: now,
      updatedAt: now,
    },
    reviewStatus: "needs_review",
    warnings: ["heavy_load", "long_carry", "price_may_need_adjustment"],
    customerNotes: "Not sure if it is drained yet",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "job-m7",
    companyId: MORRIS_COMPANY_ID,
    customerId: morrisCustomer.id,
    serviceType: "junk_removal",
    status: "submitted",
    junkType: "other",
    items: [],
    loadSizeTier: "quarter_25",
    accessDetails: { stairs: true, stairFlights: 2, elevator: false, longCarryFt: 0, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
    address: { street: "12 Elm Ct", city: "Wentzville", state: "MO", zip: "63385", location: { lat: 38.82, lng: -90.85 } },
    photos: [],
    estimate: { id: "est-m7", jobId: "job-m7", subtotal: 350, modifiers: [], total: 350, trailerPercent: 40, disclaimerAccepted: true, createdAt: now },
    junkRemovalDetails: {
      id: "jrd-m7",
      companyId: MORRIS_COMPANY_ID,
      jobId: "job-m7",
      estimateMode: "single_item",
      selectedItems: [{ itemId: "piano", quantity: 1 }],
      loadPercentage: 40,
      estimatedLaborMinutes: 120,
      estimatedCrewSize: 3,
      stairsFlights: 2,
      reviewRequired: true,
      reviewReasons: ["Piano selected", "2 flights of stairs"],
      reviewStatus: "needs_review",
      originBaseName: "Warrenton Operating Base",
      selectedDisposalSiteId: "dump-warren-county",
      selectedDisposalSiteName: "Warren County Disposal",
      disposalCategory: "heavy_special",
      estimatedDispatchMiles: 35,
      estimatedCustomerToDisposalMiles: 14,
      estimatedReturnMiles: 20,
      estimatedTotalRouteMiles: 69,
      estimatedDriveMinutes: 84,
      disposalSelectionReason: "Heavy special item — disposal fee estimated",
      disposalUncertain: true,
      customerPricingBreakdown: [],
      internalCostBreakdown: [],
      minimumsApplied: [],
      estimatedProfit: 210,
      estimatedMargin: 60,
      priorityLevel: "standard",
      dumpFeeEstimate: 45,
      mileageEstimate: 69,
      fuelAdjustment: 25,
      createdAt: now,
      updatedAt: now,
    },
    reviewStatus: "needs_review",
    warnings: ["stairs_access", "price_may_need_adjustment"],
    createdAt: now,
    updatedAt: now,
  },
];


// --- Invoices & Payments ---

const morrisInvoices: Invoice[] = [
  {
    id: "inv-m1",
    invoiceNumber: "MH-2026-0142",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m4",
    customerId: morrisCustomer.id,
    estimateAmount: 349,
    adjustments: [
      { id: "adj-1", label: "Heavy items", amount: 100 },
      { id: "adj-2", label: "Special disposal", amount: 150 },
    ],
    subtotal: 349,
    fees: 0,
    depositAmount: 0,
    depositPaid: 0,
    total: 349,
    amountPaid: 349,
    balanceDue: 0,
    status: "paid",
    paymentStatus: "paid_in_full",
    dueDate: today,
    terms: "Payment due upon completion. All sales final after 48 hours.",
    finalPriceNotes: "Final load matched estimate.",
    createdAt: now,
  },
  {
    id: "inv-m2",
    invoiceNumber: "MH-2026-0143",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m1",
    customerId: morrisCustomer.id,
    estimateAmount: 249,
    adjustments: [{ id: "adj-s", label: "Stairs", amount: 50 }],
    subtotal: 249,
    fees: 0,
    depositAmount: 62,
    depositPaid: 62,
    total: 249,
    amountPaid: 62,
    balanceDue: 187,
    status: "partial",
    paymentStatus: "balance_due",
    dueDate: today,
    terms: "25% deposit required to schedule. Balance due on completion.",
    createdAt: now,
  },
  {
    id: "inv-m3",
    invoiceNumber: "MH-2026-0144",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m2",
    customerId: morrisCustomer.id,
    estimateAmount: 614,
    adjustments: [
      { id: "adj-b", label: "Basement", amount: 40 },
      { id: "adj-l", label: "Long carry", amount: 75 },
      { id: "adj-t", label: "Tight access", amount: 50 },
      { id: "adj-h", label: "Heavy items", amount: 100 },
    ],
    subtotal: 614,
    fees: 0,
    depositAmount: 154,
    depositPaid: 0,
    total: 614,
    amountPaid: 0,
    balanceDue: 614,
    status: "sent",
    paymentStatus: "financing_requested",
    dueDate: today,
    terms: "Financing request under review.",
    createdAt: now,
  },
];

const morrisPayments: Payment[] = [
  {
    id: "pay-m1",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m4",
    invoiceId: "inv-m1",
    amount: 349,
    method: "card",
    timing: "full",
    status: "completed",
    receiptNumber: "RCP-10042",
    createdAt: now,
  },
  {
    id: "pay-m2",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m1",
    invoiceId: "inv-m2",
    amount: 62,
    method: "card",
    timing: "deposit",
    status: "completed",
    receiptNumber: "RCP-10043",
    createdAt: now,
  },
];

const morrisFinancing: FinancingRequest[] = [
  {
    id: "fin-m1",
    companyId: MORRIS_COMPANY_ID,
    jobId: "job-m2",
    invoiceId: "inv-m3",
    customerId: morrisCustomer.id,
    provider: "in_house",
    status: "pending",
    totalAmount: 614,
    downPayment: 150,
    numberOfPayments: 6,
    paymentFrequency: "weekly",
    preferredFirstPaymentDate: today,
    employmentStatus: "employed",
    monthlyIncome: 5200,
    customerNotes: "Need to spread payments over 6 weeks after job completion.",
    internalNotes: "",
    termsAccepted: true,
    signaturePlaceholder: "Alex Johnson",
    riskScore: 72,
    createdAt: now,
    updatedAt: now,
  },
];

// --- In-memory stores ---

type DataStore = {
  users: User[];
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financingRequests: FinancingRequest[];
  scheduleSlots: ScheduleSlot[];
  activityLog: Record<string, unknown>[];
};

const seededSlots = generateSeedScheduleSlots(MORRIS_COMPANY_ID);

const store: DataStore = {
  users: [morrisCustomer, ...morrisEmployees],
  jobs: [...morrisJobs],
  invoices: [...morrisInvoices],
  payments: [...morrisPayments],
  financingRequests: [...morrisFinancing],
  scheduleSlots: seededSlots,
  activityLog: [],
};

function getStore(_companyId: string = MORRIS_COMPANY_ID): DataStore {
  return store;
}

export function getUsers(companyId: string): User[] {
  return getStore(companyId).users;
}

export function getCustomers(companyId: string): Customer[] {
  return applyCustomerCallbackFields(
    companyId,
    getStore(companyId).users.filter((u): u is Customer => u.role === "customer")
  );
}

export function appendMockActivity(row: Record<string, unknown>) {
  getStore().activityLog.unshift(row);
}

export function getMockActivityLog(companyId: string, limit = 50): Record<string, unknown>[] {
  return getStore(companyId).activityLog
    .filter((r) => r.company_id === companyId)
    .slice(0, limit);
}

export function getCustomer(companyId: string, customerId: string): Customer | undefined {
  return getCustomers(companyId).find((c) => c.id === customerId);
}

export function getJobs(companyId: string, filters?: { status?: string; scheduledDate?: string }): Job[] {
  let jobs = getStore(companyId).jobs;
  if (filters?.status) jobs = jobs.filter((j) => j.status === filters.status);
  if (filters?.scheduledDate) jobs = jobs.filter((j) => j.scheduledDate === filters.scheduledDate);
  return jobs;
}

export function getJob(jobId: string): Job | undefined {
  return store.jobs.find((j) => j.id === jobId);
}

export function getJobByCompany(companyId: string, jobId: string): Job | undefined {
  return getStore(companyId).jobs.find((j) => j.id === jobId);
}

export function createJob(companyId: string, job: Omit<Job, "id" | "createdAt" | "updatedAt">): Job {
  const jobId = id("job");
  const newJob: Job = {
    ...job,
    id: jobId,
    junkRemovalDetails: job.junkRemovalDetails
      ? { ...job.junkRemovalDetails, id: job.junkRemovalDetails.id === "pending" ? `jrd-${jobId}` : job.junkRemovalDetails.id, jobId }
      : undefined,
    estimate: job.estimate ? { ...job.estimate, jobId } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getStore(companyId).jobs.push(newJob);
  return newJob;
}

export function updateJob(companyId: string, jobId: string, updates: Partial<Job>): Job | undefined {
  const store = getStore(companyId);
  const idx = store.jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) return undefined;
  store.jobs[idx] = { ...store.jobs[idx], ...updates, updatedAt: new Date().toISOString() };
  return store.jobs[idx];
}

export function getInvoices(companyId: string): Invoice[] {
  return getStore(companyId).invoices;
}

export function getInvoice(companyId: string, invoiceId: string): Invoice | undefined {
  return getStore(companyId).invoices.find((i) => i.id === invoiceId);
}

export function createInvoice(companyId: string, invoice: Omit<Invoice, "id" | "createdAt">): Invoice {
  const newInvoice: Invoice = {
    ...invoice,
    id: id("inv"),
    createdAt: new Date().toISOString(),
  };
  getStore(companyId).invoices.push(newInvoice);
  return newInvoice;
}

export function updateInvoice(companyId: string, invoiceId: string, updates: Partial<Invoice>): Invoice | undefined {
  const store = getStore(companyId);
  const idx = store.invoices.findIndex((i) => i.id === invoiceId);
  if (idx === -1) return undefined;
  store.invoices[idx] = { ...store.invoices[idx], ...updates };
  return store.invoices[idx];
}

export function getPayments(companyId: string): Payment[] {
  return getStore(companyId).payments;
}

export function createPayment(companyId: string, payment: Omit<Payment, "id" | "createdAt">): Payment {
  const newPayment: Payment = {
    ...payment,
    id: id("pay"),
    createdAt: new Date().toISOString(),
  };
  getStore(companyId).payments.push(newPayment);
  return newPayment;
}

export function getInvoiceByJob(companyId: string, jobId: string): Invoice | undefined {
  return getStore(companyId).invoices.find((i) => i.jobId === jobId);
}

export function getPaymentsForInvoice(companyId: string, invoiceId: string): Payment[] {
  return getStore(companyId).payments.filter((p) => p.invoiceId === invoiceId);
}

export function getPaymentsForCustomer(companyId: string, customerId: string): Payment[] {
  const store = getStore(companyId);
  const jobIds = store.jobs.filter((j) => j.customerId === customerId).map((j) => j.id);
  return store.payments.filter((p) => jobIds.includes(p.jobId));
}

export function getFinancingByJob(companyId: string, jobId: string): FinancingRequest | undefined {
  return getStore(companyId).financingRequests.find((f) => f.jobId === jobId);
}

export function getInvoicesForCustomer(companyId: string, customerId: string): Invoice[] {
  return getStore(companyId).invoices.filter((i) => i.customerId === customerId);
}

export function getFinancingRequests(companyId: string): FinancingRequest[] {
  return getStore(companyId).financingRequests;
}

export function getFinancingRequest(companyId: string, requestId: string): FinancingRequest | undefined {
  return getStore(companyId).financingRequests.find((f) => f.id === requestId);
}

export function createFinancingRequest(companyId: string, request: Omit<FinancingRequest, "id" | "createdAt" | "updatedAt">): FinancingRequest {
  const newRequest: FinancingRequest = {
    ...request,
    id: id("fin"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getStore(companyId).financingRequests.push(newRequest);
  return newRequest;
}

export function updateFinancingRequest(companyId: string, requestId: string, updates: Partial<FinancingRequest>): FinancingRequest | undefined {
  const store = getStore(companyId);
  const idx = store.financingRequests.findIndex((f) => f.id === requestId);
  if (idx === -1) return undefined;
  store.financingRequests[idx] = { ...store.financingRequests[idx], ...updates, updatedAt: new Date().toISOString() };
  return store.financingRequests[idx];
}

export function seedScheduleSlotsIfEmpty(companyId: string): void {
  const s = getStore(companyId);
  if (s.scheduleSlots.length === 0) {
    s.scheduleSlots = generateSeedScheduleSlots(companyId);
  }
}

export function getScheduleSlots(
  companyId: string,
  filters?: { fromDate?: string; toDate?: string; includeClosed?: boolean }
): ScheduleSlot[] {
  seedScheduleSlotsIfEmpty(companyId);
  let slots = getStore(companyId).scheduleSlots;
  if (filters?.fromDate) slots = slots.filter((s) => s.slotDate >= filters.fromDate!);
  if (filters?.toDate) slots = slots.filter((s) => s.slotDate <= filters.toDate!);
  if (!filters?.includeClosed) slots = slots.filter((s) => s.status !== "closed");
  return slots;
}

export function getScheduleSlotById(companyId: string, slotId: string): ScheduleSlot | undefined {
  return getStore(companyId).scheduleSlots.find((s) => s.id === slotId);
}

export function upsertScheduleSlot(companyId: string, slot: ScheduleSlot): ScheduleSlot {
  const s = getStore(companyId);
  const idx = s.scheduleSlots.findIndex((x) => x.id === slot.id);
  if (idx === -1) s.scheduleSlots.push(slot);
  else s.scheduleSlots[idx] = slot;
  return slot;
}

export function reserveScheduleSlot(companyId: string, slotId: string): ScheduleSlot {
  const slot = getScheduleSlotById(companyId, slotId);
  if (!slot) throw new Error("Selected schedule slot not found");
  if (slot.status === "full" || slot.status === "closed") {
    throw new Error("Selected schedule slot is no longer available");
  }
  if (slot.currentJobs >= slot.maxJobs) {
    throw new Error("Selected schedule slot is full");
  }
  slot.currentJobs += 1;
  slot.status = computeSlotStatus(slot.currentJobs, slot.maxJobs);
  slot.updatedAt = new Date().toISOString();
  return slot;
}

export const DEMO_CUSTOMER_ID = "cust-m1";

export const DEMO_CUSTOMER_IDS: Record<string, string> = {
  [MORRIS_COMPANY_ID]: DEMO_CUSTOMER_ID,
};

/** Replace in-memory store with data pulled from Supabase (client hydration). */
export function applySupabaseStore(
  _companyId: string,
  remote: Partial<DataStore>
) {
  if (remote.users?.length) store.users = remote.users;
  if (remote.jobs?.length) store.jobs = remote.jobs;
  if (remote.invoices?.length) store.invoices = remote.invoices;
  if (remote.payments?.length) store.payments = remote.payments;
  if (remote.financingRequests?.length) {
    store.financingRequests = remote.financingRequests;
  }
  if (remote.scheduleSlots?.length) store.scheduleSlots = remote.scheduleSlots;
}
