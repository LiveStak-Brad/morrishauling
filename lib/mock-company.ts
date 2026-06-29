import type { CompanyConfig } from "@/types";

export const DEFAULT_ESTIMATE_DISCLAIMER =
  "This is an estimate based on the information provided. Final price may change after on-site review due to weight, volume, stairs, walking distance, access issues, special disposal fees, labor time, dump fees, or additional items.";

const DEFAULT_LOAD_TIERS = [
  { tier: "min_10", label: "Minimum pickup (10%)", trailerPercent: 10, basePrice: 99 },
  { tier: "quarter_25", label: "1/4 load (25%)", trailerPercent: 25, basePrice: 199 },
  { tier: "half_50", label: "1/2 load (50%)", trailerPercent: 50, basePrice: 349 },
  { tier: "three_quarter_75", label: "3/4 load (75%)", trailerPercent: 75, basePrice: 499 },
  { tier: "full_100", label: "Full load (100%)", trailerPercent: 100, basePrice: 599 },
  { tier: "multi_150", label: "Multiple loads (150%+)", trailerPercent: 150, basePrice: 899 },
];

const DEFAULT_MODIFIERS = [
  { id: "stairs", label: "Stairs", amount: 50, type: "flat" as const },
  { id: "elevator", label: "Elevator access", amount: -25, type: "flat" as const },
  { id: "long_carry", label: "Long carry (50+ ft)", amount: 75, type: "flat" as const },
  { id: "basement", label: "Basement", amount: 40, type: "flat" as const },
  { id: "attic", label: "Attic", amount: 60, type: "flat" as const },
  { id: "tight_access", label: "Tight access", amount: 50, type: "flat" as const },
  { id: "heavy_items", label: "Heavy items", amount: 100, type: "flat" as const },
  { id: "special_disposal", label: "Special disposal", amount: 150, type: "flat" as const },
];

export const MORRIS_COMPANY: CompanyConfig = {
  companyId: "morris-hauling",
  companyName: "Morris Hauling & Junk Removal",
  logo: "/logo.png",
  heroBanner: "/banner.png",
  phone: "(636) 751-4645",
  email: "info@morrisjunk.com",
  website: "https://morrisjunk.com",
  serviceArea: {
    center: { lat: 38.788, lng: -90.497 },
    radiusMiles: 45,
    label: "Warren, Lincoln & St. Charles Counties",
    zipCodes: ["63301", "63303", "63304", "63376", "63383", "63379", "63390"],
  },
  brandColors: {
    primary: "#9B1B30",
    secondary: "#0A0A0A",
    accent: "#374151",
    background: "#FAFAFA",
    foreground: "#0A0A0A",
  },
  pricingRules: {
    loadTiers: DEFAULT_LOAD_TIERS,
    modifiers: DEFAULT_MODIFIERS,
    minCharge: 99,
    dumpFee: 45,
    itemSurcharge: 15,
  },
  services: [
    { id: "residential", name: "Residential Junk Removal", description: "Garage cleanouts, attic hauls, and home decluttering." },
    { id: "commercial", name: "Commercial Cleanouts", description: "Office furniture, retail debris, and property turnovers." },
    { id: "estate", name: "Estate Cleanouts", description: "Compassionate full-property cleanouts with careful sorting." },
    { id: "construction", name: "Construction Debris", description: "Drywall, lumber, and renovation debris removal." },
    { id: "appliance", name: "Appliance Removal", description: "Refrigerators, washers, dryers, and large appliances." },
    { id: "yard", name: "Yard Waste", description: "Branches, brush, and outdoor debris hauling." },
  ],
  estimateDisclaimer: DEFAULT_ESTIMATE_DISCLAIMER,
  paymentOptions: {
    depositPercent: 25,
    depositMinAmount: 50,
    methods: ["card", "cash_on_arrival", "invoice", "financing"],
    allowPayAfterCompletion: true,
  },
  financingOptions: {
    inHouseEnabled: true,
    thirdPartyProviders: ["klarna", "affirm", "stripe_link", "square", "paypal"],
  },
  employees: [
    { id: "emp-m1", name: "James Morris", role: "lead", phone: "(636) 751-4645" },
    { id: "emp-m2", name: "Marcus Webb", role: "driver", phone: "(636) 751-4646" },
    { id: "emp-m3", name: "Tyler Brooks", role: "helper", phone: "(636) 751-4647" },
    { id: "emp-m4", name: "Dana Chen", role: "helper", phone: "(636) 751-4648" },
  ],
  trucks: [
    { id: "truck-m1", name: "Truck 1", licensePlate: "MO-JNK01", capacity: "26 ft box" },
    { id: "truck-m2", name: "Truck 2", licensePlate: "MO-JNK02", capacity: "20 ft box" },
  ],
  trailers: [
    { id: "trailer-m1", name: "Trailer Alpha", capacityPercent: 100, licensePlate: "MO-TRL01" },
    { id: "trailer-m2", name: "Trailer Beta", capacityPercent: 100, licensePlate: "MO-TRL02" },
  ],
  dumpSites: [
    { id: "dump-m1", name: "St. Charles Transfer Station", address: "1200 Transfer Rd, St. Charles, MO", location: { lat: 38.79, lng: -90.52 }, feePerLoad: 45 },
    { id: "dump-m2", name: "Warren County Disposal", address: "800 Industrial Dr, Warrenton, MO", location: { lat: 38.81, lng: -91.14 }, feePerLoad: 40 },
    { id: "dump-m3", name: "Lincoln County Recycling", address: "450 County Rd, Troy, MO", location: { lat: 38.98, lng: -90.98 }, feePerLoad: 35 },
  ],
  yardLocation: { lat: 38.785, lng: -90.505 },
};

