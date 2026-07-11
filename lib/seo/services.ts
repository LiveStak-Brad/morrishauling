/** High-value service pages — quality over quantity. */

export type MarketingService = {
  slug: string;
  division: "junk_removal" | "hauling";
  name: string;
  shortName: string;
  title: string;
  description: string;
  whoFor: string[];
  included: string[];
  needed: string[];
  pricingFactors: string[];
  restrictions: string[];
  process: string[];
  related: string[];
  faqs: Array<{ q: string; a: string }>;
  imageKey: string;
};

export const JUNK_SERVICES: MarketingService[] = [
  {
    slug: "furniture-removal",
    division: "junk_removal",
    name: "Furniture Removal",
    shortName: "Furniture",
    title: "Furniture Removal in Missouri | Morris Junk Removal",
    description:
      "Couch, mattress, dresser, and household furniture removal with photo estimates. Serving Warren, Lincoln, St. Charles and nearby counties.",
    whoFor: ["Homeowners clearing rooms", "Landlords after move-outs", "Estate and downsizing projects"],
    included: ["Labor to remove listed furniture", "Loading and haul-away", "Responsible disposal or donation routing when appropriate"],
    needed: ["Photos of each item", "Floor and access notes (stairs, elevators, long carry)", "Whether items are disassembled"],
    pricingFactors: ["Item count and size", "Access difficulty", "Volume relative to a full load"],
    restrictions: ["Hazardous materials are not accepted", "Items must be accessible on the scheduled visit"],
    process: ["Request an estimate with photos", "Approve the estimate", "We arrive in your window and remove the listed items"],
    related: ["mattress-removal", "appliance-removal", "garage-cleanouts"],
    imageKey: "clean-living-room",
    faqs: [
      {
        q: "Do you remove a single couch or mattress?",
        a: "Yes. Single-item pickups are available. Pricing reflects travel, labor, and disposal — not only the item itself.",
      },
      {
        q: "Do I need to disassemble furniture?",
        a: "If an item will not fit through doorways assembled, note that in your request. We can discuss options before the visit.",
      },
    ],
  },
  {
    slug: "appliance-removal",
    division: "junk_removal",
    name: "Appliance Removal",
    shortName: "Appliances",
    title: "Appliance Removal | Morris Junk Removal",
    description:
      "Refrigerator, washer, dryer, stove, and appliance haul-away with clear estimates for Missouri homeowners and property managers.",
    whoFor: ["Home remodel projects", "Landlord turnovers", "Appliance replacements"],
    included: ["Disconnect verification notes (you handle utilities when required)", "Carry-out and loading", "Haul-away and disposal routing"],
    needed: ["Photos and model/size if known", "Whether units are empty and unplugged", "Stairs or tight access"],
    pricingFactors: ["Weight and size", "Stair carries", "Number of appliances"],
    restrictions: ["Freon recovery rules may apply to some units — we follow facility requirements", "Units should be empty and ready to move"],
    process: ["Upload photos", "Approve estimate", "Have appliances ready on arrival"],
    related: ["furniture-removal", "garage-cleanouts", "commercial-cleanouts"],
    imageKey: "appliance-kitchen-ready",
    faqs: [
      {
        q: "Do you unhook appliances?",
        a: "Gas, water, and hardwired electrical disconnects should be completed by a qualified person before our arrival unless we agree otherwise in writing.",
      },
    ],
  },
  {
    slug: "mattress-removal",
    division: "junk_removal",
    name: "Mattress Removal",
    shortName: "Mattresses",
    title: "Mattress Removal | Morris Junk Removal",
    description:
      "Mattress and box spring removal for homes and rentals across Warren County and nearby Missouri communities.",
    whoFor: ["Households replacing bedding", "Rental turnovers", "Estate cleanouts"],
    included: ["Removal of mattress and box spring as listed", "Haul-away"],
    needed: ["Photos", "Count of pieces", "Floor and access notes"],
    pricingFactors: ["Number of pieces", "Access", "Whether bundled with other junk"],
    restrictions: ["Heavily soiled items may have facility restrictions"],
    process: ["Request estimate", "Approve", "We remove on the scheduled visit"],
    related: ["furniture-removal", "estate-cleanouts"],
    imageKey: "organized-moving-boxes",
    faqs: [
      {
        q: "Can you take mattresses with other junk?",
        a: "Yes. Combining items into one visit is usually more efficient than multiple trips.",
      },
    ],
  },
  {
    slug: "garage-cleanouts",
    division: "junk_removal",
    name: "Garage Cleanouts",
    shortName: "Garage Cleanouts",
    title: "Garage Cleanouts | Morris Junk Removal",
    description:
      "Garage cleanouts for tools, furniture, sports gear, and general clutter — photo estimates before we schedule.",
    whoFor: ["Homeowners reclaiming space", "Move preparation", "Property sales"],
    included: ["Labor to clear listed items", "Sorting for donation/recycling when practical", "Haul-away"],
    needed: ["Wide photos of the garage", "Notes on what stays", "Gate or driveway access"],
    pricingFactors: ["Volume", "Heavy items", "How much sorting is required on site"],
    restrictions: ["Paint, chemicals, and other household hazardous waste may be excluded"],
    process: ["Send photos", "Approve estimate", "Clear a path; we load and haul"],
    related: ["basement-attic-cleanouts", "estate-cleanouts", "furniture-removal"],
    imageKey: "garage-cleanout-residential",
    faqs: [
      {
        q: "Do you take everything in the garage?",
        a: "We remove what you list and show in photos. Mark keepers clearly so nothing wanted leaves by mistake.",
      },
    ],
  },
  {
    slug: "estate-cleanouts",
    division: "junk_removal",
    name: "Estate Cleanouts",
    shortName: "Estate Cleanouts",
    title: "Estate Cleanouts | Morris Junk Removal",
    description:
      "Respectful estate and downsizing cleanouts in Warren, Lincoln, St. Charles and nearby Missouri counties.",
    whoFor: ["Families settling estates", "Downsizing moves", "Executor-managed properties"],
    included: ["Room-by-room clear-outs as scoped", "Donation/recycling routing when appropriate", "Final sweep of listed areas"],
    needed: ["Photos by room", "Decision-maker on site or reachable", "What must be preserved"],
    pricingFactors: ["Home size and volume", "Stairs", "Number of visits if phased"],
    restrictions: ["We do not appraise antiques", "Hazardous materials follow facility rules"],
    process: ["Walkthrough via photos or on-site notes", "Written estimate", "Scheduled clear-out"],
    related: ["garage-cleanouts", "basement-attic-cleanouts", "furniture-removal"],
    imageKey: "midwest-home-exterior",
    faqs: [
      {
        q: "Can you work in phases?",
        a: "Yes. Many estate jobs are scoped room-by-room or visit-by-visit so families can decide what stays.",
      },
    ],
  },
  {
    slug: "basement-attic-cleanouts",
    division: "junk_removal",
    name: "Basement & Attic Cleanouts",
    shortName: "Basement & Attic",
    title: "Basement and Attic Cleanouts | Morris Junk Removal",
    description:
      "Basement and attic junk removal with honest pricing for stairs, low clearance, and heavy items.",
    whoFor: ["Homeowners", "Buyers preparing a sale", "Rental properties"],
    included: ["Removal of listed items", "Carry from basement/attic as scoped", "Haul-away"],
    needed: ["Photos showing access", "Stair width notes", "Lighting and path clearance"],
    pricingFactors: ["Stairs and carry distance", "Volume", "Heavy or awkward items"],
    restrictions: ["Unsafe structures or collapsed storage may need owner remediation first"],
    process: ["Photo estimate", "Approve", "Clear paths before arrival"],
    related: ["garage-cleanouts", "estate-cleanouts"],
    imageKey: "organized-moving-boxes",
    faqs: [
      {
        q: "Do stairs change the price?",
        a: "Often yes. Access is a real labor factor — we ask for photos so the estimate reflects the work.",
      },
    ],
  },
  {
    slug: "commercial-cleanouts",
    division: "junk_removal",
    name: "Commercial Property Cleanouts",
    shortName: "Commercial Cleanouts",
    title: "Commercial Property Cleanouts | Morris Junk Removal",
    description:
      "Commercial and landlord cleanouts for offices, retail, and rental turnovers in our Missouri service area.",
    whoFor: ["Property managers", "Landlords", "Small businesses"],
    included: ["Scoped debris and furniture removal", "Scheduled windows", "Haul-away"],
    needed: ["Access instructions", "Photos", "Certificate of insurance requests if required"],
    pricingFactors: ["Volume", "After-hours needs", "Parking and dock access"],
    restrictions: ["Industrial hazardous waste is out of scope"],
    process: ["Request estimate", "Approve scope", "We complete and document as agreed"],
    related: ["construction-debris-removal", "storage-unit-cleanouts"],
    imageKey: "construction-materials-site",
    faqs: [
      {
        q: "Can you work after hours?",
        a: "Sometimes. Note preferred windows when you request an estimate and we will confirm availability.",
      },
    ],
  },
  {
    slug: "storage-unit-cleanouts",
    division: "junk_removal",
    name: "Storage Unit Cleanouts",
    shortName: "Storage Units",
    title: "Storage Unit Cleanouts | Morris Junk Removal",
    description:
      "Storage unit cleanouts and haul-away when you are done with the unit — photo estimates before we schedule.",
    whoFor: ["Unit renters ending leases", "Estate cleanups", "Downsizing"],
    included: ["Clear-out of listed contents", "Haul-away"],
    needed: ["Facility access rules", "Photos", "Unit number and gate codes when applicable"],
    pricingFactors: ["Unit size/volume", "Carry distance", "Facility time limits"],
    restrictions: ["Facility rules always apply"],
    process: ["Photos + access notes", "Estimate", "Scheduled clear-out"],
    related: ["estate-cleanouts", "garage-cleanouts"],
    imageKey: "organized-moving-boxes",
    faqs: [
      {
        q: "Do you sweep the unit?",
        a: "We remove listed contents. A broom-clean finish can be included when scoped in the estimate.",
      },
    ],
  },
  {
    slug: "construction-debris-removal",
    division: "junk_removal",
    name: "Construction Debris Removal",
    shortName: "Construction Debris",
    title: "Construction Debris Removal | Morris Junk Removal",
    description:
      "Construction and remodel debris removal for small jobs and property cleanups in our Missouri service area.",
    whoFor: ["Home remodelers", "Handymen", "Property managers"],
    included: ["Removal of listed debris", "Haul-away to appropriate facilities"],
    needed: ["Photos", "Material types", "Site access"],
    pricingFactors: ["Volume and weight", "Material type", "Load access"],
    restrictions: ["Some materials require specific facilities", "Hazardous construction waste may be excluded"],
    process: ["Describe materials with photos", "Approve estimate", "We load and dispose properly"],
    related: ["commercial-cleanouts", "hot-tub-shed-removal"],
    imageKey: "construction-materials-site",
    faqs: [
      {
        q: "Do you take drywall and lumber?",
        a: "Often yes, when facilities accept them. Tell us the material mix so we route correctly.",
      },
    ],
  },
  {
    slug: "hot-tub-shed-removal",
    division: "junk_removal",
    name: "Hot Tub & Shed Removal",
    shortName: "Hot Tubs & Sheds",
    title: "Hot Tub and Shed Removal | Morris Junk Removal",
    description:
      "Hot tub and small shed removal with access and weight reviewed before we confirm the job.",
    whoFor: ["Homeowners", "Property sales prep"],
    included: ["Removal as scoped", "Debris haul-away"],
    needed: ["Photos", "Gate width", "Whether drained/disconnected", "Surface type"],
    pricingFactors: ["Weight", "Access", "Disassembly needs"],
    restrictions: ["Large structures may need specialty equipment we do not provide", "Manual review for heavy units"],
    process: ["Photos and measurements", "Estimate with review notes", "Scheduled removal"],
    related: ["construction-debris-removal", "garage-cleanouts"],
    imageKey: "midwest-home-exterior",
    faqs: [
      {
        q: "Do you demolish sheds?",
        a: "Light shed tear-down may be available when scoped. Structural demolition beyond our capacity is declined rather than forced.",
      },
    ],
  },
];

