import { format, parseISO } from "date-fns";
import type { Customer } from "@/types/user";
import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import type { CustomerInteraction } from "@/types/operations-depth";
import type { CustomerCrmProfile } from "@/types/operations-command-center";
import { isDemoDataEnabled } from "@/lib/is-demo-data";

const CRM_ENRICHMENT: Record<
  string,
  Partial<CustomerCrmProfile> & { notes: string[]; tags: string[] }
> = {
  "cust-m1": {
    lastReviewStars: 5,
    preferredCrew: "Marcus Webb",
    callCount: 12,
    textCount: 21,
    invoiceStatus: "Mostly paid — 1 balance due",
    financingStatus: "Used once (estate cleanout)",
    notes: ["Has dogs in backyard", "Gate code: 4521", "Prefers afternoon windows", "Usually pays deposit by card"],
    tags: ["repeat", "estate", "financing"],
  },
  "cust-m2": {
    lastReviewStars: null,
    preferredCrew: null,
    callCount: 3,
    textCount: 5,
    invoiceStatus: "New customer",
    financingStatus: "Never used",
    notes: ["First-time customer — garage cleanout"],
    tags: ["new"],
  },
  "cust-m3": {
    lastReviewStars: 4,
    preferredCrew: "Tyler Brooks",
    callCount: 6,
    textCount: 8,
    invoiceStatus: "Paid in full",
    financingStatus: "Never used",
    notes: ["Farm property — long driveway", "Prefers email"],
    tags: ["rural"],
  },
};

export function buildCustomerCrmProfiles(
  customers: Customer[],
  jobs: Job[],
  payments: Payment[],
  invoices: Invoice[],
  financing: FinancingRequest[],
  interactions: CustomerInteraction[] = []
): CustomerCrmProfile[] {
  const demo = isDemoDataEnabled();

  return customers.map((c) => {
    const customerJobs = jobs.filter((j) => j.customerId === c.id);
    const customerJobIds = new Set(customerJobs.map((j) => j.id));
    const completedPayments = payments.filter(
      (p) => customerJobIds.has(p.jobId) && p.status === "completed"
    );
    const totalSpent = completedPayments.reduce((s, p) => s + p.amount, 0);
    const avgTicket = completedPayments.length ? Math.round(totalSpent / completedPayments.length) : 0;
    const firstJob = customerJobs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    const customerSince = firstJob ? format(parseISO(firstJob.createdAt), "yyyy") : format(new Date(), "yyyy");
    const custInteractions = interactions.filter((i) => i.customerId === c.id);
    const calls = custInteractions.filter((i) => i.interactionType === "call").length;
    const texts = custInteractions.filter((i) => i.interactionType === "text").length;
    const fin = financing.filter((f) => f.customerId === c.id);
    const openInv = invoices.filter((i) => i.customerId === c.id && i.balanceDue > 0);

    const enrich = demo ? CRM_ENRICHMENT[c.id] : undefined;

    return {
      customerId: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      customerSince,
      totalJobs: customerJobs.length,
      totalSpent: totalSpent > 0 ? totalSpent : demo && enrich && c.id === "cust-m1" ? 4183 : totalSpent,
      averageTicket: avgTicket > 0 ? avgTicket : demo && enrich && c.id === "cust-m1" ? 597 : avgTicket,
      lastReviewStars: enrich?.lastReviewStars ?? null,
      preferredCrew: enrich?.preferredCrew ?? null,
      callCount: calls || (demo ? enrich?.callCount : 0) || 0,
      textCount: texts || (demo ? enrich?.textCount : 0) || 0,
      invoiceStatus:
        openInv.length > 0
          ? `${openInv.length} open — $${openInv.reduce((s, i) => s + i.balanceDue, 0)} due`
          : enrich?.invoiceStatus ?? (openInv.length === 0 && customerJobs.length > 0 ? "Paid" : "No invoices yet"),
      financingStatus:
        fin.length > 0
          ? fin.some((f) => f.status === "pending")
            ? "Pending request"
            : "Used before"
          : enrich?.financingStatus ?? "Never used",
      notes: enrich?.notes ?? (c.callbackNotes ? [c.callbackNotes] : []),
      tags: enrich?.tags ?? [],
    };
  });
}
