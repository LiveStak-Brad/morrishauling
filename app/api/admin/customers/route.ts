import { morrisConfig } from "@/lib/morris-config";
import { createAdminCustomer } from "@/lib/db/operations";
import { fetchCustomersUnfiltered } from "@/lib/db/admin-unfiltered";
import { filterCustomers } from "@/lib/data/real-record-filter";
import { buildListMetaFromCounts } from "@/lib/api/admin-data-meta";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const all = await fetchCustomersUnfiltered(morrisConfig.companyId);
    const customers = filterCustomers(all);
    const meta = await buildListMetaFromCounts(all.length, customers.length);
    return apiOk({ customers, meta });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load customers", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    }>(request);
    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return apiError("First and last name required", 400);
    }
    const customer = await createAdminCustomer(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk({ customer });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create customer", 500);
  }
}