export const GREENBIN_COMPANY: CompanyConfig = {
  companyId: "greenbin-junk",
  companyName: "GreenBin Junk Pros",
  logo: "/logos/greenbin.svg",
  phone: "(704) 555-0199",
  email: "hello@greenbinjunk.com",
  website: "https://greenbinjunk.com",
  serviceArea: {
    center: { lat: 35.227, lng: -80.843 },
    radiusMiles: 30,
    zipCodes: ["28202", "28203", "28204", "28205"],
  },
  brandColors: {
    primary: "#16A34A",
    secondary: "#1E3A5F",
    accent: "#86EFAC",
    background: "#FFFFFF",
    foreground: "#1E3A5F",
  },
  pricingRules: {
    loadTiers: DEFAULT_LOAD_TIERS.map((t) => ({ ...t, basePrice: Math.round(t.basePrice * 1.15) })),
    modifiers: DEFAULT_MODIFIERS.map((m) => ({ ...m, amount: Math.round(m.amount * 1.1) })),
    minCharge: 115,
    dumpFee: 50,
    itemSurcharge: 18,
  },
  services: [
    { id: "residential", name: "Home Cleanouts", description: "Fast residential junk hauling across Charlotte." },
    { id: "commercial", name: "Business Removal", description: "Office and retail cleanout services." },
    { id: "eco", name: "Eco Disposal", description: "Donation and recycling-first disposal approach." },
    { id: "furniture", name: "Furniture Hauling", description: "Couches, mattresses, and bulky furniture." },
  ],
  estimateDisclaimer: DEFAULT_ESTIMATE_DISCLAIMER,
  paymentOptions: {
    depositPercent: 20,
    depositMinAmount: 40,
    methods: ["card", "cash_on_arrival", "invoice", "financing"],
    allowPayAfterCompletion: true,
  },
  financingOptions: {
    inHouseEnabled: false,
    thirdPartyProviders: ["klarna", "affirm", "afterpay", "stripe_link"],
  },
  employees: [
    { id: "emp-g1", name: "Sarah Green", role: "lead", phone: "(704) 555-0201" },
    { id: "emp-g2", name: "Mike Torres", role: "driver", phone: "(704) 555-0202" },
  ],
  trucks: [
    { id: "truck-g1", name: "Green Hauler", licensePlate: "NC-GRN01", capacity: "24 ft box" },
  ],
  trailers: [
    { id: "trailer-g1", name: "Eco Trailer", capacityPercent: 100, licensePlate: "NC-TRL01" },
  ],
  dumpSites: [
    { id: "dump-g1", name: "Queen City Transfer", address: "500 Transfer Ln, Charlotte, NC", location: { lat: 35.21, lng: -80.83 }, feePerLoad: 50 },
    { id: "dump-g2", name: "Pineville Disposal", address: "200 Pine Rd, Pineville, NC", location: { lat: 35.08, lng: -80.89 }, feePerLoad: 42 },
  ],
  yardLocation: { lat: 35.22, lng: -80.84 },
};

export const COMPANIES: Record<string, CompanyConfig> = {
  [MORRIS_COMPANY.companyId]: MORRIS_COMPANY,
  [GREENBIN_COMPANY.companyId]: GREENBIN_COMPANY,
};

export const DEFAULT_COMPANY_ID = MORRIS_COMPANY.companyId;

export function getCompany(companyId: string): CompanyConfig {
  const company = COMPANIES[companyId];
  if (!company) throw new Error(`Company not found: ${companyId}`);
  return company;
}

export function listCompanies(): CompanyConfig[] {
  return Object.values(COMPANIES);
}
