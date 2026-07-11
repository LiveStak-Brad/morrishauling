import type {
  FinancingRequest,
  Invoice,
  Job,
  Payment,
} from "@/types";
import type { Customer, Employee } from "@/types/user";
import type { LoadSizeTier, JobStatus } from "@/types/job";

const TIER_FROM_PERCENT: Record<number, LoadSizeTier> = {
  10: "min_10",
  25: "quarter_25",
  50: "half_50",
  75: "three_quarter_75",
  100: "full_100",
  150: "multi_150",
};

export function percentToTier(pct?: number | null): LoadSizeTier {
  if (pct == null) return "quarter_25";
  return TIER_FROM_PERCENT[pct] ?? "quarter_25";
}

export function rowToJob(row: Record<string, unknown>, hauling?: Record<string, unknown> | null, junk?: Record<string, unknown> | null): Job {
  const payload = (row.payload as Partial<Job>) ?? {};
  const loadPct = Number(row.load_percentage ?? payload.estimate?.trailerPercent ?? 25);
  const serviceTypeRaw = (row.service_type as string) ?? payload.serviceType ?? "junk_removal";
  const serviceType =
    serviceTypeRaw === "hauling_transport" ? "hauling_transport" : "junk_removal";
  const divisionId =
    (row.division_id as "junk_removal" | "hauling" | undefined) ??
    payload.divisionId ??
    (serviceType === "hauling_transport" ? "hauling" : "junk_removal");

  const job: Job = {
    ...payload,
    id: row.id as string,
    companyId: row.company_id as string,
    customerId: row.customer_id as string,
    divisionId,
    serviceType,
    status: (row.status ?? payload.status ?? "submitted") as JobStatus,
    junkType: (row.junk_type ?? payload.junkType ?? "general") as string,
    items: (row.item_list as Job["items"]) ?? payload.items ?? [],
    loadSizeTier: payload.loadSizeTier ?? percentToTier(loadPct),
    accessDetails: (row.access_details as Job["accessDetails"]) ?? payload.accessDetails ?? {
      stairs: false,
      elevator: false,
      longCarryFt: 0,
      basement: false,
      attic: false,
      tightAccess: false,
      heavyItems: false,
      specialDisposal: false,
    },
    address: {
      street: (row.address as string) ?? payload.address?.street ?? "",
      city: (row.city as string) ?? payload.address?.city ?? "",
      state: (row.state as string) ?? payload.address?.state ?? "MO",
      zip: (row.zip as string) ?? payload.address?.zip ?? "",
      location:
        row.latitude != null && row.longitude != null
          ? { lat: Number(row.latitude), lng: Number(row.longitude) }
          : payload.address?.location,
      line2: (row.address_line2 as string) ?? payload.address?.line2,
      placeId: (row.address_place_id as string) ?? payload.address?.placeId,
      formattedAddress:
        (row.address_formatted as string) ?? payload.address?.formattedAddress,
      country: (row.address_country as string) ?? payload.address?.country ?? "US",
      verificationStatus:
        (row.address_verification_status as Job["address"]["verificationStatus"]) ??
        (row.address_verified
          ? "verified"
          : payload.address?.verificationStatus),
      provider: payload.address?.provider,
      verifiedAt: payload.address?.verifiedAt,
    },
    photos: payload.photos ?? [],
    estimate: payload.estimate,
    estimateType: (row.estimate_type as Job["estimateType"]) ?? payload.estimateType,
    pricingBreakdown: (row.pricing_breakdown as Job["pricingBreakdown"]) ?? payload.pricingBreakdown,
    disclaimerAccepted: Boolean(row.disclaimer_accepted ?? payload.disclaimerAccepted),
    haulingDetails: hauling ? rowToHaulingDetails(hauling) : payload.haulingDetails,
    junkRemovalDetails: junk ? rowToJunkRemovalDetails(junk) : payload.junkRemovalDetails,
    reviewStatus:
      (payload.reviewStatus as Job["reviewStatus"]) ??
      payload.junkRemovalDetails?.reviewStatus,
    warnings: payload.warnings ?? [],
    scheduledDate: (row.scheduled_date as string) ?? payload.scheduledDate,
    selectedScheduleSlotId:
      (row.selected_schedule_slot_id as string) ?? payload.selectedScheduleSlotId,
    scheduledWindowLabel:
      (row.scheduled_window_label as string) ?? payload.scheduledWindowLabel,
    flexibleDiscountAmount:
      row.flexible_discount_amount != null
        ? Number(row.flexible_discount_amount)
        : payload.flexibleDiscountAmount,
    routeOrder: payload.routeOrder,
    assignedTruckId: payload.assignedTruckId,
    assignedTrailerId: payload.assignedTrailerId,
    assignedEmployeeIds: payload.assignedEmployeeIds,
    customerNotes: (row.customer_notes as string) ?? payload.customerNotes,
    finalLoadSizeTier: payload.finalLoadSizeTier,
    extraFees: payload.extraFees,
    priceAdjustmentNotes: payload.priceAdjustmentNotes,
    paymentCollected: payload.paymentCollected,
    fieldPaymentMethod: payload.fieldPaymentMethod,
    finalPriceAdjustment: payload.finalPriceAdjustment,
    finalPriceAdjustmentReason: payload.finalPriceAdjustmentReason,
    customerApprovalCaptured: payload.customerApprovalCaptured,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
  return job;
}

export function rowToHaulingDetails(row: Record<string, unknown>): import("@/types/hauling").HaulingDetails {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    pickup: {
      address: row.pickup_address as string,
      city: row.pickup_city as string,
      state: row.pickup_state as string,
      zip: row.pickup_zip as string,
      accessNotes: (row.pickup_access_notes as string) ?? undefined,
      loadingDock: Boolean(row.loading_dock_pickup),
      forkliftAvailable: Boolean(row.forklift_available_pickup),
      assistanceAvailable: Boolean(row.assistance_available_pickup),
      location:
        row.pickup_latitude != null && row.pickup_longitude != null
          ? { lat: Number(row.pickup_latitude), lng: Number(row.pickup_longitude) }
          : undefined,
      line2: (row.pickup_line2 as string) ?? undefined,
      placeId: (row.pickup_place_id as string) ?? undefined,
      formattedAddress: (row.pickup_formatted as string) ?? undefined,
      country: (row.pickup_country as string) ?? "US",
      verificationStatus:
        (row.pickup_verification_status as import("@/types/hauling").HaulingLocation["verificationStatus"]) ??
        (row.pickup_verified ? "verified" : "unverified"),
    },
    delivery: {
      address: row.delivery_address as string,
      city: row.delivery_city as string,
      state: row.delivery_state as string,
      zip: row.delivery_zip as string,
      accessNotes: (row.delivery_access_notes as string) ?? undefined,
      loadingDock: Boolean(row.loading_dock_delivery),
      forkliftAvailable: Boolean(row.forklift_available_delivery),
      assistanceAvailable: Boolean(row.assistance_available_delivery),
      location:
        row.delivery_latitude != null && row.delivery_longitude != null
          ? {
              lat: Number(row.delivery_latitude),
              lng: Number(row.delivery_longitude),
            }
          : undefined,
      line2: (row.delivery_line2 as string) ?? undefined,
      placeId: (row.delivery_place_id as string) ?? undefined,
      formattedAddress: (row.delivery_formatted as string) ?? undefined,
      country: (row.delivery_country as string) ?? "US",
      verificationStatus:
        (row.delivery_verification_status as import("@/types/hauling").HaulingLocation["verificationStatus"]) ??
        (row.delivery_verified ? "verified" : "unverified"),
    },
    stops: Array.isArray(row.stops)
      ? (row.stops as import("@/types/hauling").HaulingLocation[])
      : [],
    cargoCategory: row.cargo_category as import("@/types/hauling").HaulingCargoCategory,
    cargoDescription: row.cargo_description as string,
    estimatedWeightLbs: row.estimated_weight_lbs != null ? Number(row.estimated_weight_lbs) : undefined,
    lengthFt: row.length_ft != null ? Number(row.length_ft) : undefined,
    widthFt: row.width_ft != null ? Number(row.width_ft) : undefined,
    heightFt: row.height_ft != null ? Number(row.height_ft) : undefined,
    isRunning: row.is_running as boolean | null,
    isRolling: row.is_rolling as boolean | null,
    needsWinch: Boolean(row.needs_winch),
    needsLoadingHelp: Boolean(row.needs_loading_help),
    needsUnloadingHelp: Boolean(row.needs_unloading_help),
    recommendedTrailerType: row.recommended_trailer_type as import("@/types/hauling").HaulingTrailerType | undefined,
    rentalRequired: Boolean(row.rental_required),
    trailerOwnedOrRental: (row.trailer_owned_or_rental as import("@/types/hauling").TrailerOwnership) ?? undefined,
    estimatedLoadedMiles: row.estimated_loaded_miles != null ? Number(row.estimated_loaded_miles) : undefined,
    estimatedEmptyMiles: row.estimated_empty_miles != null ? Number(row.estimated_empty_miles) : undefined,
    totalTravelMiles: row.total_travel_miles != null ? Number(row.total_travel_miles) : undefined,
    estimatedFuelCost: row.estimated_fuel_cost != null ? Number(row.estimated_fuel_cost) : undefined,
    estimatedDriverHours: row.estimated_driver_hours != null ? Number(row.estimated_driver_hours) : undefined,
    serviceLevel: (row.service_level as import("@/types/hauling").HaulingServiceLevel) ?? undefined,
    customerPricingBreakdown: (row.customer_pricing_breakdown as import("@/types/hauling").PricingBreakdownLine[]) ?? undefined,
    internalCostBreakdown: (row.internal_cost_breakdown as import("@/types/hauling").PricingBreakdownLine[]) ?? undefined,
    estimatedProfit: row.estimated_profit != null ? Number(row.estimated_profit) : undefined,
    estimatedMargin: row.estimated_margin != null ? Number(row.estimated_margin) : undefined,
    urgency: (row.urgency as import("@/types/hauling").HaulingUrgency) ?? "standard",
    trailerAvailabilityDisclaimerAccepted: Boolean(row.trailer_availability_disclaimer_accepted),
    preferredDeliveryDate: (row.preferred_delivery_date as string) ?? undefined,
    preferredDeliveryWindow: (row.preferred_delivery_window as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function haulingDetailsToRow(details: import("@/types/hauling").HaulingDetails) {
  return {
    id: details.id,
    company_id: details.companyId,
    job_id: details.jobId,
    pickup_address: details.pickup.address,
    pickup_city: details.pickup.city,
    pickup_state: details.pickup.state,
    pickup_zip: details.pickup.zip,
    delivery_address: details.delivery.address,
    delivery_city: details.delivery.city,
    delivery_state: details.delivery.state,
    delivery_zip: details.delivery.zip,
    pickup_latitude: details.pickup.location?.lat ?? null,
    pickup_longitude: details.pickup.location?.lng ?? null,
    delivery_latitude: details.delivery.location?.lat ?? null,
    delivery_longitude: details.delivery.location?.lng ?? null,
    pickup_line2: details.pickup.line2 ?? null,
    pickup_place_id: details.pickup.placeId ?? null,
    pickup_formatted: details.pickup.formattedAddress ?? null,
    pickup_verified:
      details.pickup.verificationStatus === "verified" ||
      details.pickup.verificationStatus === "manual_override",
    pickup_verification_status: details.pickup.verificationStatus ?? "unverified",
    pickup_country: details.pickup.country ?? "US",
    delivery_line2: details.delivery.line2 ?? null,
    delivery_place_id: details.delivery.placeId ?? null,
    delivery_formatted: details.delivery.formattedAddress ?? null,
    delivery_verified:
      details.delivery.verificationStatus === "verified" ||
      details.delivery.verificationStatus === "manual_override",
    delivery_verification_status: details.delivery.verificationStatus ?? "unverified",
    delivery_country: details.delivery.country ?? "US",
    stops: details.stops ?? [],
    assistance_available_pickup: details.pickup.assistanceAvailable ?? false,
    assistance_available_delivery: details.delivery.assistanceAvailable ?? false,
    cargo_category: details.cargoCategory,
    cargo_description: details.cargoDescription,
    estimated_weight_lbs: details.estimatedWeightLbs ?? null,
    length_ft: details.lengthFt ?? null,
    width_ft: details.widthFt ?? null,
    height_ft: details.heightFt ?? null,
    is_running: details.isRunning ?? null,
    is_rolling: details.isRolling ?? null,
    needs_winch: details.needsWinch,
    needs_loading_help: details.needsLoadingHelp,
    needs_unloading_help: details.needsUnloadingHelp,
    forklift_available_pickup: details.pickup.forkliftAvailable ?? false,
    forklift_available_delivery: details.delivery.forkliftAvailable ?? false,
    loading_dock_pickup: details.pickup.loadingDock ?? false,
    loading_dock_delivery: details.delivery.loadingDock ?? false,
    recommended_trailer_type: details.recommendedTrailerType ?? null,
    rental_required: details.rentalRequired,
    trailer_owned_or_rental: details.trailerOwnedOrRental ?? null,
    estimated_loaded_miles: details.estimatedLoadedMiles ?? null,
    estimated_empty_miles: details.estimatedEmptyMiles ?? null,
    total_travel_miles: details.totalTravelMiles ?? null,
    estimated_fuel_cost: details.estimatedFuelCost ?? null,
    estimated_driver_hours: details.estimatedDriverHours ?? null,
    service_level: details.serviceLevel ?? "standard",
    customer_pricing_breakdown: details.customerPricingBreakdown ?? [],
    internal_cost_breakdown: details.internalCostBreakdown ?? [],
    estimated_profit: details.estimatedProfit ?? null,
    estimated_margin: details.estimatedMargin ?? null,
    urgency: details.urgency,
    trailer_availability_disclaimer_accepted: details.trailerAvailabilityDisclaimerAccepted,
    pickup_access_notes: details.pickup.accessNotes ?? null,
    delivery_access_notes: details.delivery.accessNotes ?? null,
    preferred_delivery_date: details.preferredDeliveryDate ?? null,
    preferred_delivery_window: details.preferredDeliveryWindow ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function rowToJunkRemovalDetails(row: Record<string, unknown>): import("@/types/junk-removal").JunkRemovalDetails {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    estimateMode: (row.estimate_mode as import("@/types/junk-removal").JunkEstimateMode) ?? "cleanout",
    selectedItems: (row.selected_items as import("@/types/junk-removal").SelectedCommonItem[]) ?? [],
    selectedCategory: (row.selected_category as string) ?? undefined,
    loadPercentage: row.load_percentage != null ? Number(row.load_percentage) : undefined,
    estimatedLaborMinutes: row.estimated_labor_minutes != null ? Number(row.estimated_labor_minutes) : undefined,
    estimatedCrewSize: row.estimated_crew_size != null ? Number(row.estimated_crew_size) : undefined,
    stairsFlights: row.stairs_flights != null ? Number(row.stairs_flights) : undefined,
    elevatorAvailable: Boolean(row.elevator_available),
    basement: Boolean(row.basement),
    attic: Boolean(row.attic),
    longCarryDistanceFt: row.long_carry_distance_ft != null ? Number(row.long_carry_distance_ft) : undefined,
    heavyItems: Boolean(row.heavy_items),
    specialDisposal: Boolean(row.special_disposal),
    dumpFeeEstimate: row.dump_fee_estimate != null ? Number(row.dump_fee_estimate) : undefined,
    mileageEstimate: row.mileage_estimate != null ? Number(row.mileage_estimate) : undefined,
    fuelAdjustment: row.fuel_adjustment != null ? Number(row.fuel_adjustment) : undefined,
    priorityLevel: (row.priority_level as import("@/types/junk-removal").JunkPriorityLevel) ?? "standard",
    reviewRequired: Boolean(row.review_required),
    reviewReasons: (row.review_reasons as string[]) ?? [],
    reviewStatus: (row.review_status as import("@/types/junk-removal").EstimateReviewStatus) ?? "auto_ready",
    customerPricingBreakdown: (row.customer_pricing_breakdown as import("@/types/hauling").PricingBreakdownLine[]) ?? [],
    internalCostBreakdown: (row.internal_cost_breakdown as import("@/types/hauling").PricingBreakdownLine[]) ?? [],
    estimatedProfit: row.estimated_profit != null ? Number(row.estimated_profit) : undefined,
    estimatedMargin: row.estimated_margin != null ? Number(row.estimated_margin) : undefined,
    originBaseId: (row.origin_base_id as string) ?? undefined,
    originBaseName: (row.origin_base_name as string) ?? undefined,
    selectedDisposalSiteId: (row.selected_disposal_site_id as string) ?? undefined,
    selectedDisposalSiteName: (row.selected_disposal_site_name as string) ?? undefined,
    disposalCategory: (row.disposal_category as import("@/types/disposal").DisposalCategory) ?? undefined,
    estimatedDispatchMiles: row.estimated_dispatch_miles != null ? Number(row.estimated_dispatch_miles) : undefined,
    estimatedCustomerToDisposalMiles:
      row.estimated_customer_to_disposal_miles != null
        ? Number(row.estimated_customer_to_disposal_miles)
        : undefined,
    estimatedReturnMiles: row.estimated_return_miles != null ? Number(row.estimated_return_miles) : undefined,
    estimatedTotalRouteMiles: row.estimated_total_route_miles != null ? Number(row.estimated_total_route_miles) : undefined,
    estimatedDriveMinutes: row.estimated_drive_minutes != null ? Number(row.estimated_drive_minutes) : undefined,
    minimumsApplied: (row.minimums_applied as string[]) ?? [],
    disposalSelectionReason: (row.disposal_selection_reason as string) ?? undefined,
    disposalUncertain: Boolean(row.disposal_uncertain),
    actualDisposalSiteId: (row.actual_disposal_site_id as string) ?? undefined,
    actualDisposalSiteName: (row.actual_disposal_site_name as string) ?? undefined,
    estimatedDisposalCost: row.estimated_disposal_cost != null ? Number(row.estimated_disposal_cost) : undefined,
    actualDisposalCost: row.actual_disposal_cost != null ? Number(row.actual_disposal_cost) : undefined,
    actualDisposalWeightTons: row.actual_disposal_weight_tons != null ? Number(row.actual_disposal_weight_tons) : undefined,
    disposalCompletedAt: (row.disposal_completed_at as string) ?? undefined,
    disposalReceiptUrl: (row.disposal_receipt_url as string) ?? undefined,
    disposalOverrideReason: (row.disposal_override_reason as string) ?? undefined,
    disposalNotes: (row.disposal_notes as string) ?? undefined,
    recommendedDisposalSiteId: (row.recommended_disposal_site_id as string) ?? undefined,
    disposalWeightTicketUrl: (row.disposal_weight_ticket_url as string) ?? undefined,
    actualDisposalWaitMinutes: row.actual_disposal_wait_minutes != null ? Number(row.actual_disposal_wait_minutes) : undefined,
    actualDisposalUnloadMinutes: row.actual_disposal_unload_minutes != null ? Number(row.actual_disposal_unload_minutes) : undefined,
    actualFuelCost: row.actual_fuel_cost != null ? Number(row.actual_fuel_cost) : undefined,
    actualGrossProfit: row.actual_gross_profit != null ? Number(row.actual_gross_profit) : undefined,
    actualProfitMargin: row.actual_profit_margin != null ? Number(row.actual_profit_margin) : undefined,
    disposalSkipReason: (row.disposal_skip_reason as string) ?? undefined,
    disposalSkipNotes: (row.disposal_skip_notes as string) ?? undefined,
    disposalSkippedAt: (row.disposal_skipped_at as string) ?? undefined,
    noDisposalCostReason: (row.no_disposal_cost_reason as string) ?? undefined,
    disposalReviewStatus: (row.disposal_review_status as import("@/lib/disposal/disposal-requirements").DisposalReviewStatus) ?? undefined,
    disposalReviewNotes: (row.disposal_review_notes as string) ?? undefined,
    selectedScheduleSlotId: (row.selected_schedule_slot_id as string) ?? undefined,
    scheduledWindowLabel: (row.scheduled_window_label as string) ?? undefined,
    flexibleDiscountAmount:
      row.flexible_discount_amount != null ? Number(row.flexible_discount_amount) : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function junkRemovalDetailsToRow(details: import("@/types/junk-removal").JunkRemovalDetails) {
  return {
    id: details.id,
    company_id: details.companyId,
    job_id: details.jobId,
    estimate_mode: details.estimateMode,
    selected_items: details.selectedItems ?? [],
    selected_category: details.selectedCategory ?? null,
    load_percentage: details.loadPercentage ?? null,
    estimated_labor_minutes: details.estimatedLaborMinutes ?? null,
    estimated_crew_size: details.estimatedCrewSize ?? null,
    stairs_flights: details.stairsFlights ?? 0,
    elevator_available: details.elevatorAvailable ?? false,
    basement: details.basement ?? false,
    attic: details.attic ?? false,
    long_carry_distance_ft: details.longCarryDistanceFt ?? 0,
    heavy_items: details.heavyItems ?? false,
    special_disposal: details.specialDisposal ?? false,
    dump_fee_estimate: details.dumpFeeEstimate ?? null,
    mileage_estimate: details.mileageEstimate ?? null,
    fuel_adjustment: details.fuelAdjustment ?? null,
    priority_level: details.priorityLevel ?? "standard",
    review_required: details.reviewRequired,
    review_reasons: details.reviewReasons,
    review_status: details.reviewStatus,
    customer_pricing_breakdown: details.customerPricingBreakdown ?? [],
    internal_cost_breakdown: details.internalCostBreakdown ?? [],
    estimated_profit: details.estimatedProfit ?? null,
    estimated_margin: details.estimatedMargin ?? null,
    origin_base_id: details.originBaseId ?? null,
    origin_base_name: details.originBaseName ?? null,
    selected_disposal_site_id: details.selectedDisposalSiteId ?? null,
    selected_disposal_site_name: details.selectedDisposalSiteName ?? null,
    disposal_category: details.disposalCategory ?? null,
    estimated_dispatch_miles: details.estimatedDispatchMiles ?? null,
    estimated_customer_to_disposal_miles: details.estimatedCustomerToDisposalMiles ?? null,
    estimated_return_miles: details.estimatedReturnMiles ?? null,
    estimated_total_route_miles: details.estimatedTotalRouteMiles ?? null,
    estimated_drive_minutes: details.estimatedDriveMinutes ?? null,
    minimums_applied: details.minimumsApplied ?? [],
    disposal_selection_reason: details.disposalSelectionReason ?? null,
    disposal_uncertain: details.disposalUncertain ?? false,
    selected_schedule_slot_id: details.selectedScheduleSlotId ?? null,
    scheduled_window_label: details.scheduledWindowLabel ?? null,
    flexible_discount_amount: details.flexibleDiscountAmount ?? 0,
    updated_at: new Date().toISOString(),
  };
}

export function jobToRow(job: Job) {
  const loadPct =
    job.estimate?.trailerPercent ??
    ({ min_10: 10, quarter_25: 25, half_50: 50, three_quarter_75: 75, full_100: 100, multi_150: 150 }[
      job.loadSizeTier
    ] ?? 25);

  const { id, companyId, customerId, status, junkType, serviceType, scheduledDate, address, items, accessDetails, customerNotes, divisionId, ...rest } = job;
  const resolvedDivision =
    divisionId ?? (serviceType === "hauling_transport" ? "hauling" : "junk_removal");

  return {
    id,
    company_id: companyId,
    customer_id: customerId,
    status,
    junk_type: junkType,
    service_type: serviceType ?? "junk_removal",
    division_id: resolvedDivision,
    estimate_type: job.estimateType ?? serviceType ?? "junk_removal",
    pricing_breakdown: job.pricingBreakdown ?? [],
    disclaimer_accepted: job.disclaimerAccepted ?? false,
    scheduled_date: scheduledDate ?? null,
    selected_schedule_slot_id: job.selectedScheduleSlotId ?? null,
    scheduled_window_label: job.scheduledWindowLabel ?? null,
    flexible_discount_amount: job.flexibleDiscountAmount ?? 0,
    address: address.street,
    city: address.city,
    state: address.state,
    zip: address.zip,
    latitude: address.location?.lat ?? null,
    longitude: address.location?.lng ?? null,
    address_line2: address.line2 ?? null,
    address_place_id: address.placeId ?? null,
    address_formatted: address.formattedAddress ?? null,
    address_verified:
      address.verificationStatus === "verified" ||
      address.verificationStatus === "manual_override",
    address_country: address.country ?? "US",
    address_verification_status: address.verificationStatus ?? null,
    load_percentage: loadPct,
    estimated_price: job.estimate?.total ?? null,
    final_price: job.finalPriceAdjustment != null && job.estimate
      ? job.estimate.total + job.finalPriceAdjustment
      : null,
    payment_status: null,
    access_details: accessDetails,
    item_list: items,
    customer_notes: customerNotes ?? null,
    internal_notes: job.priceAdjustmentNotes ?? null,
    completion_override_reason: job.completionOverrideReason ?? null,
    completion_override_by: job.completionOverrideBy ?? null,
    completion_override_at: job.completionOverrideAt ?? null,
    payload: {
      ...rest,
      id,
      companyId,
      customerId,
      serviceType,
      divisionId: resolvedDivision,
      status,
      junkType,
      scheduledDate,
      address,
      items,
      accessDetails,
      customerNotes,
    },
    updated_at: new Date().toISOString(),
  };
}

export function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    customerId: row.customer_id as string,
    estimateAmount: Number(row.estimate_amount ?? row.subtotal ?? 0),
    adjustments: (row.adjustments as Invoice["adjustments"]) ?? [],
    subtotal: Number(row.subtotal ?? 0),
    fees: Number(row.fees ?? row.tax ?? 0),
    depositAmount: Number(row.deposit_amount ?? 0),
    depositPaid: Number(row.deposit_paid ?? 0),
    total: Number(row.total ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    balanceDue: Number(row.balance_due ?? 0),
    status: row.status as Invoice["status"],
    paymentStatus: row.payment_status as Invoice["paymentStatus"],
    dueDate: (row.due_date as string) ?? undefined,
    terms: (row.terms as string) ?? undefined,
    finalPriceNotes: (row.final_price_notes as string) ?? undefined,
    pdfStoragePath: (row.pdf_storage_path as string) ?? undefined,
    estimateId: (row.estimate_id as string) ?? undefined,
    originalEstimateTotal:
      row.original_estimate_total != null ? Number(row.original_estimate_total) : undefined,
    approvedAdjustmentsTotal:
      row.approved_adjustments_total != null ? Number(row.approved_adjustments_total) : undefined,
    customerNotes: (row.customer_notes as string) ?? undefined,
    internalNotes: (row.internal_notes as string) ?? undefined,
    deliveryStatus: (row.delivery_status as Invoice["deliveryStatus"]) ?? undefined,
    deliveryError: (row.delivery_error as string) ?? undefined,
    sentAt: (row.sent_at as string) ?? undefined,
    viewedAt: (row.viewed_at as string) ?? undefined,
    issueDate: (row.issue_date as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    invoiceId: (row.invoice_id as string) ?? undefined,
    amount: Number(row.amount),
    method: row.method as Payment["method"],
    timing: (row.timing ?? "full") as Payment["timing"],
    status: row.status as Payment["status"],
    receiptNumber: (row.receipt_number ?? row.transaction_id) as string | undefined,
    notes: (row.notes as string) ?? undefined,
    proofUrl: (row.proof_url as string) ?? undefined,
    reversedAt: (row.reversed_at as string) ?? undefined,
    reversalReason: (row.reversal_reason as string) ?? undefined,
    receiptIssuedAt: (row.receipt_issued_at as string) ?? undefined,
    externalReference: (row.external_reference as string) ?? undefined,
    createdAt: row.created_at as string,
    customerId: row.customer_id as string | undefined,
  };
}

export function rowToFinancing(row: Record<string, unknown>): FinancingRequest {
  const schedule = (row.payment_schedule as FinancingRequest["paymentSchedule"]) ?? [];
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    invoiceId: (row.invoice_id as string) ?? undefined,
    customerId: row.customer_id as string,
    provider: (row.provider ?? "in_house") as FinancingRequest["provider"],
    status: row.status as FinancingRequest["status"],
    totalAmount: Number(row.requested_amount ?? row.total_amount ?? 0),
    downPayment: Number(row.down_payment ?? 0),
    numberOfPayments: Number(row.payment_count ?? row.number_of_payments ?? 0),
    paymentFrequency: row.payment_frequency as FinancingRequest["paymentFrequency"],
    preferredFirstPaymentDate: (row.first_payment_date ?? row.preferred_first_payment_date) as string | undefined,
    employmentStatus: row.employment_status as FinancingRequest["employmentStatus"],
    monthlyIncome: row.monthly_income != null ? Number(row.monthly_income) : undefined,
    customerNotes: (row.customer_notes as string) ?? undefined,
    internalNotes: (row.admin_notes ?? row.internal_notes) as string | undefined,
    signaturePlaceholder: row.signature_placeholder as string | undefined,
    termsAccepted: Boolean(row.terms_accepted),
    denialReason: row.denial_reason as string | undefined,
    riskScore: row.risk_score != null ? Number(row.risk_score) : undefined,
    paymentSchedule: schedule,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function invoiceToRow(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    company_id: inv.companyId,
    job_id: inv.jobId,
    customer_id: inv.customerId,
    estimate_amount: inv.estimateAmount,
    adjustments: inv.adjustments,
    adjustments_total: inv.adjustments.reduce((s, a) => s + a.amount, 0),
    subtotal: inv.subtotal,
    fees: inv.fees,
    tax: 0,
    deposit_amount: inv.depositAmount,
    deposit_paid: inv.depositPaid,
    total: inv.total,
    amount_paid: inv.amountPaid,
    balance_due: inv.balanceDue,
    status: inv.status,
    payment_status: inv.paymentStatus,
    due_date: inv.dueDate ?? null,
    terms: inv.terms ?? null,
    final_price_notes: inv.finalPriceNotes ?? null,
    pdf_storage_path: inv.pdfStoragePath ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function rowToCustomerUser(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    email: (row.email as string) ?? "",
    name: `${row.first_name} ${row.last_name}`.trim(),
    role: "customer",
    phone: (row.phone as string) ?? undefined,
    address: [row.address, row.city, row.state, row.zip].filter(Boolean).join(", ") || undefined,
    callbackDueAt: (row.callback_due_at as string) ?? undefined,
    callbackNotes: (row.callback_notes as string) ?? undefined,
    callbackStatus: (row.callback_status as Customer["callbackStatus"]) ?? "none",
  };
}

export function rowToEmployeeUser(row: Record<string, unknown>): Employee {
  const dbRole = row.role as string;
  const appRole =
    dbRole === "admin" ? "admin" : dbRole === "planner" ? "planner" : "employee";
  return {
    id: (row.profile_id as string) ?? (row.id as string),
    companyId: row.company_id as string,
    email: (row.email as string) ?? "",
    name: `${row.first_name} ${row.last_name}`.trim(),
    role: appRole,
    phone: (row.phone as string) ?? undefined,
    employeeId: row.id as string,
  };
}
