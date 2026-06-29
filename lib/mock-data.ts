import type {
  Customer,
  Employee,
  FinancingRequest,
  Invoice,
  Job,
  Payment,
  User,
} from "@/types";
import { MORRIS_COMPANY, GREENBIN_COMPANY } from "./mock-company";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const now = new Date().toISOString();
const today = new Date().toISOString().split("T")[0];

// --- Users ---

const morrisCustomer: Customer = {
  id: "cust-m1",
  companyId: MORRIS_COMPANY.companyId,
  email: "alex.customer@email.com",
  name: "Alex Johnson",
  role: "customer",
  phone: "(636) 555-8800",
  address: "142 Main St, St. Charles, MO 63301",
};

const greenbinCustomer: Customer = {
  id: "cust-g1",
  companyId: GREENBIN_COMPANY.companyId,
  email: "sam.customer@email.com",
  name: "Sam Rivera",
  role: "customer",
  phone: "(704) 555-7700",
};

const morrisEmployees: Employee[] = [
  { id: "user-m-admin", companyId: MORRIS_COMPANY.companyId, email: "admin@morrisjunk.com", name: "James Morris", role: "admin", employeeId: "emp-m1" },
  { id: "user-m-planner", companyId: MORRIS_COMPANY.companyId, email: "dispatch@morrisjunk.com", name: "Dana Chen", role: "planner", employeeId: "emp-m4" },
  { id: "user-m-emp", companyId: MORRIS_COMPANY.companyId, email: "marcus@morrisjunk.com", name: "Marcus Webb", role: "employee", employeeId: "emp-m2" },
];

const greenbinEmployees: Employee[] = [
  { id: "user-g-admin", companyId: GREENBIN_COMPANY.companyId, email: "admin@greenbinjunk.com", name: "Sarah Green", role: "admin", employeeId: "emp-g1" },
];

// --- Jobs ---

const morrisJobs: Job[] = [
  {
    id: "job-m1",
    companyId: MORRIS_COMPANY.companyId,
    customerId: morrisCustomer.id,
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
    companyId: MORRIS_COMPANY.companyId,
    customerId: morrisCustomer.id,
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
    companyId: MORRIS_COMPANY.companyId,
    customerId: morrisCustomer.id,
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
    companyId: MORRIS_COMPANY.companyId,
    customerId: morrisCustomer.id,
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
];

const greenbinJobs: Job[] = [
  {
    id: "job-g1",
    companyId: GREENBIN_COMPANY.companyId,
    customerId: greenbinCustomer.id,
    status: "scheduled",
    junkType: "residential",
    items: [{ id: "item-g1", name: "Garage clutter", quantity: 1 }],
    loadSizeTier: "half_50",
    accessDetails: { stairs: false, elevator: false, longCarryFt: 20, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
    address: { street: "300 South Blvd", city: "Charlotte", state: "NC", zip: "28203", location: { lat: 35.22, lng: -80.85 } },
    photos: [],
    estimate: { id: "est-g1", jobId: "job-g1", subtotal: 401, modifiers: [], total: 401, trailerPercent: 50, disclaimerAccepted: true, createdAt: now },
    warnings: [],
    scheduledDate: today,
    routeOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
];

// --- Invoices & Payments ---

const morrisInvoices: Invoice[] = [
  {
    id: "inv-m1",
    invoiceNumber: "MH-2026-0142",
    companyId: MORRIS_COMPANY.companyId,
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
    companyId: MORRIS_COMPANY.companyId,
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
    companyId: MORRIS_COMPANY.companyId,
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
    companyId: MORRIS_COMPANY.companyId,
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
    companyId: MORRIS_COMPANY.companyId,
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
    companyId: MORRIS_COMPANY.companyId,
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
};

const stores: Record<string, DataStore> = {
  [MORRIS_COMPANY.companyId]: {
    users: [morrisCustomer, ...morrisEmployees],
    jobs: [...morrisJobs],
    invoices: [...morrisInvoices],
    payments: [...morrisPayments],
    financingRequests: [...morrisFinancing],
  },
  [GREENBIN_COMPANY.companyId]: {
    users: [greenbinCustomer, ...greenbinEmployees],
    jobs: [...greenbinJobs],
    invoices: [],
    payments: [],
    financingRequests: [],
  },
};

function getStore(companyId: string): DataStore {
  const store = stores[companyId];
  if (!store) throw new Error(`No data store for company: ${companyId}`);
  return store;
}

export function getUsers(companyId: string): User[] {
  return getStore(companyId).users;
}

export function getCustomers(companyId: string): Customer[] {
  return getStore(companyId).users.filter((u): u is Customer => u.role === "customer");
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
  for (const store of Object.values(stores)) {
    const job = store.jobs.find((j) => j.id === jobId);
    if (job) return job;
  }
  return undefined;
}

export function getJobByCompany(companyId: string, jobId: string): Job | undefined {
  return getStore(companyId).jobs.find((j) => j.id === jobId);
}

export function createJob(companyId: string, job: Omit<Job, "id" | "createdAt" | "updatedAt">): Job {
  const newJob: Job = {
    ...job,
    id: id("job"),
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

export const DEMO_CUSTOMER_IDS: Record<string, string> = {
  [MORRIS_COMPANY.companyId]: morrisCustomer.id,
  [GREENBIN_COMPANY.companyId]: greenbinCustomer.id,
};

/** Replace in-memory store with data pulled from Supabase (client hydration). */
export function applySupabaseStore(
  companyId: string,
  remote: Partial<DataStore>
) {
  const store = stores[companyId];
  if (!store) return;
  if (remote.users?.length) store.users = remote.users;
  if (remote.jobs?.length) store.jobs = remote.jobs;
  if (remote.invoices?.length) store.invoices = remote.invoices;
  if (remote.payments?.length) store.payments = remote.payments;
  if (remote.financingRequests?.length) {
    store.financingRequests = remote.financingRequests;
  }
}
