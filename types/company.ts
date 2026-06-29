// @supabase-table: companies

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export interface ServiceArea {
  center: LatLng;
  radiusMiles: number;
  zipCodes?: string[];
  /** Display label, e.g. "Warren, Lincoln & St. Charles Counties" */
  label?: string;
}

export interface LoadTierPricing {
  tier: string;
  label: string;
  trailerPercent: number;
  basePrice: number;
}

export interface PricingModifier {
  id: string;
  label: string;
  amount: number;
  type: "flat" | "percent";
}

export interface PricingRules {
  loadTiers: LoadTierPricing[];
  modifiers: PricingModifier[];
  minCharge: number;
  dumpFee: number;
  itemSurcharge?: number;
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface PaymentOptionsConfig {
  depositPercent: number;
  depositMinAmount: number;
  methods: ("card" | "cash_on_arrival" | "invoice" | "financing")[];
  allowPayAfterCompletion: boolean;
}

export interface FinancingOptionsConfig {
  inHouseEnabled: boolean;
  thirdPartyProviders: (
    | "klarna"
    | "affirm"
    | "afterpay"
    | "stripe_link"
    | "square"
    | "paypal"
  )[];
}

export interface Truck {
  id: string;
  name: string;
  licensePlate: string;
  capacity?: string;
}

export interface Trailer {
  id: string;
  name: string;
  capacityPercent: number;
  licensePlate: string;
}

export interface DumpSite {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  feePerLoad?: number;
}

export interface CompanyEmployee {
  id: string;
  name: string;
  role: "driver" | "helper" | "lead";
  phone: string;
}

export interface CompanyConfig {
  companyId: string;
  companyName: string;
  logo: string;
  /** Optional hero / marketing banner image */
  heroBanner?: string;
  phone: string;
  email: string;
  website: string;
  serviceArea: ServiceArea;
  brandColors: BrandColors;
  pricingRules: PricingRules;
  services: ServiceOffering[];
  estimateDisclaimer: string;
  paymentOptions: PaymentOptionsConfig;
  financingOptions: FinancingOptionsConfig;
  employees: CompanyEmployee[];
  trucks: Truck[];
  trailers: Trailer[];
  dumpSites: DumpSite[];
  yardLocation?: LatLng;
}
