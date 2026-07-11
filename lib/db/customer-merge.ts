import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/db/activity";
import { isDbReady } from "@/lib/db/operations";
import { rowToCustomerUser } from "@/lib/db/mappers";
import type { Customer } from "@/types/user";

export type CustomerMergeField =
  | "name"
  | "email"
  | "phone"
  | "billingAddress"
  | "notes";

export type CustomerMergeChoices = {
  name: "primary" | "secondary";
  email: "primary" | "secondary";
  phone: "primary" | "secondary";
  billingAddress: "primary" | "secondary";
  notes: "primary" | "secondary" | "combine";
  /** Keep service addresses from both (always move jobs/estimates). */
  keepSecondaryServiceAddresses: boolean;
};

export type CustomerMergePreview = {
  primary: Customer & {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
    raw?: Record<string, unknown>;
  };
  secondary: Customer & {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
    raw?: Record<string, unknown>;
  };
  counts: {
    estimates: number;
    jobs: number;
    invoices: number;
    payments: number;
    photos: number;
    interactions: number;
    activity: number;
  };
};

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

async function loadCustomerRow(companyId: string, customerId: string) {
  const client = await sbWrite();
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

function toPreviewCustomer(row: Record<string, unknown>) {
  const base = rowToCustomerUser(row);
  return {
    ...base,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    address: (row.address as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    zip: (row.zip as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    raw: row,
  };
}

export async function previewCustomerMerge(
  companyId: string,
  primaryId: string,
  secondaryId: string
): Promise<CustomerMergePreview> {
  if (!(await isDbReady())) throw new Error("Database not available");
  if (primaryId === secondaryId) throw new Error("Cannot merge a customer into itself");

  const [primaryRow, secondaryRow] = await Promise.all([
    loadCustomerRow(companyId, primaryId),
    loadCustomerRow(companyId, secondaryId),
  ]);
  if (!primaryRow) throw new Error("Primary customer not found");
  if (!secondaryRow) throw new Error("Secondary customer not found");
  if (primaryRow.merged_into_customer_id || primaryRow.archived_at) {
    throw new Error("Primary customer is already merged or archived");
  }
  if (secondaryRow.merged_into_customer_id || secondaryRow.archived_at) {
    throw new Error("Secondary customer is already merged or archived");
  }

  const client = await sbWrite();
  const count = async (table: string, column = "customer_id") => {
    const { count: c, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq(column, secondaryId);
    if (error) return 0;
    return c ?? 0;
  };

  const jobIdsRes = await client
    .from("jobs")
    .select("id")
    .eq("company_id", companyId)
    .eq("customer_id", secondaryId);
  const jobIds = (jobIdsRes.data ?? []).map((j) => j.id as string);
  let photos = 0;
  if (jobIds.length) {
    const { count: pc } = await client
      .from("job_photos")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("job_id", jobIds);
    photos = pc ?? 0;
  }

  const [estimates, jobs, invoices, payments, interactions] = await Promise.all([
    count("estimates"),
    count("jobs"),
    count("invoices"),
    count("payments"),
    count("customer_interactions"),
  ]);

  const { count: activityCount } = await client
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("entity_type", "customer")
    .eq("entity_id", secondaryId);

  return {
    primary: toPreviewCustomer(primaryRow),
    secondary: toPreviewCustomer(secondaryRow),
    counts: {
      estimates,
      jobs,
      invoices,
      payments,
      photos,
      interactions,
      activity: activityCount ?? 0,
    },
  };
}

export async function mergeCustomers(
  companyId: string,
  primaryId: string,
  secondaryId: string,
  choices: CustomerMergeChoices,
  options: { actorProfileId?: string; confirm: boolean }
): Promise<{ primaryId: string; archivedSecondaryId: string }> {
  if (!options.confirm) throw new Error("Merge confirmation required");
  if (!(await isDbReady())) throw new Error("Database not available");

  const preview = await previewCustomerMerge(companyId, primaryId, secondaryId);
  const p = preview.primary.raw!;
  const s = preview.secondary.raw!;
  const client = await sbWrite();
  const now = new Date().toISOString();

  const pick = <T,>(field: CustomerMergeField, primaryVal: T, secondaryVal: T): T => {
    if (field === "notes" && choices.notes === "combine") {
      const a = String(primaryVal ?? "").trim();
      const b = String(secondaryVal ?? "").trim();
      if (!a) return secondaryVal;
      if (!b) return primaryVal;
      return `${a}\n\n--- merged from ${secondaryId} ---\n${b}` as T;
    }
    const side = choices[field === "billingAddress" ? "billingAddress" : field];
    return side === "secondary" ? secondaryVal : primaryVal;
  };

  const nameSide = choices.name;
  const firstName =
    nameSide === "secondary" ? (s.first_name as string) : (p.first_name as string);
  const lastName =
    nameSide === "secondary" ? (s.last_name as string) : (p.last_name as string);

  const patch = {
    first_name: firstName,
    last_name: lastName,
    email: pick("email", p.email, s.email),
    phone: pick("phone", p.phone, s.phone),
    address: pick("billingAddress", p.address, s.address),
    city: pick("billingAddress", p.city, s.city),
    state: pick("billingAddress", p.state, s.state),
    zip: pick("billingAddress", p.zip, s.zip),
    notes: pick("notes", p.notes, s.notes),
    updated_at: now,
  };

  // Move related records — do not duplicate financials.
  const tables = [
    "estimates",
    "jobs",
    "invoices",
    "payments",
    "customer_interactions",
    "financing_requests",
  ] as const;

  for (const table of tables) {
    const { error } = await client
      .from(table)
      .update({ customer_id: primaryId, updated_at: now })
      .eq("company_id", companyId)
      .eq("customer_id", secondaryId);
    // financing_requests / some tables may lack updated_at — retry without it
    if (error) {
      const retry = await client
        .from(table)
        .update({ customer_id: primaryId })
        .eq("company_id", companyId)
        .eq("customer_id", secondaryId);
      if (retry.error && table !== "financing_requests") {
        throw new Error(`Failed to move ${table}: ${retry.error.message}`);
      }
    }
  }

  // Profiles linked to secondary customer
  await client
    .from("profiles")
    .update({ customer_id: primaryId, updated_at: now })
    .eq("company_id", companyId)
    .eq("customer_id", secondaryId);

  // Preserve secondary activity history by appending a merge pointer (do not delete).
  await client
    .from("activity_log")
    .insert({
      id: `act-merge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      company_id: companyId,
      actor_profile_id: options.actorProfileId ?? null,
      entity_type: "customer",
      entity_id: primaryId,
      action: "customer_merged",
      message: `Merged customer ${secondaryId} into ${primaryId}`,
      metadata: {
        secondaryId,
        choices,
        counts: preview.counts,
        keepSecondaryServiceAddresses: choices.keepSecondaryServiceAddresses,
      },
      created_at: now,
    });

  // Also stamp secondary entity history
  await client.from("activity_log").insert({
    id: `act-merge-src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    company_id: companyId,
    actor_profile_id: options.actorProfileId ?? null,
    entity_type: "customer",
    entity_id: secondaryId,
    action: "customer_merged_away",
    message: `This customer was merged into ${primaryId}`,
    metadata: { primaryId, choices },
    created_at: now,
  });

  const { error: primaryErr } = await client
    .from("customers")
    .update(patch)
    .eq("id", primaryId)
    .eq("company_id", companyId);
  if (primaryErr) throw new Error(primaryErr.message);

  const { error: archiveErr } = await client
    .from("customers")
    .update({
      merged_into_customer_id: primaryId,
      archived_at: now,
      merge_metadata: { choices, mergedAt: now, counts: preview.counts },
      email: s.email
        ? `merged+${secondaryId}@archived.local`
        : s.email,
      updated_at: now,
    })
    .eq("id", secondaryId)
    .eq("company_id", companyId);
  if (archiveErr) throw new Error(archiveErr.message);

  await logActivity({
    companyId,
    actorProfileId: options.actorProfileId,
    entityType: "customer",
    entityId: primaryId,
    action: "customer_merged",
    message: `Merged duplicate customer ${secondaryId} into ${primaryId}`,
    metadata: { secondaryId, choices, counts: preview.counts },
  });

  return { primaryId, archivedSecondaryId: secondaryId };
}
