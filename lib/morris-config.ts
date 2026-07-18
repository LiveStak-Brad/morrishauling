import type { CompanyConfig } from "@/types";
import { COMMON_JUNK_ITEMS } from "@/lib/common-junk-items";
import { socialPlatformById } from "@/lib/social/config";

export const MORRIS_COMPANY_ID = "morris-hauling" as const;

export const HAULING_ESTIMATE_DISCLAIMER =
  "This hauling estimate is based on the information provided. Final pricing may change based on actual mileage, fuel cost, cargo weight, cargo dimensions, loading conditions, trailer availability, rental trailer cost, wait time, tolls, access issues, or additional services requested.";

export const HAULING_RENTAL_DISCLAIMER =
  "This estimate depends on trailer availability. If a rental trailer is required, final pricing may change based on rental availability, rental location, rental cost, and scheduling.";

export const ESTIMATE_DISCLAIMER =
  "This is an estimate based on the information provided. Final price may change after on-site review due to weight, volume, stairs, walking distance, access issues, special disposal fees, labor time, dump fees, or additional items.";

export const FINANCING_DISCLAIMER =
  "In-house financing is offered at the discretion of Morris Junk Removal. Approval is not guaranteed. Missed payments may result in collection activity, late fees, or loss of future financing eligibility.";

export const COMPANY_TERMS =
  "Payment is due upon completion unless a deposit is required to schedule. Estimates are non-binding until confirmed on site. Morris Junk Removal is not responsible for damage to property caused by pre-existing conditions, hidden hazards, or items not disclosed prior to service. Cancellations within 24 hours of the scheduled window may incur a trip fee.";

const LOAD_TIERS = [
  { tier: "min_10", label: "Small Pickup", trailerPercent: 10, basePrice: 99 },
  { tier: "quarter_25", label: "Quarter Trailer", trailerPercent: 25, basePrice: 199 },
  { tier: "half_50", label: "Half Trailer", trailerPercent: 50, basePrice: 349 },
  { tier: "three_quarter_75", label: "Three Quarter Trailer", trailerPercent: 75, basePrice: 499 },
  { tier: "full_100", label: "Full Trailer", trailerPercent: 100, basePrice: 599 },
  { tier: "multi_150", label: "Multiple Loads", trailerPercent: 150, basePrice: 899 },
];

const PRICING_MODIFIERS = [
  { id: "stairs", label: "Stairs", amount: 50, type: "flat" as const },
  { id: "elevator", label: "Elevator access", amount: -25, type: "flat" as const },
  { id: "long_carry", label: "Long carry (50+ ft)", amount: 75, type: "flat" as const },
  { id: "basement", label: "Basement", amount: 40, type: "flat" as const },
  { id: "attic", label: "Attic", amount: 60, type: "flat" as const },
  { id: "tight_access", label: "Tight access", amount: 50, type: "flat" as const },
  { id: "heavy_items", label: "Heavy items", amount: 100, type: "flat" as const },
  { id: "special_disposal", label: "Special disposal", amount: 150, type: "flat" as const },
];

