/** Public marketing copy — operational businesses. */

export const SERVICE_AREA = "Warren, Lincoln & St. Charles Counties, MO";

/** @deprecated Use SERVICE_AREA */
export const PRELAUNCH_SERVICE_AREA = SERVICE_AREA;

export const HAULING_INTRO =
  "Morris Junk Removal and Morris Hauling operate under Morris Services — professional local crews for clear-outs and transport.";

/** @deprecated */
export const PRELAUNCH_HAULING_INTRO = HAULING_INTRO;

export const SCHEDULING_NOTE =
  "Book a morning, afternoon, or flexible window. We confirm capacity against crew, truck, and trailer availability.";

/** @deprecated */
export const PRELAUNCH_SCHEDULING_NOTE = SCHEDULING_NOTE;

/** @deprecated Preview mode removed */
export const BOOKING_PREVIEW_BANNER = "";

export const PRICING_NOTE =
  "Estimates show volume, labor, and disposal clearly before you approve. Final price may adjust if the job scope changes on site.";

/** @deprecated */
export const PRELAUNCH_PRICING_NOTE = PRICING_NOTE;

export const SERVICES_INTRO =
  "Professional junk removal, property cleanouts, and hauling for homes and businesses across our service area.";

/** @deprecated */
export const PRELAUNCH_SERVICES_INTRO = SERVICES_INTRO;

export const CAREERS_NOTE =
  "Morris Services is hiring for Junk Removal and Hauling. Apply to join a crew that treats every property with care.";

/** @deprecated */
export const PRELAUNCH_CAREERS_NOTE = CAREERS_NOTE;

export const CAREERS_PAY_NOTE =
  "Pay ranges reflect current openings and may vary by role, experience, and schedule.";

/** @deprecated */
export const PRELAUNCH_CAREERS_PAY_NOTE = CAREERS_PAY_NOTE;

/** @deprecated Founding-era invite removed for operational launch */
export const FOUNDING_INVITE =
  "Book online or call — we are accepting customers for Junk Removal and Hauling.";

export const HAULING_PROTOCOL = [
  {
    step: "01",
    title: "Tell us the space",
    description: "Share what needs to go — photos welcome. We scope the job before a truck rolls.",
  },
  {
    step: "02",
    title: "See a clear price",
    description: "Understand volume, labor, and disposal before you commit. No surprise pile-ons.",
  },
  {
    step: "03",
    title: "Pick your window",
    description: "Choose morning, afternoon, or flexible. We protect capacity so windows mean something.",
  },
  {
    step: "04",
    title: "We clear it with care",
    description: "Shoe covers, careful loading, respectful crews. Your home stays a home.",
  },
  {
    step: "05",
    title: "Space restored",
    description: "Walk the site with us. Know what was donated, recycled, or disposed — then breathe.",
  },
] as const;

export const MORRIS_STANDARD_PILLARS = [
  {
    title: "Proof over promises",
    description: "Photos, protocols, and clear pricing — not vague guarantees.",
  },
  {
    title: "One relationship",
    description: "A Morris account that grows with every craft we add under the seal.",
  },
  {
    title: "Hospitality in the last mile",
    description: "The website books the job. The crew is the brand.",
  },
] as const;

export const JUNK_REMOVAL_SERVICES = [
  "Residential Junk Removal",
  "Commercial Junk Removal",
  "Estate Cleanouts",
  "Garage Cleanouts",
  "Storage Units",
  "Foreclosures",
  "Furniture Removal",
  "Appliance Removal",
  "Hot Tub Removal",
  "Construction Debris",
  "Full Property Cleanouts",
] as const;

export const HAULING_DIVISION_SERVICES = [
  "Equipment Hauling",
  "Material Delivery",
  "Trailer Transport",
  "Machinery Transport",
  "Building Materials",
  "General Freight",
  "Scheduled Transport",
  "Contractor Deliveries",
] as const;
