import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDbReady } from "@/lib/db/operations";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { morrisConfig } from "@/lib/morris-config";
import { rowToDisposalFacility } from "@/lib/disposal/disposal-recommendation";
import { calculateActualProfit } from "@/lib/disposal/calculate-actual-profit";
import { getJobById } from "@/lib/db/operations";
import type { DisposalFacility } from "@/types/disposal-management";
import { buildListMetaFromCounts } from "@/lib/api/admin-data-meta";
import { createSignedStorageUrl } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";

async function sbRead() {
  return createClient();
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

function demoFacilities(): DisposalFacility[] {
  if (!isDemoDataEnabled()) return [];
  return morrisConfig.dumpSites.map((d) =>
    rowToDisposalFacility({
      id: d.id,
      company_id: morrisConfig.companyId,
      name: d.name,
      address: d.address,
      city: d.city,
      state: d.state,
      latitude: d.location.lat,
      longitude: d.location.lng,
      accepted_materials: d.acceptedMaterials ?? ["mixed_junk"],
      fee_type: d.feeType ?? "flat",
      base_fee: d.baseFee ?? 45,
      per_ton_fee: d.perTonFee,
      minimum_fee: d.minimumFee ?? 40,
      status: d.status ?? "active",
      is_closed: false,
      access_type: "both",
      hours_json: {},
    })
  );
}

export async function getDisposalFacilities(companyId: string): Promise<DisposalFacility[]> {
  if (!(await isDbReady())) return demoFacilities();
  const { data, error } = await (await sbRead())
    .from("dump_sites")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  if (!data?.length) return isDemoDataEnabled() ? demoFacilities() : [];
  return data.map((r) => rowToDisposalFacility(r));
}

export async function getDisposalFacilitiesWithMeta(companyId: string) {
  const facilities = await getDisposalFacilities(companyId);
  const active = facilities.filter((f) => f.status === "active");
  return {
    facilities: active,
    meta: await buildListMetaFromCounts(facilities.length, active.length),
  };
}

export async function getDisposalFacilityById(companyId: string, id: string) {
  const all = await getDisposalFacilities(companyId);
  return all.find((f) => f.id === id);
}

export async function createDisposalFacility(
  companyId: string,
  input: Partial<DisposalFacility> & { name: string; address: string }
): Promise<DisposalFacility> {
  const id = input.id ?? `fac-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const row = {
    id,
    company_id: companyId,
    name: input.name,
    address: input.address,
    city: input.city ?? null,
    state: input.state ?? "MO",
    zip: input.zip ?? null,
    county: input.county ?? null,
    latitude: input.location?.lat ?? null,
    longitude: input.location?.lng ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    access_type: input.accessType ?? "both",
    accepted_materials: input.acceptedMaterials ?? ["mixed_junk"],
    rejected_materials: input.rejectedMaterials ?? [],
    fee_type: input.feeType ?? "flat",
    base_fee: input.baseFee ?? 45,
    per_ton_fee: input.perTonFee ?? null,
    minimum_fee: input.minimumFee ?? 40,
    hours_json: input.hoursJson ?? {},
    holiday_closures: input.holidayClosures ?? [],
    notes: input.notes ?? null,
    internal_notes: input.internalNotes ?? null,
    status: input.status ?? "active",
    is_closed: input.isClosed ?? false,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await (await sbWrite()).from("dump_sites").insert(row).select("*").single();
  if (error) throw error;
  return rowToDisposalFacility(data);
}

export async function updateDisposalFacility(
  companyId: string,
  id: string,
  updates: Partial<DisposalFacility>
) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name != null) row.name = updates.name;
  if (updates.address != null) row.address = updates.address;
  if (updates.city != null) row.city = updates.city;
  if (updates.state != null) row.state = updates.state;
  if (updates.zip != null) row.zip = updates.zip;
  if (updates.county != null) row.county = updates.county;
  if (updates.phone != null) row.phone = updates.phone;
  if (updates.website != null) row.website = updates.website;
  if (updates.accessType != null) row.access_type = updates.accessType;
  if (updates.acceptedMaterials != null) row.accepted_materials = updates.acceptedMaterials;
  if (updates.rejectedMaterials != null) row.rejected_materials = updates.rejectedMaterials;
  if (updates.maxLoadSize != null) row.max_load_size = updates.maxLoadSize;
  if (updates.trailerRestrictions != null) row.trailer_restrictions = updates.trailerRestrictions;
  if (updates.truckRestrictions != null) row.truck_restrictions = updates.truckRestrictions;
  if (updates.weightLimitTons != null) row.weight_limit_tons = updates.weightLimitTons;
  if (updates.baseFee != null) row.base_fee = updates.baseFee;
  if (updates.perTonFee != null) row.per_ton_fee = updates.perTonFee;
  if (updates.minimumFee != null) row.minimum_fee = updates.minimumFee;
  if (updates.feeType != null) row.fee_type = updates.feeType;
  if (updates.specialFees != null) row.special_fees = updates.specialFees;
  if (updates.notes != null) row.notes = updates.notes;
  if (updates.status != null) row.status = updates.status;
  if (updates.isClosed != null) row.is_closed = updates.isClosed;
  if (updates.closureReason != null) row.closure_reason = updates.closureReason;
  if (updates.hoursJson != null) row.hours_json = updates.hoursJson;
  if (updates.holidayClosures != null) row.holiday_closures = updates.holidayClosures;
  if (updates.isPreferredVendor != null) row.is_preferred_vendor = updates.isPreferredVendor;
  if (updates.isFavorite != null) row.is_favorite = updates.isFavorite;
  if (updates.isAvoidVendor != null) row.is_avoid_vendor = updates.isAvoidVendor;
  if (updates.vendorRating != null) row.vendor_rating = updates.vendorRating;
  if (updates.internalNotes != null) row.internal_notes = updates.internalNotes;
  if (updates.avgWaitMinutes != null) row.avg_wait_minutes = updates.avgWaitMinutes;
  if (updates.avgUnloadMinutes != null) row.avg_unload_minutes = updates.avgUnloadMinutes;
  if (updates.location != null) {
    row.latitude = updates.location.lat;
    row.longitude = updates.location.lng;
  }

  const { data, error } = await (await sbWrite())
    .from("dump_sites")
    .update(row)
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToDisposalFacility(data);
}

export async function recordJobDisposal(
  companyId: string,
  jobId: string,
  input: {
    actualSiteId: string;
    actualSiteName?: string;
    actualCost: number;
    actualWeightTons?: number;
    receiptUrl?: string;
    weightTicketUrl?: string;
    notes?: string;
    overrideReason?: string;
    recommendedSiteId?: string;
    estimatedCost?: number;
    driveMiles?: number;
    driveMinutes?: number;
    fuelCost?: number;
    waitMinutes?: number;
    unloadMinutes?: number;
    laborCost?: number;
    truckOperatingCost?: number;
    markJobCompleted?: boolean;
    noDisposalCostReason?: string;
    actorProfileId?: string;
  }
) {
  if (
    input.recommendedSiteId &&
    input.recommendedSiteId !== input.actualSiteId &&
    !input.overrideReason?.trim()
  ) {
    throw new Error("Override reason required when not using the recommended facility");
  }

  if (input.actualCost === 0 && !input.noDisposalCostReason?.trim()) {
    throw new Error("No-cost disposal reason required when actual cost is $0");
  }

  const job = await getJobById(companyId, jobId);
  const profit = job
    ? calculateActualProfit(job, {
        actualDisposalCost: input.actualCost,
        actualFuelCost: input.fuelCost,
        waitMinutes: input.waitMinutes,
        unloadMinutes: input.unloadMinutes,
      })
    : null;

  const eventId = `disp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const detailUpdate: Record<string, unknown> = {
    actual_disposal_site_id: input.actualSiteId,
    actual_disposal_site_name: input.actualSiteName,
    actual_disposal_cost: input.actualCost,
    actual_disposal_weight_tons: input.actualWeightTons ?? null,
    disposal_receipt_url: input.receiptUrl ?? null,
    disposal_weight_ticket_url: input.weightTicketUrl ?? null,
    disposal_notes: input.notes ?? null,
    disposal_override_reason: input.overrideReason ?? null,
    disposal_completed_at: now,
    recommended_disposal_site_id: input.recommendedSiteId ?? null,
    estimated_disposal_cost: input.estimatedCost ?? null,
    actual_disposal_wait_minutes: input.waitMinutes ?? null,
    actual_disposal_unload_minutes: input.unloadMinutes ?? null,
    actual_fuel_cost: input.fuelCost ?? null,
    actual_gross_profit: profit?.grossProfit ?? null,
    actual_profit_margin: profit?.profitMargin ?? null,
    no_disposal_cost_reason: input.noDisposalCostReason ?? null,
    disposal_review_status: "pending",
    updated_at: now,
  };

  const { error: detailError } = await (await sbWrite())
    .from("junk_removal_details")
    .update(detailUpdate)
    .eq("job_id", jobId);

  if (detailError) throw detailError;

  const { error: eventError } = await (await sbWrite()).from("disposal_events").insert({
    id: eventId,
    company_id: companyId,
    job_id: jobId,
    dump_site_id: input.actualSiteId,
    dump_site_name: input.actualSiteName,
    estimated_cost: input.estimatedCost,
    actual_cost: input.actualCost,
    weight_tons: input.actualWeightTons,
    drive_miles: input.driveMiles,
    drive_minutes: input.driveMinutes,
    fuel_cost: input.fuelCost,
    wait_minutes: input.waitMinutes,
    unload_minutes: input.unloadMinutes,
    truck_operating_cost: input.truckOperatingCost,
    labor_cost: input.laborCost,
    receipt_url: input.receiptUrl,
    weight_ticket_url: input.weightTicketUrl,
    was_recommended: input.recommendedSiteId === input.actualSiteId,
    override_reason: input.overrideReason,
    completed_at: now,
  });

  if (eventError) throw eventError;

  if (input.markJobCompleted) {
    await (await sbWrite())
      .from("jobs")
      .update({ status: "completed", updated_at: now })
      .eq("company_id", companyId)
      .eq("id", jobId);
  }

  const { logActivity } = await import("@/lib/db/activity");
  await logActivity({
    companyId,
    actorProfileId: input.actorProfileId,
    entityType: "job",
    entityId: jobId,
    action: "disposal_completed",
    message: `Disposal recorded at ${input.actualSiteName ?? input.actualSiteId} — $${input.actualCost}`,
  });

  return { eventId, completedAt: now, profit };
}

export async function getJobDisposalState(companyId: string, jobId: string) {
  const job = await getJobById(companyId, jobId);
  if (!job?.junkRemovalDetails) return null;

  const jrd = job.junkRemovalDetails;
  const signPath = async (path?: string) => {
    if (!path || path.startsWith("http")) return path;
    try {
      return await createSignedStorageUrl(STORAGE_BUCKETS.disposalReceipts, path);
    } catch {
      return undefined;
    }
  };

  return {
    jobId,
    recommendedSiteId: jrd.recommendedDisposalSiteId,
    actualSiteId: jrd.actualDisposalSiteId,
    actualSiteName: jrd.actualDisposalSiteName,
    estimatedDisposalCost: jrd.estimatedDisposalCost,
    actualDisposalCost: jrd.actualDisposalCost,
    actualWeightTons: jrd.actualDisposalWeightTons,
    waitMinutes: jrd.actualDisposalWaitMinutes,
    unloadMinutes: jrd.actualDisposalUnloadMinutes,
    fuelCost: jrd.actualFuelCost,
    notes: jrd.disposalNotes,
    overrideReason: jrd.disposalOverrideReason,
    completedAt: jrd.disposalCompletedAt,
    receiptSignedUrl: await signPath(jrd.disposalReceiptUrl),
    weightTicketSignedUrl: await signPath(jrd.disposalWeightTicketUrl),
    actualGrossProfit: jrd.actualGrossProfit,
    actualProfitMargin: jrd.actualProfitMargin,
    quotedDumpCost: jrd.dumpFeeEstimate,
  };
}

export async function getDisposalReportingSummary(companyId: string) {
  if (!(await isDbReady())) {
    return { totalEvents: 0, totalSpent: 0, sitesUsed: 0, avgCost: 0, savingsEstimate: 0 };
  }
  const { data, error } = await (await sbRead())
    .from("disposal_events")
    .select("actual_cost, estimated_cost, dump_site_id, dump_site_name")
    .eq("company_id", companyId);
  if (error) throw error;
  const rows = data ?? [];
  const totalSpent = rows.reduce((s, r) => s + Number(r.actual_cost ?? 0), 0);
  const savings = rows.reduce((s, r) => {
    const est = Number(r.estimated_cost ?? 0);
    const act = Number(r.actual_cost ?? 0);
    return est > act ? s + (est - act) : s;
  }, 0);
  const sites = new Set(rows.map((r) => r.dump_site_id).filter(Boolean));
  return {
    totalEvents: rows.length,
    totalSpent,
    sitesUsed: sites.size,
    avgCost: rows.length ? Math.round(totalSpent / rows.length) : 0,
    savingsEstimate: Math.round(savings),
  };
}
