/** Curated junk-removal guides — educate first, convert second. Quality over volume. */

export type AuthorityGuide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  summary: string;
  sections: Array<{ heading: string; body: string[] }>;
  relatedServices: string[];
  relatedGuides: string[];
  relatedItems?: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const AUTHORITY_GUIDES: AuthorityGuide[] = [
  {
    slug: "how-junk-removal-pricing-works",
    title: "How Junk Removal Pricing Works | Morris Junk Removal",
    h1: "How Junk Removal Pricing Works",
    description:
      "Plain-English explanation of junk removal pricing in Warren County and nearby Missouri — volume, labor, access, and disposal.",
    keywords: ["junk removal pricing", "junk removal cost Missouri", "how junk removal is priced"],
    summary:
      "Junk removal pricing is driven by how much you have, how hard it is to reach, and how materials must be handled — not a mystery flat fee for every job.",
    sections: [
      {
        heading: "What usually drives the price",
        body: [
          "Volume and weight class matter most. A few bags is different from a packed garage.",
          "Access changes labor: stairs, long carries, tight halls, and locked gates take more time.",
          "Special handling (appliances with refrigerant rules, electronics, tires, contaminated loads) can add routing or facility fees.",
          "Travel within our service area is built into local jobs; extended communities may include travel considerations disclosed up front.",
        ],
      },
      {
        heading: "Estimate vs final amount",
        body: [
          "Your online amount is an estimate based on photos and details you provide.",
          "If the on-site job matches what you showed us, the estimate holds.",
          "If there is more junk or harder access, we pause and review changes with you before continuing.",
        ],
      },
      {
        heading: "How to get a more accurate estimate",
        body: [
          "Upload wide photos of each area plus close-ups of heavy or awkward items.",
          "Note stairs, elevators, long driveway carries, and whether items are upstairs or in a basement.",
          "Call out electronics, freon appliances, batteries, tires, paint, or chemicals early.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "furniture-removal", "estate-cleanouts"],
    relatedGuides: ["photo-estimate-tips", "dumpster-vs-junk-removal", "prepare-for-junk-removal"],
    faqs: [
      {
        q: "Is there a minimum charge?",
        a: "Most jobs have a practical minimum because travel and crew time apply even for a single item. Your estimate shows the amount for your scope.",
      },
      {
        q: "Do you charge by the hour?",
        a: "We price primarily by volume, labor difficulty, and handling — not an open-ended hourly clock that surprises you mid-job.",
      },
    ],
  },
  {
    slug: "dumpster-vs-junk-removal",
    title: "Dumpster vs Junk Removal | Morris Junk Removal",
    h1: "Dumpster vs Junk Removal",
    description:
      "When a dumpster makes sense and when full-service junk removal is the better fit for Warren County homes and businesses.",
    keywords: ["dumpster vs junk removal", "junk removal or dumpster"],
    summary:
      "A dumpster is a container you fill. Junk removal is labor plus haul-away. The right choice depends on who loads, how long you need the space, and what materials you have.",
    sections: [
      {
        heading: "Choose a dumpster when",
        body: [
          "You (or your contractor) will load over several days.",
          "You have a long renovation and need a stationary container on site.",
          "You can meet placement rules for driveways, HOAs, and street permits.",
        ],
      },
      {
        heading: "Choose junk removal when",
        body: [
          "You want the crew to do the heavy lifting and leave the same day.",
          "You have mixed household items, furniture, or appliances that need sorting.",
          "You do not want a container sitting on your property.",
          "You need help from upstairs, basements, or tight access.",
        ],
      },
      {
        heading: "What Morris provides",
        body: [
          "Morris Junk Removal is full-service haul-away — not a dumpster rental company.",
          "If a dumpster is clearly the better tool for your project, we will say so rather than force a bad fit.",
        ],
      },
    ],
    relatedServices: ["construction-debris-removal", "garage-cleanouts", "estate-cleanouts"],
    relatedGuides: ["how-junk-removal-pricing-works", "construction-cleanup-guide"],
    faqs: [
      {
        q: "Do you rent dumpsters?",
        a: "No. We provide junk removal and cleanout service. If you need a rented container for a multi-day remodel, a dumpster company is usually the right vendor.",
      },
    ],
  },
  {
    slug: "how-much-junk-fits-in-a-pickup",
    title: "How Much Junk Fits in a Pickup? | Morris Junk Removal",
    h1: "How Much Junk Fits in a Pickup?",
    description:
      "A practical guide to junk volume — pickup loads, trailer fractions, and how Morris estimates load size from photos.",
    keywords: ["how much junk fits in a pickup", "junk removal load size"],
    summary:
      "People often underestimate volume. A “pickup load” is a useful mental model, but packed garages and bulky furniture add up fast.",
    sections: [
      {
        heading: "Pickup-load mental model",
        body: [
          "A loosely loaded pickup bed is a small job for many crews.",
          "A packed garage can equal several pickup loads once furniture, appliances, and bags are counted.",
          "Bulky items (sofas, mattresses, hot tubs) consume space faster than bags of clothes.",
        ],
      },
      {
        heading: "How we estimate volume",
        body: [
          "Photos of the whole pile beat item lists alone.",
          "We map your load to trailer volume tiers during the estimate.",
          "Use our load-size estimator for a starting point, then confirm with photos.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "furniture-removal"],
    relatedGuides: ["how-junk-removal-pricing-works", "photo-estimate-tips"],
    relatedItems: ["couch-sofa", "mattress-box-spring"],
    faqs: [
      {
        q: "Can I just tell you it is one pickup load?",
        a: "You can, and it helps — but photos still matter. What looks like one load in person can be two once everything is stacked for transport.",
      },
    ],
  },
  {
    slug: "what-can-we-remove",
    title: "What Can We Remove? | Morris Junk Removal",
    h1: "What Can We Remove?",
    description:
      "Common items Morris Junk Removal can haul in Warren County and nearby Missouri — plus materials that need special handling or cannot be accepted.",
    keywords: ["what can junk removal take", "junk removal items accepted"],
    summary:
      "We remove furniture, appliances, household junk, garage clutter, and many renovation leftovers. Hazardous materials and some restricted items need different handling or cannot be accepted.",
    sections: [
      {
        heading: "Commonly accepted",
        body: [
          "Furniture, mattresses, appliances, electronics (when facilities accept them), yard debris, and general household junk.",
          "Garage, basement, attic, estate, and storage-unit cleanouts.",
          "Construction and renovation debris when materials and access are clear.",
        ],
      },
      {
        heading: "Needs special handling or review",
        body: [
          "Freon appliances, tires, batteries, paint, chemicals, and some electronics.",
          "Pianos, safes, hot tubs, and very heavy equipment-style items.",
          "Heavily contaminated, moldy, or pest-exposed materials.",
        ],
      },
      {
        heading: "Often cannot accept",
        body: [
          "Household hazardous waste that facilities will not take through our channels.",
          "Materials banned by local disposal partners.",
          "If you are unsure, ask in your estimate request — honesty beats a declined load on arrival.",
        ],
      },
    ],
    relatedServices: ["furniture-removal", "appliance-removal", "construction-debris-removal"],
    relatedGuides: ["what-we-cannot-take", "donation-vs-disposal"],
    faqs: [
      {
        q: "Where can I check a specific item?",
        a: "Use our Can We Take This? tool and item directory for mattresses, refrigerators, tires, pianos, and more.",
      },
    ],
  },
  {
    slug: "prepare-for-junk-removal",
    title: "How to Prepare for Junk Removal | Morris Junk Removal",
    h1: "How to Prepare for Junk Removal",
    description:
      "Checklist to prepare your home or property for a Morris Junk Removal visit in Warren County and nearby communities.",
    keywords: ["prepare for junk removal", "junk removal checklist"],
    summary:
      "A little prep speeds the job, protects your property, and keeps the estimate accurate.",
    sections: [
      {
        heading: "Before the crew arrives",
        body: [
          "Separate keep vs go piles when possible.",
          "Clear a path from the items to the truck — move rugs, toys, and fragile décor.",
          "Unlock gates and confirm parking for a truck and trailer.",
          "Someone 18+ should provide access unless arranged otherwise in writing.",
        ],
      },
      {
        heading: "Tell us in advance",
        body: [
          "Stairs, elevators, long carries, and HOA rules.",
          "Electronics, freon appliances, batteries, tires, paint, or chemicals.",
          "Items you hope to donate if they are clean and usable.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "estate-cleanouts"],
    relatedGuides: ["photo-estimate-tips", "garage-cleanout-checklist"],
    faqs: [
      {
        q: "Do I need to be home the whole time?",
        a: "Someone should provide access at the start. For longer jobs, ask us what presence is needed for your property.",
      },
    ],
  },
  {
    slug: "what-happens-to-your-junk",
    title: "What Happens to Your Junk? | Morris Junk Removal",
    h1: "What Happens to Your Junk?",
    description:
      "How Morris Junk Removal evaluates materials for donation, recycling, specialty handling, and appropriate disposal.",
    keywords: ["what happens to junk after removal", "junk removal recycling"],
    summary:
      "Whenever practical, we sort for donation, reuse, or recycling before remaining material goes to an appropriate facility. Outcomes depend on condition and local acceptance rules.",
    sections: [
      {
        heading: "The handling path",
        body: [
          "Evaluate condition and contamination.",
          "Separate materials that facilities or partners may accept for donation or recycling.",
          "Route specialty items (certain appliances, electronics, tires, batteries) when options exist.",
          "Dispose of remaining material appropriately — we do not claim zero-waste or guaranteed diversion rates.",
        ],
      },
      {
        heading: "How you can help",
        body: [
          "Identify reusable goods and specialty items in your estimate request.",
          "Separate construction or yard waste from household junk when you can.",
        ],
      },
    ],
    relatedServices: ["furniture-removal", "appliance-removal"],
    relatedGuides: ["donation-vs-disposal", "how-recycling-works"],
    faqs: [
      {
        q: "Will I get a recycling certificate?",
        a: "We do not invent certificates. When staff record verified handling outcomes on a job, those can appear on your job summary — we never guess.",
      },
    ],
  },
  {
    slug: "how-recycling-works",
    title: "How Recycling Works for Junk Removal | Morris Junk Removal",
    h1: "How Recycling Works for Junk Removal",
    description:
      "Honest explanation of recycling during junk removal — what may be recyclable and why facility rules matter in Missouri.",
    keywords: ["junk removal recycling", "appliance recycling Missouri"],
    summary:
      "Recycling depends on material type, cleanliness, and whether a local facility accepts that stream on the day of the job.",
    sections: [
      {
        heading: "Often recyclable when accepted",
        body: [
          "Scrap metal, certain appliances, cardboard, clean wood, and some yard waste.",
          "Electronics and tires only through appropriate specialty channels.",
        ],
      },
      {
        heading: "What limits recycling",
        body: [
          "Mixed, contaminated, moldy, or pest-exposed loads.",
          "Facility capacity and acceptance rules that change by location.",
          "Items that look recyclable but are bonded to non-recyclable materials.",
        ],
      },
    ],
    relatedServices: ["appliance-removal", "construction-debris-removal"],
    relatedGuides: ["what-happens-to-your-junk", "donation-vs-disposal"],
    faqs: [
      {
        q: "Do you recycle everything?",
        a: "No. We prioritize recycling when practical and available, but not every item can be recycled.",
      },
    ],
  },
  {
    slug: "donation-vs-disposal",
    title: "Donation vs Disposal | Morris Junk Removal",
    h1: "Donation vs Disposal",
    description:
      "When furniture and household goods may be donated during junk removal — and when disposal is the honest option.",
    keywords: ["furniture donation junk removal", "donate or dispose"],
    summary:
      "Donation depends on condition, demand, and receiving organization rules. Damaged or contaminated items usually cannot be donated.",
    sections: [
      {
        heading: "Better donation candidates",
        body: [
          "Clean furniture in usable condition.",
          "Working appliances when a receiver accepts them.",
          "Usable household goods, tools, and office furniture.",
        ],
      },
      {
        heading: "Usually disposal",
        body: [
          "Broken, stained, moldy, or pest-exposed items.",
          "Mixed debris with no practical receiver.",
          "Materials banned by donation partners.",
        ],
      },
    ],
    relatedServices: ["furniture-removal", "estate-cleanouts"],
    relatedGuides: ["what-happens-to-your-junk", "estate-cleanout-checklist"],
    faqs: [
      {
        q: "Can I require donation?",
        a: "Tell us your preference. We will be honest about what is realistic. We do not promise donation for every item.",
      },
    ],
  },
  {
    slug: "estate-cleanout-checklist",
    title: "Estate Cleanout Checklist | Morris Junk Removal",
    h1: "Preparing for an Estate Cleanout",
    description:
      "A practical estate cleanout checklist for families in Warren County and nearby Missouri communities.",
    keywords: ["estate cleanout checklist", "estate cleanout Missouri"],
    summary:
      "Estate cleanouts mix emotions, decisions, and logistics. A clear keep/donate/dispose plan makes the crew visit smoother.",
    sections: [
      {
        heading: "Family decisions first",
        body: [
          "Identify keepers and sentimental items before the haul date.",
          "Photograph rooms for the estimate once decisions are mostly made.",
          "Note upstairs, basement, and outbuilding access.",
        ],
      },
      {
        heading: "Day-of logistics",
        body: [
          "Confirm who will unlock the property.",
          "Mark items that must stay.",
          "Share any donation preferences for clean, usable goods.",
        ],
      },
    ],
    relatedServices: ["estate-cleanouts", "furniture-removal", "garage-cleanouts"],
    relatedGuides: ["prepare-for-junk-removal", "donation-vs-disposal"],
    faqs: [
      {
        q: "Can you work room by room?",
        a: "Yes when scoped that way. Tell us priority rooms and any areas that must wait for family decisions.",
      },
    ],
  },
  {
    slug: "garage-cleanout-checklist",
    title: "Garage Cleanout Checklist | Morris Junk Removal",
    h1: "Garage Cleanout Checklist",
    description:
      "Step-by-step garage cleanout checklist for homeowners in Warren County, Warrenton, and nearby Missouri towns.",
    keywords: ["garage cleanout checklist", "garage junk removal"],
    summary:
      "Garages hide volume. Sort keepers, pull hazardous products aside, and photograph the full space for an accurate estimate.",
    sections: [
      {
        heading: "Sort before you book",
        body: [
          "Keep / donate / toss piles save time on haul day.",
          "Set aside paint, chemicals, batteries, and fuels — tell us what you found.",
          "Move vehicles out so the crew can stage safely.",
        ],
      },
      {
        heading: "Photo tips",
        body: [
          "Wide shots of each wall and the center pile.",
          "Close-ups of heavy benches, tires, and appliances.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "appliance-removal"],
    relatedGuides: ["prepare-for-junk-removal", "photo-estimate-tips"],
    faqs: [
      {
        q: "Do you sweep after?",
        a: "We remove the listed junk. Broome-clean finish depends on what was scoped — ask if you need a swept floor.",
      },
    ],
  },
  {
    slug: "moving-cleanup-checklist",
    title: "Moving Cleanup Checklist | Morris Junk Removal",
    h1: "Moving Cleanup Checklist",
    description:
      "Moving and landlord turnover cleanup checklist — what to haul before keys are returned in our Missouri service area.",
    keywords: ["moving cleanup", "rental turnover junk removal"],
    summary:
      "Move-outs leave furniture, bags, and last-minute debris. A timed junk removal visit protects deposits and closing schedules.",
    sections: [
      {
        heading: "Before move-out day",
        body: [
          "Book early if you have a hard key-return or closing date.",
          "Photograph leftovers after furniture is mostly out — volume is clearer then.",
        ],
      },
      {
        heading: "Common move-out loads",
        body: [
          "Mattresses, sofas, dressers, and broken furniture.",
          "Bags, boxes, garage leftovers, and patio items.",
          "Appliances the landlord will not keep.",
        ],
      },
    ],
    relatedServices: ["estate-cleanouts", "furniture-removal", "commercial-cleanouts"],
    relatedGuides: ["prepare-for-junk-removal", "landlord-turnover-checklist"],
    faqs: [
      {
        q: "Can you meet a closing deadline?",
        a: "Tell us the hard date when you request an estimate. We schedule when capacity allows — we do not invent same-day guarantees.",
      },
    ],
  },
  {
    slug: "landlord-turnover-checklist",
    title: "Landlord Turnover Checklist | Morris Junk Removal",
    h1: "Landlord Turnover Checklist",
    description:
      "Junk removal checklist for landlords and property managers handling rental turnovers in Warren County and nearby Missouri.",
    keywords: ["landlord turnover junk removal", "rental cleanout"],
    summary:
      "Turnovers need speed and clear scope. Send unit access notes, photos, and what must stay for the next tenant.",
    sections: [
      {
        heading: "Scope the unit",
        body: [
          "List rooms and outbuildings included.",
          "Mark appliances or furniture that stay with the property.",
          "Note trash vs bulk items left by tenants.",
        ],
      },
      {
        heading: "Access details that matter",
        body: [
          "Lockbox codes, gate codes, parking rules, and quiet hours.",
          "Whether dumpsters or HOA rules affect staging.",
        ],
      },
    ],
    relatedServices: ["commercial-cleanouts", "estate-cleanouts", "furniture-removal"],
    relatedGuides: ["moving-cleanup-checklist", "commercial-cleanout-planning"],
    faqs: [
      {
        q: "Can you invoice a property management company?",
        a: "Ask when you request the estimate. Billing details can be arranged for approved commercial accounts.",
      },
    ],
  },
  {
    slug: "construction-cleanup-guide",
    title: "Construction Cleanup Guide | Morris Junk Removal",
    h1: "Construction Cleanup Guide",
    description:
      "How to plan construction and renovation debris removal — separated materials vs mixed loads in our Missouri service area.",
    keywords: ["construction debris removal", "renovation cleanup"],
    summary:
      "Separated clean wood, metal, cardboard, and concrete may have better routing options than mixed debris. Photos and material notes help.",
    sections: [
      {
        heading: "Separate when you can",
        body: [
          "Clean wood, metal, cardboard, and masonry streams are easier to route.",
          "Mixed bags with food waste or household junk complicate recycling options.",
        ],
      },
      {
        heading: "Site access",
        body: [
          "Confirm driveway strength, mud, and trailer turnaround.",
          "Share dumpster vs haul-away preference — we do not rent dumpsters.",
        ],
      },
    ],
    relatedServices: ["construction-debris-removal", "commercial-cleanouts"],
    relatedGuides: ["dumpster-vs-junk-removal", "how-recycling-works"],
    relatedItems: ["construction-debris"],
    faqs: [
      {
        q: "Do you demo walls?",
        a: "We remove debris. Structural demolition is a different trade unless separately scoped and confirmed.",
      },
    ],
  },
  {
    slug: "photo-estimate-tips",
    title: "Photo Estimate Tips | Morris Junk Removal",
    h1: "Photo Estimate Tips",
    description:
      "How to photograph junk for an accurate Morris Junk Removal estimate — angles, lighting, and what to include.",
    keywords: ["junk removal photo estimate", "how to photo junk"],
    summary:
      "Good photos prevent estimate surprises. Show the whole pile, the path out, and anything heavy or awkward.",
    sections: [
      {
        heading: "What to capture",
        body: [
          "Wide shots of each area from two angles.",
          "Close-ups of appliances, mattresses, and oversized items.",
          "Stairs, long hallways, and gate access.",
        ],
      },
      {
        heading: "What to avoid",
        body: [
          "Dark, blurry, or cropped photos that hide half the pile.",
          "Only listing items without showing how they are stacked.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "furniture-removal"],
    relatedGuides: ["how-junk-removal-pricing-works", "prepare-for-junk-removal"],
    faqs: [
      {
        q: "How many photos do you need?",
        a: "Enough to see every major pile and access path. For a garage, that is often 6–12 photos.",
      },
    ],
  },
  {
    slug: "what-we-cannot-take",
    title: "What We Cannot Take | Morris Junk Removal",
    h1: "What We Cannot Take",
    description:
      "Materials Morris Junk Removal often cannot accept — hazardous waste and facility-restricted items in Missouri.",
    keywords: ["junk removal cannot take", "hazardous waste junk removal"],
    summary:
      "Some materials are restricted by law or facility rules. Asking early prevents a declined load on haul day.",
    sections: [
      {
        heading: "Common restrictions",
        body: [
          "Certain household hazardous wastes, unidentified chemicals, and materials our partners will not accept.",
          "Loads that are unsafe to handle without specialty contractors.",
        ],
      },
      {
        heading: "When you are unsure",
        body: [
          "List the item in your estimate request or use Can We Take This?",
          "We would rather decline early than guess wrong on site.",
        ],
      },
    ],
    relatedServices: ["appliance-removal", "construction-debris-removal"],
    relatedGuides: ["what-can-we-remove", "how-recycling-works"],
    faqs: [
      {
        q: "What about paint cans?",
        a: "Tell us the type and whether they are sealed or empty. Acceptance varies — do not assume paint is always allowed.",
      },
    ],
  },
  {
    slug: "commercial-cleanout-planning",
    title: "Commercial Cleanout Planning | Morris Junk Removal",
    h1: "Commercial Cleanout Planning",
    description:
      "How offices, retail, and property teams plan commercial junk removal with Morris in Warren County and nearby Missouri.",
    keywords: ["commercial cleanout", "office junk removal"],
    summary:
      "Commercial jobs need access windows, certificates of insurance requests when required, and a clear list of what stays for the next tenant or build-out.",
    sections: [
      {
        heading: "Plan the window",
        body: [
          "Share preferred hours, loading dock rules, and elevator reservations.",
          "Identify after-hours needs early — capacity is not unlimited.",
        ],
      },
      {
        heading: "Scope clearly",
        body: [
          "Furniture, fixtures, electronics, and construction leftovers should be called out separately.",
          "Provide a site contact with authority to approve scope changes.",
        ],
      },
    ],
    relatedServices: ["commercial-cleanouts", "furniture-removal"],
    relatedGuides: ["landlord-turnover-checklist", "construction-cleanup-guide"],
    faqs: [
      {
        q: "Do you work in occupied buildings?",
        a: "Often yes, with clear staging rules. Tell us about tenants, quiet hours, and protected flooring.",
      },
    ],
  },
  {
    slug: "preparing-house-for-sale",
    title: "Preparing a House for Sale Cleanup | Morris Junk Removal",
    h1: "Preparing a House for Sale",
    description:
      "Junk removal tips to clear a house for listing photos and showings in Warren County and nearby Missouri.",
    keywords: ["clean house for sale junk removal", "listing prep cleanout"],
    summary:
      "Listing photos sell space. Clearing garages, basements, and leftover furniture helps showings and negotiations.",
    sections: [
      {
        heading: "High-impact areas",
        body: [
          "Garage, basement, attic, and patio clutter photograph poorly.",
          "Remove non-conveying appliances and broken furniture before the first showing.",
        ],
      },
      {
        heading: "Timing",
        body: [
          "Book before professional photos when possible.",
          "Coordinate with your realtor on what must remain for staging.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts", "estate-cleanouts", "furniture-removal"],
    relatedGuides: ["prepare-for-junk-removal", "garage-cleanout-checklist"],
    faqs: [
      {
        q: "Can realtors request estimates for clients?",
        a: "Yes. Share the property address, access plan, and photos so we can estimate accurately.",
      },
    ],
  },
  {
    slug: "spring-cleaning-guide",
    title: "Spring Cleaning Junk Removal Guide | Morris Junk Removal",
    h1: "Spring Cleaning Guide",
    description:
      "Spring cleaning junk removal guide for Warren County homes — garages, yards, and seasonal clutter.",
    keywords: ["spring cleaning junk removal", "spring cleanout Missouri"],
    summary:
      "Spring reveals winter clutter in garages and yards. A focused cleanout resets the property for the season.",
    sections: [
      {
        heading: "Typical spring loads",
        body: [
          "Garage overflow, broken patio furniture, yard waste, and leftover moving boxes.",
          "Storm-damaged limbs and brush when separated from household junk.",
        ],
      },
      {
        heading: "Prep tips",
        body: [
          "Bag yard waste from household junk when you can.",
          "Photograph before the pile grows — estimates stay clearer.",
        ],
      },
    ],
    relatedServices: ["garage-cleanouts"],
    relatedGuides: ["garage-cleanout-checklist", "prepare-for-junk-removal"],
    relatedItems: ["yard-debris"],
    faqs: [
      {
        q: "Do you take yard waste?",
        a: "Often yes when facilities accept it and it is not mixed with household trash. Use the item directory for details.",
      },
    ],
  },
];

export function getGuide(slug: string) {
  return AUTHORITY_GUIDES.find((g) => g.slug === slug);
}

export function allGuideSlugs() {
  return AUTHORITY_GUIDES.map((g) => g.slug);
}
