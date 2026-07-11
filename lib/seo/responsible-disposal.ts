/**
 * Honest responsible-disposal copy for Morris Junk Removal marketing.
 * No diversion rates, zero-waste claims, or guaranteed donation/recycling.
 */

export const RESPONSIBLE_DISPOSAL_PRINCIPLE =
  "Morris Junk Removal prioritizes recycling, donation, reuse, and appropriate disposal whenever practical and available.";

export const RESPONSIBLE_DISPOSAL_SUMMARY =
  "Whenever possible, we sort items for donation, reuse, or recycling before sending remaining material to an appropriate disposal facility. Final handling depends on item condition, contamination, local facility availability, and applicable rules.";

export const RESPONSIBLE_DISPOSAL_HOMEPAGE_HEADING = "We Do More Than Haul It Away";

export const RESPONSIBLE_DISPOSAL_HOMEPAGE_BODY =
  "We look for practical opportunities to donate usable items, recycle recoverable materials, and route specialty items to appropriate facilities. When reuse or recycling is not available, we use suitable disposal options based on the material and local requirements.";

export const MAY_BE_RECYCLED = [
  "Scrap metal",
  "Certain appliances (facility rules apply)",
  "Cardboard",
  "Clean wood",
  "Yard waste where accepted",
  "Electronics where an e-waste facility accepts them",
  "Concrete, brick, and asphalt where accepted",
  "Tires through appropriate tire facilities",
  "Batteries through appropriate collection points",
  "Selected plastics and paper products when facilities accept them",
] as const;

export const MAY_BE_DONATED = [
  "Clean furniture in usable condition",
  "Working appliances when accepted",
  "Usable household goods",
  "Tools in working condition",
  "Building materials when a receiver accepts them",
  "Office furniture in usable condition",
  "Storage items in usable condition",
] as const;

export const MAY_REQUIRE_DISPOSAL = [
  "Contamination (food waste, chemicals, mixed liquids)",
  "Mold or severe water damage",
  "Pest exposure",
  "Severe damage that prevents reuse",
  "Mixed materials that cannot be separated practically",
  "Facility restrictions or capacity limits",
  "Hazardous characteristics we cannot accept or must route specially",
  "No practical receiving option for donation or recycling that day",
] as const;

export const RESPONSIBLE_DISPOSAL_FAQS = [
  {
    q: "Do you recycle everything you remove?",
    a: "No. We prioritize recycling, donation, and reuse whenever practical and available, but not every item can be recycled. Condition, contamination, and local facility rules determine what is possible on each job.",
  },
  {
    q: "Can usable furniture be donated?",
    a: "Sometimes. Donation depends on condition, demand, facility or organization rules, and available receiving partners. Clean, usable furniture has a better chance than damaged or contaminated pieces.",
  },
  {
    q: "What happens to appliances?",
    a: "Appliances may go to metal recycling, specialty handling (including refrigerant rules when required), or appropriate disposal depending on type and condition. Tell us the appliance type when you request an estimate.",
  },
  {
    q: "Do you recycle electronics?",
    a: "When an appropriate e-waste option is available and the items are accepted, we route electronics accordingly. Acceptance varies by facility — identify electronics in your estimate request.",
  },
  {
    q: "Can construction debris be recycled?",
    a: "Clean, separated materials such as wood, metal, concrete, or cardboard may have recycling options. Mixed debris often needs different handling. Separating materials in advance helps.",
  },
  {
    q: "What happens if an item cannot be recycled?",
    a: "We use an appropriate disposal facility for that material. We do not claim zero-waste or landfill-free outcomes.",
  },
  {
    q: "Can customers request donation or recycling?",
    a: "Yes — tell us in your estimate request which items you hope to donate or recycle. We will be honest about what is realistic based on condition and local options.",
  },
  {
    q: "Does recycling affect the price?",
    a: "Pricing is based on labor, volume, access, travel, and handling requirements. Specialty routing can affect cost when extra stops, fees, or handling are required. We explain material-related fees in the estimate when they apply.",
  },
] as const;

/** Per-service honest notes — vary by material type; do not copy-paste. */
export const SERVICE_RESPONSIBLE_DISPOSAL: Record<string, string> = {
  "furniture-removal":
    "Usable furniture may be considered for donation where accepted; damaged, stained, or contaminated furniture may require disposal. Final handling depends on condition and available receivers.",
  "appliance-removal":
    "Appliances may require metal recycling, refrigerant handling, or specialty disposal depending on type and condition. Identify freon appliances and whether units are empty when you request an estimate.",
  "mattress-removal":
    "Mattresses and box springs are often facility-restricted. Some locations accept them for recycling or specialty disposal; heavily soiled pieces may have fewer options.",
  "garage-cleanouts":
    "Garage loads often mix scrap metal, cardboard, usable goods, and general junk. We sort for donation or recycling when practical; mixed or contaminated piles may limit what can be diverted.",
  "estate-cleanouts":
    "Estate jobs can include donation-ready household goods alongside items that need disposal. We evaluate condition on site and route materials based on what local partners and facilities will accept.",
  "basement-attic-cleanouts":
    "Basement and attic items may include salvageable goods plus moldy, pest-exposed, or water-damaged material that cannot be donated. Tell us about moisture or pest history when requesting an estimate.",
  "commercial-cleanouts":
    "Commercial cleanouts may include office furniture, fixtures, cardboard, and mixed debris. Usable office furniture may be donation candidates; mixed demolition-style debris often needs different handling.",
  "storage-unit-cleanouts":
    "Storage units vary widely — some hold reusable goods, others hold damaged or mixed waste. We sort when practical; abandoned or contaminated contents may require disposal.",
  "construction-debris-removal":
    "Clean wood, metal, concrete, cardboard, and other separated materials may have recycling options. Mixed debris may need different handling. Separating materials before pickup improves routing options.",
  "hot-tub-shed-removal":
    "Hot tubs and sheds often involve mixed materials (plastic, wood, metal, foam). Components may be separated for scrap or disposal when practical; intact donation is uncommon.",
};

export const HOW_MATERIALS_ARE_EVALUATED = [
  {
    title: "Condition and contamination",
    body: "We look at whether an item is clean, intact, and safe to handle. Mold, pests, severe damage, or chemical contamination usually limit donation and recycling options.",
  },
  {
    title: "Material type",
    body: "Metal, cardboard, clean wood, yard waste, electronics, appliances, and mixed household junk follow different facility rules. Specialty items may need dedicated receivers.",
  },
  {
    title: "Local facility availability",
    body: "Acceptance changes by facility, day, and load type. We select appropriate licensed facilities based on the materials collected — not a single one-size-fits-all dump.",
  },
  {
    title: "Customer identification in advance",
    body: "Photos and notes about reusable goods, electronics, appliances, batteries, tires, paint, chemicals, or separated construction/yard waste help us plan routing before we arrive.",
  },
] as const;