/** Morris Junk Removal — flagship operating company configuration */
export const morrisConfig = {
  companyId: MORRIS_COMPANY_ID,
  companyName: "Morris Junk Removal",
  logo: "/logo.png?v=4",
  heroBanner: "",
  /** Optional portrait hero for phones; leave empty when using logo-first marketing */
  heroBannerMobile: "",
  phone: "(636) 751-4645",
  email: "info@morrisjunk.com",
  companyAddress: "607 South State Highway 47, Warrenton, MO 63383",
  website: "https://morrisjunk.com",
  serviceArea: {
    center: { lat: 38.8178812, lng: -91.1428926 },
    radiusMiles: 45,
    label: "Warren, Lincoln & St. Charles Counties, MO",
    /** Service ZIPs (not the operating-base ZIP). Base ZIP is always 63383. */
    zipCodes: ["63301", "63303", "63304", "63368", "63376", "63383", "63379", "63390", "63049", "63090"],
  },
  brandColors: {
    primary: "#9B1B30",
    secondary: "#0A0A0A",
    accent: "#374151",
    background: "#F7F5F2",
    foreground: "#0A0A0A",
  },
  pricingRules: {
    loadTiers: LOAD_TIERS,
    modifiers: PRICING_MODIFIERS,
    minCharge: 99,
    dumpFee: 45,
    itemSurcharge: 15,
  },
  services: [
    { id: "residential", name: "Residential Junk Removal", description: "Home decluttering, attic hauls, and everyday unwanted items." },
    { id: "commercial", name: "Commercial Junk Removal", description: "Office, retail, and property turnover clear-outs." },
    { id: "estate", name: "Estate Cleanouts", description: "Compassionate full-property cleanouts with careful sorting." },
    { id: "garage", name: "Garage Cleanouts", description: "Reclaim the garage — furniture, tools, debris, and more." },
    { id: "storage", name: "Storage Units", description: "Unit clear-outs and abandoned contents removal." },
    { id: "foreclosure", name: "Foreclosures", description: "Property cleanouts for banks, agents, and investors." },
    { id: "furniture", name: "Furniture Removal", description: "Sofas, mattresses, dressers, and bulky household items." },
    { id: "appliance", name: "Appliance Removal", description: "Refrigerators, washers, dryers, and large appliances." },
    { id: "hottub", name: "Hot Tub Removal", description: "Disassembly and haul-away for spas and hot tubs." },
    { id: "construction", name: "Construction Debris", description: "Drywall, lumber, and renovation debris removal." },
    { id: "fullproperty", name: "Full Property Cleanouts", description: "Whole-home and lot clearances done with care." },
  ],
  /** Public booking offers Junk Removal only; Hauling is a separate coming-soon division. */
  serviceLines: [
    {
      id: "junk_removal" as const,
      name: "Junk Removal",
      tagline: "Clear out unwanted junk, debris, furniture, appliances, cleanouts and more.",
      examples: [
        "Garage cleanout",
        "Estate cleanout",
        "Appliance removal",
        "Furniture removal",
        "Construction debris",
        "Hot tub removal",
        "Storage unit clear-out",
        "Full property cleanout",
      ],
    },
  ],
  /** Internal / future Morris Hauling division — not shown in Junk Removal booking */
  haulingServiceLines: [
    {
      id: "hauling_transport" as const,
      name: "Hauling & Transport",
      tagline: "Move equipment, vehicles, materials, machinery, pallets, and oversized items.",
      examples: [
        "Equipment hauling",
        "Material delivery",
        "Trailer transport",
        "Machinery transport",
        "Building materials",
        "Contractor deliveries",
      ],
    },
  ],
  haulingCategories: [
    { id: "vehicle", label: "Vehicle" },
    { id: "equipment", label: "Equipment" },
    { id: "machinery", label: "Machinery" },
    { id: "tractor", label: "Tractor" },
    { id: "atv_utv", label: "ATV / UTV" },
    { id: "pallets", label: "Pallets" },
    { id: "lumber", label: "Lumber" },
    { id: "building_materials", label: "Building materials" },
    { id: "trailer", label: "Trailer" },
    { id: "toolbox", label: "Toolbox" },
    { id: "marketplace", label: "Marketplace pickup" },
    { id: "other", label: "Other" },
  ],
  haulingTrailerTypes: [
    { id: "utility_trailer", label: "Utility trailer", displayName: "16' Utility Trailer", fee: 65, owned: true },
    { id: "car_hauler", label: "Car hauler", displayName: "20' Car Hauler", fee: 95, owned: false },
    { id: "equipment_trailer", label: "Equipment trailer", displayName: "20' Equipment Trailer", fee: 110, owned: true },
    { id: "tilt_trailer", label: "Tilt trailer", displayName: "18' Tilt Trailer", fee: 85, owned: true },
    { id: "dump_trailer", label: "Dump trailer", displayName: "14' Dump Trailer", fee: 75, owned: true },
    { id: "enclosed_trailer", label: "Enclosed trailer", displayName: "20' Enclosed Trailer", fee: 90, owned: false },
    { id: "flatbed", label: "Flatbed", displayName: "24' Flatbed", fee: 100, owned: true },
    { id: "gooseneck", label: "Gooseneck", displayName: "35' Gooseneck", fee: 140, owned: false },
  ],
  haulingServiceLevels: [
    {
      id: "economy" as const,
      label: "Economy",
      description: "Flexible scheduling, best price",
      priceMultiplier: 0.92,
    },
    {
      id: "standard" as const,
      label: "Standard",
      description: "Normal scheduling window",
      priceMultiplier: 1,
    },
    {
      id: "priority" as const,
      label: "Priority",
      description: "Within 24 hours",
      flatSurcharge: 125,
    },
    {
      id: "emergency" as const,
      label: "Emergency",
      description: "ASAP — highest surcharge",
      flatSurcharge: 225,
    },
  ],
  haulingPricing: {
    baseFee: 149,
    perLoadedMileRate: 3.25,
    deadheadMileRate: 1.85,
    deadheadRatio: 0.42,
    fuelAdjustmentRate: 0.48,
    driverHourlyRate: 65,
    loadingLaborRate: 85,
    unloadingLaborRate: 85,
    rentalTrailerFee: 95,
    rentalTrailerMarkup: 1.35,
    priorityFee: 125,
    emergencyFee: 225,
    economyDiscountPercent: 8,
    overheadAllocationFlat: 12,
    internalFuelCostPerMile: 0.55,
    internalPayrollCostRate: 0.62,
    internalTrailerCostRate: 0.18,
    internalRentalCostRate: 0.82,
  },
  haulingEstimateDisclaimer: HAULING_ESTIMATE_DISCLAIMER,
  haulingRentalDisclaimer: HAULING_RENTAL_DISCLAIMER,
  commonJunkItems: COMMON_JUNK_ITEMS,
  junkRemovalPricing: {
    baseServiceFee: 79,
    minimumDispatchFee: 39,
    minimumFuelFee: 25,
    minimumTravelFee: 49,
    customerTravelRatePerMile: 1.65,
    fuelAdjustmentRate: 0.55,
    averageDriveMph: 42,
    laborHourlyRate: 58,
    helperHourlyRate: 42,
    internalDriveLaborMultiplier: 0.85,
    stairsFeePerFlight: 45,
    longCarryFeeThresholdFt: 50,
    longCarryFee: 75,
    heavyItemFee: 95,
    specialDisposalFee: 125,
    dumpFeeDefault: 45,
    sameDayFee: 99,
    emergencyFee: 175,
    reviewRequiredThreshold: 650,
    reviewRouteMilesThreshold: 85,
    minimumMarginTarget: 35,
    minimumJobPrice: 149,
    minimumSingleItemPickup: 129,
    minimumDisposalFee: 35,
    minimumLaborMinutes: 30,
    typicalArrivalWindow: "Within a 2-hour window on your scheduled service day",
    longRoutePriceFactorMiles: 55,
    internalFuelMpg: 11,
    internalDieselPricePerGallon: 3.85,
    internalTruckOperatingCostPerMile: 0.72,
    internalTrailerOperatingCostPerMile: 0.18,
    internalPayrollCostRate: 0.58,
    internalDumpCostRate: 0.92,
    internalOverheadFlat: 18,
    internalCreditCardProcessingRate: 0.029,
    /** @deprecated use customerTravelRatePerMile */
    perMileRate: 1.65,
    /** @deprecated */
    internalFuelCostPerMile: 0.48,
    /** @deprecated */
    internalTruckCostPerLoadPercent: 1.25,
    overheadAllocationFlat: 18,
  },
  estimateDisclaimer: ESTIMATE_DISCLAIMER,
  paymentOptions: {
    depositPercent: 25,
    depositMinAmount: 50,
    methods: [
      "cash",
      "check",
      "manual_card",
      "bank_transfer",
      "cash_on_arrival",
      "invoice",
      "financing",
    ] as const,
    allowPayAfterCompletion: true,
  },
  financingOptions: {
    inHouseEnabled: true,
    thirdPartyProviders: ["klarna", "affirm", "stripe_link", "square", "paypal"] as const,
  },
  operationsGoals: {
    dailyRevenueGoal: 2500,
    weeklyPayrollAmount: 2841,
    payrollDueLabel: "Payroll due Friday",
  },
  employees: [
    { id: "emp-m1", name: "James Morris", role: "lead" as const, phone: "(636) 751-4645", avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=JamesMorris&backgroundColor=b6e3f4" },
    { id: "emp-m2", name: "Marcus Webb", role: "driver" as const, phone: "(636) 751-4646", avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=MarcusWebb&backgroundColor=c0aede" },
    { id: "emp-m3", name: "Tyler Brooks", role: "helper" as const, phone: "(636) 751-4647", avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=TylerBrooks&backgroundColor=ffd5dc" },
    { id: "emp-m4", name: "Dana Chen", role: "helper" as const, phone: "(636) 751-4648", avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=DanaChen&backgroundColor=d1f4d1" },
  ],
  trucks: [
    { id: "truck-m1", name: "Truck 1", licensePlate: "MO-JNK01", capacity: "26 ft box" },
    { id: "truck-m2", name: "Truck 2", licensePlate: "MO-JNK02", capacity: "20 ft box" },
  ],
  trailers: [
    { id: "trailer-m1", name: "Trailer Alpha", capacityPercent: 100, licensePlate: "MO-TRL01" },
    { id: "trailer-m2", name: "Trailer Beta", capacityPercent: 100, licensePlate: "MO-TRL02" },
  ],
  operatingBases: [
    {
      id: "base-warrenton",
      name: "Morris Services Operating Base",
      address: "607 South State Highway 47",
      city: "Warrenton",
      state: "MO",
      zip: "63383",
      /** Canonical Google Places result for 607 State Hwy 47, Warrenton, MO 63383 */
      location: { lat: 38.8178812, lng: -91.1428926 },
      placeId: "ChIJL62xWj-p3ocRf4EtEOvpxpY",
      formattedAddress: "607 State Hwy 47, Warrenton, MO 63383, USA",
      isPrimary: true,
    },
    {
      id: "yard-danville",
      name: "Danville Junk Yard / Storage",
      address: "Danville Storage Yard",
      city: "Danville",
      state: "MO",
      zip: "63361",
      location: { lat: 38.91, lng: -91.512 },
      isPrimary: false,
    },
  ],
  dumpSites: [
    {
      id: "dump-warren-county",
      name: "Warren County Disposal",
      address: "800 Industrial Dr, Warrenton, MO",
      city: "Warrenton",
      state: "MO",
      location: { lat: 38.813, lng: -91.135 },
      acceptedMaterials: ["general_junk", "construction_debris", "yard_waste", "bulky_special"],
      feeType: "flat",
      baseFee: 45,
      minimumFee: 40,
      status: "active",
      feePerLoad: 45,
    },
    {
      id: "dump-foristell",
      name: "Foristell Transfer Station",
      address: "100 Transfer Way, Foristell, MO",
      city: "Foristell",
      state: "MO",
      location: { lat: 38.812, lng: -90.685 },
      acceptedMaterials: ["general_junk", "construction_debris", "yard_waste"],
      feeType: "mixed",
      baseFee: 55,
      perTonFee: 38,
      minimumFee: 50,
      status: "active",
      feePerLoad: 55,
    },
    {
      id: "dump-danville-yard",
      name: "Danville Yard — Morris Storage",
      address: "Danville, MO",
      city: "Danville",
      state: "MO",
      location: { lat: 38.91, lng: -91.512 },
      acceptedMaterials: ["general_junk", "scrap_metal", "yard_waste"],
      feeType: "flat",
      baseFee: 25,
      minimumFee: 20,
      status: "active",
      feePerLoad: 25,
    },
    {
      id: "dump-lincoln-recycle",
      name: "Lincoln County Recycling Center",
      address: "450 County Rd, Troy, MO",
      city: "Troy",
      state: "MO",
      location: { lat: 38.98, lng: -90.98 },
      acceptedMaterials: ["general_junk", "yard_waste", "scrap_metal"],
      feeType: "flat",
      baseFee: 35,
      minimumFee: 30,
      status: "active",
      feePerLoad: 35,
    },
    {
      id: "dump-st-charles",
      name: "St. Charles Transfer Station",
      address: "1200 Transfer Rd, St. Charles, MO",
      city: "St. Charles",
      state: "MO",
      location: { lat: 38.79, lng: -90.52 },
      acceptedMaterials: ["general_junk", "construction_debris"],
      feeType: "flat",
      baseFee: 48,
      minimumFee: 45,
      status: "active",
      feePerLoad: 48,
    },
    {
      id: "dump-scrap-metal",
      name: "Regional Scrap Metal Recycler",
      address: "Industrial Blvd, Wentzville, MO",
      city: "Wentzville",
      state: "MO",
      location: { lat: 38.82, lng: -90.85 },
      acceptedMaterials: ["scrap_metal", "appliance"],
      feeType: "per_item",
      baseFee: 15,
      perItemFee: 12,
      minimumFee: 15,
      status: "active",
      feePerLoad: 15,
    },
    {
      id: "dump-tire",
      name: "Tire Disposal Facility",
      address: "Route N, Warrenton, MO",
      city: "Warrenton",
      state: "MO",
      location: { lat: 38.805, lng: -91.12 },
      acceptedMaterials: ["tire"],
      feeType: "per_item",
      baseFee: 8,
      perItemFee: 8,
      minimumFee: 8,
      status: "active",
      feePerLoad: 8,
    },
    {
      id: "dump-appliance",
      name: "Appliance Recycling Center",
      address: "O'Fallon, MO",
      city: "O'Fallon",
      state: "MO",
      location: { lat: 38.785, lng: -90.7 },
      acceptedMaterials: ["appliance", "freon_appliance", "electronics"],
      feeType: "per_item",
      baseFee: 25,
      perItemFee: 22,
      minimumFee: 25,
      status: "active",
      feePerLoad: 25,
    },
    {
      id: "dump-mattress",
      name: "Mattress Recycling Drop-off",
      address: "St. Peters, MO",
      city: "St. Peters",
      state: "MO",
      location: { lat: 38.792, lng: -90.595 },
      acceptedMaterials: ["mattress"],
      feeType: "per_item",
      baseFee: 18,
      perItemFee: 18,
      minimumFee: 18,
      status: "active",
      feePerLoad: 18,
    },
    {
      id: "dump-construction",
      name: "Construction Debris Disposal",
      address: "Wright City, MO",
      city: "Wright City",
      state: "MO",
      location: { lat: 38.828, lng: -91.02 },
      acceptedMaterials: ["construction_debris"],
      feeType: "weight",
      baseFee: 65,
      perTonFee: 42,
      minimumFee: 60,
      status: "active",
      feePerLoad: 65,
    },
  ],
  yardLocation: { lat: 38.8178812, lng: -91.1428926 },
  businessHours: "Mon–Sat 7:00 AM – 6:00 PM · Sunday by appointment",
  companyTerms: COMPANY_TERMS,
  financingDisclaimer: FINANCING_DISCLAIMER,
  socialLinks: {
    facebook: socialPlatformById("facebook")!.profileUrl,
    instagram: socialPlatformById("instagram")!.profileUrl,
    google: "",
  },
} satisfies CompanyConfig & {
  businessHours: string;
  companyTerms: string;
  financingDisclaimer: string;
  socialLinks: { facebook: string; instagram: string; google: string };
  serviceLines: Array<{
    id: "junk_removal" | "hauling_transport";
    name: string;
    tagline: string;
    examples: string[];
  }>;
  haulingServiceLines: Array<{
    id: "hauling_transport";
    name: string;
    tagline: string;
    examples: string[];
  }>;
  haulingCategories: Array<{ id: string; label: string }>;
  haulingTrailerTypes: Array<{ id: string; label: string; displayName: string; fee: number; owned: boolean }>;
  haulingServiceLevels: Array<{
    id: "economy" | "standard" | "priority" | "emergency";
    label: string;
    description: string;
    priceMultiplier?: number;
    flatSurcharge?: number;
  }>;
  haulingPricing: {
    baseFee: number;
    perLoadedMileRate: number;
    deadheadMileRate: number;
    deadheadRatio: number;
    fuelAdjustmentRate: number;
    driverHourlyRate: number;
    loadingLaborRate: number;
    unloadingLaborRate: number;
    rentalTrailerFee: number;
    rentalTrailerMarkup: number;
    priorityFee: number;
    emergencyFee: number;
    economyDiscountPercent: number;
    overheadAllocationFlat: number;
    internalFuelCostPerMile: number;
    internalPayrollCostRate: number;
    internalTrailerCostRate: number;
    internalRentalCostRate: number;
  };
  haulingEstimateDisclaimer: string;
  haulingRentalDisclaimer: string;
  commonJunkItems: typeof COMMON_JUNK_ITEMS;
  junkRemovalPricing: {
    baseServiceFee: number;
    minimumDispatchFee: number;
    minimumFuelFee: number;
    minimumTravelFee: number;
    customerTravelRatePerMile: number;
    fuelAdjustmentRate: number;
    averageDriveMph: number;
    laborHourlyRate: number;
    helperHourlyRate: number;
    internalDriveLaborMultiplier: number;
    stairsFeePerFlight: number;
    longCarryFeeThresholdFt: number;
    longCarryFee: number;
    heavyItemFee: number;
    specialDisposalFee: number;
    dumpFeeDefault: number;
    sameDayFee: number;
    emergencyFee: number;
    reviewRequiredThreshold: number;
    reviewRouteMilesThreshold: number;
    minimumMarginTarget: number;
    minimumJobPrice: number;
    minimumSingleItemPickup: number;
    minimumDisposalFee: number;
    minimumLaborMinutes: number;
    typicalArrivalWindow: string;
    longRoutePriceFactorMiles: number;
    internalFuelMpg: number;
    internalDieselPricePerGallon: number;
    internalTruckOperatingCostPerMile: number;
    internalTrailerOperatingCostPerMile: number;
    internalPayrollCostRate: number;
    internalDumpCostRate: number;
    internalOverheadFlat: number;
    internalCreditCardProcessingRate: number;
    perMileRate: number;
    internalFuelCostPerMile: number;
    internalTruckCostPerLoadPercent: number;
    overheadAllocationFlat: number;
  };
  operatingBases: Array<{
    id: string;
    name: string;
    address?: string;
    city: string;
    state: string;
    zip?: string;
    location: { lat: number; lng: number };
    isPrimary: boolean;
    placeId?: string;
    formattedAddress?: string;
  }>;
};

/** @deprecated Use morrisConfig — kept for gradual migration */
export const MORRIS_COMPANY = morrisConfig;

export type MorrisConfig = typeof morrisConfig;
