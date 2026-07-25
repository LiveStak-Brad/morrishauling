import { createAdminClient } from "@/lib/supabase/admin";
import { billingId } from "@/lib/billing/utils";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Find existing customer by email/phone, else create (service role). */
export async function findOrCreateGuestCustomer(input: {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}): Promise<{ customerId: string; created: boolean }> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");

  const email = normalizeEmail(input.email);
  const phoneDigits = normalizePhone(input.phone);

  if (email) {
    const { data: byEmail } = await sb
      .from("customers")
      .select("id, email, phone, archived_at, merged_into_customer_id")
      .eq("company_id", input.companyId)
      .ilike("email", email)
      .is("archived_at", null)
      .is("merged_into_customer_id", null)
      .limit(5);
    const match = (byEmail ?? []).find(
      (c) => normalizeEmail(String(c.email ?? "")) === email
    );
    if (match) return { customerId: match.id as string, created: false };
  }

  if (phoneDigits.length >= 10) {
    const { data: byPhone } = await sb
      .from("customers")
      .select("id, phone, archived_at, merged_into_customer_id")
      .eq("company_id", input.companyId)
      .is("archived_at", null)
      .is("merged_into_customer_id", null)
      .limit(50);
    const match = (byPhone ?? []).find((c) => {
      const digits = normalizePhone(String(c.phone ?? ""));
      return digits.length >= 10 && digits.slice(-10) === phoneDigits.slice(-10);
    });
    if (match) return { customerId: match.id as string, created: false };
  }

  const customerId = billingId("cust");
  const { error } = await sb.from("customers").insert({
    id: customerId,
    company_id: input.companyId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email,
    phone: input.phone.trim(),
    notes: input.notes ?? "Created via public request",
  });
  if (error) throw error;
  return { customerId, created: true };
}
