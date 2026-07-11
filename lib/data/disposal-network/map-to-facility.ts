import type { DisposalFacility } from "@/types/disposal-management";
import { VERIFIED_DISPOSAL_FACILITIES } from "./facilities";
import type { VerifiedDisposalFacility } from "./types";

/** Map a verified network record into the runtime DisposalFacility shape. */
export function verifiedToDisposalFacility(f: VerifiedDisposalFacility): DisposalFacility {
  const pricingUnknown = f.perTonFee == null && f.baseFee == null;
  return {
    id: f.id,
    name: f.name,
    address: f.address,
    city: f.city,
    state: f.state,
    zip: f.zip,
    county: f.county,
    location: f.latitude != null && f.longitude != null ? { lat: f.latitude, lng: f.longitude } : undefined,
    phone: f.phone,
    website: f.website,
    accessType: f.accessType,
    hoursJson: f.hoursJson as DisposalFacility["hoursJson"],
    holidayClosures: f.holidayClosures,
    acceptedMaterials: f.acceptedMaterials,
    rejectedMaterials: f.rejectedMaterials,
    maxLoadSize: f.maxLoadSize,
    trailerRestrictions: f.trailerRestrictions,
    truckRestrictions: f.truckRestrictions,
    weightLimitTons: f.weightLimitTons ?? undefined,
    feeType: f.feeType ?? "weight",
    baseFee: f.baseFee ?? 0,
    perTonFee: f.perTonFee ?? undefined,
    minimumFee: f.minimumFee ?? 0,
    notes: [f.operationalNotes, f.publicPricingNotes].filter(Boolean).join(" "),
    internalNotes: f.internalNotes,
    status: f.status,
    isClosed: false,
    facilityType: f.facilityType,
    commercialAccepted: f.commercialAccepted,
    appointmentRequired: f.appointmentRequired,
    residencyRestriction: f.residencyRestriction,
    specialRequirements: f.specialRequirements,
    operationalNotes: f.operationalNotes,
    scaleAvailable: f.scaleAvailable ?? undefined,
    paymentMethods: f.paymentMethods,
    publicPricingNotes: f.publicPricingNotes,
    commercialPricingNotes: f.commercialPricingNotes,
    verificationStatus: f.verificationStatus,
    verificationSources: f.verificationSources,
    verifiedAt: f.verifiedAt,
    pricingVerifiedAt: f.pricingVerifiedAt ?? undefined,
    pricingUnknown,
    geocodeSource: f.geocodeSource,
  };
}

export function allVerifiedAsDisposalFacilities(): DisposalFacility[] {
  return VERIFIED_DISPOSAL_FACILITIES.filter((f) => f.status === "active").map(verifiedToDisposalFacility);
}