export const HAULING_SERVICES: MarketingService[] = [
  {
    slug: "vehicle-transport",
    division: "hauling",
    name: "Vehicle Transport",
    shortName: "Vehicles",
    title: "Vehicle Transport | Morris Hauling",
    description:
      "Local vehicle transport for cars and light vehicles when the load fits our equipment — with manual review for non-running units.",
    whoFor: ["Private owners", "Shops", "Dealers needing local moves"],
    included: ["Scheduled pickup and delivery", "Securement as scoped"],
    needed: ["Running status", "Dimensions/weight", "Pickup and delivery addresses", "Photos"],
    pricingFactors: ["Miles", "Equipment required", "Loading assistance", "Urgency"],
    restrictions: ["Not every vehicle or trailer combination is available", "Interstate moves may be declined or reviewed"],
    process: ["Submit load details", "Manual review if needed", "Confirm and schedule"],
    related: ["equipment-hauling", "machinery-transport"],
    imageKey: "contractor-equipment-yard",
    faqs: [
      {
        q: "Can you haul a vehicle that does not run?",
        a: "Sometimes, with winch or specialty loading. Tell us early — we review before confirming.",
      },
    ],
  },
  {
    slug: "equipment-hauling",
    division: "hauling",
    name: "Equipment Hauling",
    shortName: "Equipment",
    title: "Equipment Hauling | Morris Hauling",
    description:
      "Local equipment hauling for contractors and property owners across Warren County and nearby Missouri communities.",
    whoFor: ["Contractors", "Landscapers", "Property owners"],
    included: ["Transport between verified addresses", "Securement as scoped"],
    needed: ["Equipment type", "Weight and dimensions", "Loading method", "Photos"],
    pricingFactors: ["Miles", "Trailer type", "Load/unload help", "Access"],
    restrictions: ["Overweight or oversize loads may require permits we do not provide", "Manual review for specialized gear"],
    process: ["Share specs", "Review", "Schedule pickup and delivery"],
    related: ["skid-steer-transport", "tractor-mower-transport", "machinery-transport"],
    imageKey: "contractor-equipment-yard",
    faqs: [
      {
        q: "Do you provide a skid steer or forklift?",
        a: "We transport equipment — we do not supply loading machines unless separately arranged and confirmed.",
      },
    ],
  },
  {
    slug: "tractor-mower-transport",
    division: "hauling",
    name: "Tractor & Mower Transport",
    shortName: "Tractors & Mowers",
    title: "Tractor and Mower Transport | Morris Hauling",
    description:
      "Tractor, zero-turn, and mower transport for farms, landscapers, and homeowners in our Missouri service area.",
    whoFor: ["Farms", "Landscaping crews", "Equipment buyers/sellers"],
    included: ["Hauling as scoped", "Securement"],
    needed: ["Make/model if known", "Weight", "Width/height", "Ramp needs"],
    pricingFactors: ["Size/weight", "Miles", "Assistance needed"],
    restrictions: ["Very large ag equipment may exceed our capacity"],
    process: ["Send specs and photos", "Confirm fit", "Schedule"],
    related: ["equipment-hauling", "machinery-transport"],
    imageKey: "contractor-equipment-yard",
    faqs: [
      {
        q: "Can you haul a garden tractor?",
        a: "Yes, when dimensions and weight fit. Photos help us confirm the right trailer.",
      },
    ],
  },
  {
    slug: "skid-steer-transport",
    division: "hauling",
    name: "Skid-Steer Transport",
    shortName: "Skid-Steers",
    title: "Skid-Steer Transport | Morris Hauling",
    description:
      "Skid-steer and compact track loader transport with weight and width verified before we roll.",
    whoFor: ["Contractors", "Rental returns", "Jobsite moves"],
    included: ["Transport between stops", "Securement"],
    needed: ["Operating weight", "Width", "Trailer compatibility notes", "Photos"],
    pricingFactors: ["Weight class", "Miles", "Loading conditions"],
    restrictions: ["Overwidth loads may be declined", "Manual review required for heavier units"],
    process: ["Submit specs", "Review", "Confirm schedule"],
    related: ["equipment-hauling", "machinery-transport"],
    imageKey: "contractor-equipment-yard",
    faqs: [
      {
        q: "What if I do not know the exact weight?",
        a: "Provide the model or a best estimate. We would rather verify than guess wrong on capacity.",
      },
    ],
  },
  {
    slug: "machinery-transport",
    division: "hauling",
    name: "Machinery Transport",
    shortName: "Machinery",
    title: "Machinery Transport | Morris Hauling",
    description:
      "Local machinery transport with honest capacity limits and manual review for specialized loads.",
    whoFor: ["Shops", "Contractors", "Industrial light moves"],
    included: ["Hauling as confirmed", "Securement"],
    needed: ["Dimensions", "Weight", "Lift points / loading plan", "Photos"],
    pricingFactors: ["Equipment class", "Miles", "Special handling"],
    restrictions: ["We do not claim to move every machine", "Permits and escorts are customer responsibilities when required"],
    process: ["Detail the load", "Manual review", "Accept or decline clearly"],
    related: ["equipment-hauling", "vehicle-transport"],
    imageKey: "construction-materials-site",
    faqs: [
      {
        q: "Do you haul interstate?",
        a: "Some routes may be possible; many are not. Ask with origin, destination, and load specs — we review case by case.",
      },
    ],
  },
  {
    slug: "building-material-delivery",
    division: "hauling",
    name: "Building Material Delivery",
    shortName: "Materials",
    title: "Building Material Delivery | Morris Hauling",
    description:
      "Building material delivery for contractors and property projects — lumber, stone, and jobsite supplies when the load fits.",
    whoFor: ["Contractors", "Remodelers", "Property owners"],
    included: ["Pickup and delivery as scoped", "Securement"],
    needed: ["Material list", "Weight estimate", "Site access", "Unload expectations"],
    pricingFactors: ["Miles", "Weight", "Wait time", "Multi-stop routes"],
    restrictions: ["We are not a big-box delivery substitute for every SKU", "Unload help must be arranged if needed"],
    process: ["Describe materials and stops", "Confirm", "Deliver on schedule"],
    related: ["contractor-delivery", "multi-stop-hauling"],
    imageKey: "construction-materials-site",
    faqs: [
      {
        q: "Will you carry materials upstairs?",
        a: "Only when scoped. Default is curb or driveway delivery unless labor is included in the estimate.",
      },
    ],
  },
  {
    slug: "contractor-delivery",
    division: "hauling",
    name: "Contractor Delivery",
    shortName: "Contractor Delivery",
    title: "Contractor Delivery | Morris Hauling",
    description:
      "Contractor delivery and jobsite logistics for local Missouri crews who need reliable short-haul transport.",
    whoFor: ["Trade contractors", "General contractors", "Property maintenance teams"],
    included: ["Scheduled hauls", "Verified addresses"],
    needed: ["Stop list", "Time windows", "Load description"],
    pricingFactors: ["Stops", "Miles", "Wait time", "Equipment"],
    restrictions: ["Same-day is not guaranteed", "Capacity limits apply"],
    process: ["Send the route and load", "Confirm", "Execute"],
    related: ["building-material-delivery", "multi-stop-hauling"],
    imageKey: "construction-materials-site",
    faqs: [
      {
        q: "Can you run recurring weekly routes?",
        a: "Ask us. Recurring work is possible when capacity allows — it is not automatic.",
      },
    ],
  },
  {
    slug: "multi-stop-hauling",
    division: "hauling",
    name: "Multi-Stop Local Hauling",
    shortName: "Multi-Stop",
    title: "Multi-Stop Local Hauling | Morris Hauling",
    description:
      "Multi-stop local hauling with verified addresses and clear sequencing for Missouri job sites.",
    whoFor: ["Contractors", "Property managers", "Equipment moves with multiple drops"],
    included: ["Planned stop order", "Transport between verified places"],
    needed: ["Each address", "What loads where", "Time constraints"],
    pricingFactors: ["Stop count", "Miles", "Dwell time"],
    restrictions: ["Unverified addresses are not accepted", "Re-routing mid-day may change price"],
    process: ["List stops", "Confirm plan", "Run the route"],
    related: ["contractor-delivery", "building-material-delivery"],
    imageKey: "contractor-equipment-yard",
    faqs: [
      {
        q: "Why do you verify every address?",
        a: "Wrong pins waste crew time and create unsafe turns. Verified places keep the job honest.",
      },
    ],
  },
];

export const ALL_MARKETING_SERVICES = [...JUNK_SERVICES, ...HAULING_SERVICES];

export function getService(division: "junk_removal" | "hauling", slug: string) {
  return ALL_MARKETING_SERVICES.find((s) => s.division === division && s.slug === slug);
}

export function servicesForDivision(division: "junk_removal" | "hauling") {
  return ALL_MARKETING_SERVICES.filter((s) => s.division === division);
}
