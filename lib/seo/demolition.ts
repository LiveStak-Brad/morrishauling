/**
 * Demolition & structure-removal SEO pillar.
 * Truthful scoping: what Morris evaluates/handles now, equipment used,
 * when larger projects need additional planning — never overclaim.
 */

export type DemolitionService = {
  slug: string;
  name: string;
  shortName: string;
  title: string;
  description: string;
  /** Search-intent intro */
  overview: string;
  /** What Morris currently evaluates / typically handles */
  currentlyOffers: string[];
  /** Equipment we actually use (truthful) */
  equipment: string[];
  /** When larger scope needs more planning / equipment */
  whenLargerScope: string[];
  process: string[];
  relatedServices: string[];
  relatedDemolition: string[];
  faqs: Array<{ q: string; a: string }>;
  imageKey: string;
  keywords: string[];
};

export const DEMOLITION_SERVICES: DemolitionService[] = [
  {
    slug: "interior-demolition",
    name: "Interior Demolition",
    shortName: "Interior",
    title: "Interior Demolition & Debris Removal | Warren County MO",
    description:
      "Interior demolition scoping and debris haul-away in Warrenton and Warren County. Honest project-by-project estimates for tear-out debris Morris can load and remove.",
    overview:
      "Interior demolition usually means removing non-structural finishes and fixtures — cabinets, flooring layers, drywall debris, partitions, and remodel waste — then hauling the material away. Homeowners and contractors near Warrenton call when a remodel creates more debris than a pickup truck can handle.",
    currentlyOffers: [
      "On-site or photo-based evaluation of what must come out and how it will be staged",
      "Labor to break down and load non-structural interior debris when the scope fits our crew and trailers",
      "Dump-trailer haul-away to appropriate disposal or recycling outlets",
      "Coordination notes when you or another contractor is handling the tear-out and we handle debris only",
    ],
    equipment: [
      "Dump trailers and trucks for debris loading and haul-away",
      "Hand tools and crew labor for loading and light break-down",
      "Protective coverings and careful carry-out practices on finished floors when noted in the estimate",
    ],
    whenLargerScope: [
      "Load-bearing walls, structural changes, or work that requires licensed contractors or permits",
      "Asbestos, lead, or other regulated materials that need specialty abatement before haul-away",
      "Multi-story full gut jobs that exceed trailer capacity or need heavier equipment we do not operate on every job",
    ],
    process: [
      "Share photos, floor plans notes, and what stays vs goes",
      "We confirm what we can load and haul on a project-by-project estimate",
      "Schedule a window, prepare access, and we remove the agreed debris",
    ],
    relatedServices: ["construction-debris-removal", "basement-attic-cleanouts", "commercial-cleanouts"],
    relatedDemolition: ["structure-removal", "garage-demolition", "concrete-removal"],
    imageKey: "demolition-interior",
    keywords: ["interior demolition", "remodel debris removal", "drywall tear out haul away Warrenton"],
    faqs: [
      {
        q: "Do you do full gut renovations?",
        a: "We evaluate each project. Many remodel debris loads fit our crew and dump trailers. Structural changes, permits, and specialty abatement are outside a standard haul-away scope and must be handled by qualified parties before or alongside our work.",
      },
      {
        q: "Can you haul debris after my contractor demolishes?",
        a: "Yes. Debris-only haul-away is common. Tell us volume, access, and whether material is already bagged or piled.",
      },
    ],
  },
  {
    slug: "shed-demolition",
    name: "Shed Demolition",
    shortName: "Shed",
    title: "Shed Demolition & Removal | Warrenton & Warren County MO",
    description:
      "Shed demolition and debris removal near Warrenton, Missouri. We scope tear-down, loading, and haul-away project by project — honest about access and structure size.",
    overview:
      "Old sheds collect junk, lean, or block a yard project. Shed demolition in Warren County usually means safe tear-down of a small outbuilding, sorting scrap when practical, and hauling debris so the pad or ground is clear.",
    currentlyOffers: [
      "Evaluation of shed size, condition, access, and whether contents must be emptied first",
      "Light structure tear-down when the shed is within what our crew can safely dismantle by hand and trailer load",
      "Contents cleanout plus structure debris haul-away on combined scopes",
      "Metal scrap routing when Free Scrap Fridays or metal recycling applies",
    ],
    equipment: [
      "Dump trailers for wood, metal, and mixed shed debris",
      "Hand tools for dismantling small sheds",
      "Trucks and crew for loading and site cleanup of agreed debris",
    ],
    whenLargerScope: [
      "Large pole-built or commercial outbuildings that need heavier equipment",
      "Electrical, concrete anchors, or utilities that must be disconnected by others first",
      "Unsafe structures that require specialty demolition planning beyond a standard residential shed",
    ],
    process: [
      "Send photos of all sides, interior, and driveway access",
      "Approve a project-specific estimate",
      "Clear personal items you want to keep; we handle the agreed tear-down and haul-away",
    ],
    relatedServices: ["hot-tub-shed-removal", "garage-cleanouts", "construction-debris-removal"],
    relatedDemolition: ["fence-removal", "deck-demolition", "barn-demolition", "structure-removal"],
    imageKey: "demolition-shed",
    keywords: ["shed demolition", "shed removal Warrenton", "outbuilding tear down Warren County"],
    faqs: [
      {
        q: "Do I need to empty the shed first?",
        a: "If the shed is full, we can often combine a cleanout with tear-down. Photos help us price both parts honestly.",
      },
      {
        q: "Do you remove the concrete pad?",
        a: "Pad or slab work is scoped separately under concrete removal when it fits our capabilities. Many customers only need the shed structure and debris removed.",
      },
    ],
  },
  {
    slug: "deck-demolition",
    name: "Deck Demolition",
    shortName: "Deck",
    title: "Deck Demolition & Haul-Away | Warren County MO",
    description:
      "Deck demolition and debris haul-away for Warrenton and nearby Missouri homes. Project-by-project estimates based on size, height, and access.",
    overview:
      "Failing decks, old stairs, and failed railings are common on Midwestern homes. Deck demolition means controlled tear-down of wood or composite decking and hauling the material so your yard is ready for rebuild or landscaping.",
    currentlyOffers: [
      "Assessment of deck footprint, height, stairs, and attachment to the home",
      "Tear-down and loading of residential decks when safe for crew and trailer capacity",
      "Haul-away of lumber, fasteners, and railing debris",
      "Care around landscaping and siding when noted in the job scope",
    ],
    equipment: [
      "Dump trailers for lumber and mixed deck debris",
      "Hand tools and crew labor for dismantling",
      "Trucks for site access where driveways allow",
    ],
    whenLargerScope: [
      "Multi-level decks, rooftop decks, or complex structural ties that need a licensed contractor",
      "Ledgers that affect house structure or flashing work beyond debris removal",
      "Sites with no trailer access requiring special staging",
    ],
    process: [
      "Photos of the full deck, underside if visible, and access path",
      "Written estimate for tear-down and haul-away",
      "Scheduled removal of the agreed structure and debris",
    ],
    relatedServices: ["construction-debris-removal", "hot-tub-shed-removal"],
    relatedDemolition: ["fence-removal", "shed-demolition", "concrete-removal"],
    imageKey: "demolition-deck",
    keywords: ["deck demolition", "deck removal Missouri", "tear down deck Warrenton"],
    faqs: [
      {
        q: "Will you disconnect the deck from the house?",
        a: "We scope how the deck is attached before work starts. Anything that affects house structure, flashing, or permits may need a contractor; we focus on safe tear-down and debris removal within the agreed scope.",
      },
    ],
  },
  {
    slug: "fence-removal",
    name: "Fence Removal",
    shortName: "Fence",
    title: "Fence Removal | Warrenton, Wright City & Warren County",
    description:
      "Fence removal and haul-away in Warren County, Missouri. Wood, chain-link, and panel fences scoped by length, posts, and access.",
    overview:
      "Fence removal clears old wood panels, leaning posts, and chain-link before a new install or property sale. Rural and subdivision lots around Warrenton often need careful gate and neighbor-line planning.",
    currentlyOffers: [
      "Removal of residential wood, vinyl, and chain-link fencing when access allows",
      "Post pull or cut-off options discussed in the estimate",
      "Haul-away of panels, posts, and wire",
      "Coordination with new-fence installs when you schedule debris removal between contractors",
    ],
    equipment: [
      "Dump trailers for fence panels and posts",
      "Hand tools, post tools, and crew labor",
      "Trucks for material staging along driveways or field access",
    ],
    whenLargerScope: [
      "Long commercial runs, highway right-of-way, or utility-entangled fencing",
      "Concrete footings that require heavier breakout than a standard residential job",
      "Disputed property lines — customers must confirm boundaries before removal",
    ],
    process: [
      "Share approximate linear feet, photos of posts, and gate locations",
      "Approve the estimate",
      "We remove and haul the agreed fence sections",
    ],
    relatedServices: ["garage-cleanouts", "construction-debris-removal"],
    relatedDemolition: ["deck-demolition", "shed-demolition", "concrete-removal"],
    imageKey: "demolition-fence",
    keywords: ["fence removal", "fence tear down Warrenton", "remove old fence Warren County"],
    faqs: [
      {
        q: "Do you grind stumps or remove all concrete footings?",
        a: "Post and footing depth varies. We explain what is included — full pull vs cut-off — in your estimate so there are no surprises.",
      },
    ],
  },
  {
    slug: "garage-demolition",
    name: "Garage Demolition",
    shortName: "Garage",
    title: "Garage Demolition & Debris Removal | Missouri",
    description:
      "Garage demolition scoping and debris haul-away near Warrenton. Detached and attached garages evaluated project by project with honest equipment limits.",
    overview:
      "Garage demolition is a larger residential structure job. Some detached garages can be dismantled and hauled in stages; others need more planning because of size, utilities, or attachment to the home.",
    currentlyOffers: [
      "Detailed evaluation of garage size, construction type, utilities, and access",
      "Contents cleanout before or with structure work",
      "Debris haul-away and, when scoped, light residential garage tear-down within crew/trailer capability",
      "Clear written notes on what is included vs what needs another contractor",
    ],
    equipment: [
      "Dump trailers and trucks for staged debris loads",
      "Crew labor and hand tools for dismantling within safe residential scopes",
      "Multiple trips when volume exceeds a single trailer",
    ],
    whenLargerScope: [
      "Large or engineered buildings, two-story garages, or commercial bays",
      "Electrical, gas, or plumbing disconnects that must be done by licensed trades",
      "Jobs that require excavators or heavy demolition equipment we do not provide on every project",
    ],
    process: [
      "Photos inside and out, plus notes on power and slab",
      "Project estimate with inclusions and exclusions",
      "Scheduled work only after scope is agreed in writing",
    ],
    relatedServices: ["garage-cleanouts", "construction-debris-removal", "estate-cleanouts"],
    relatedDemolition: ["structure-removal", "concrete-removal", "shed-demolition"],
    imageKey: "demolition-garage",
    keywords: ["garage demolition", "demolish garage Warrenton", "garage tear down Missouri"],
    faqs: [
      {
        q: "Can you demolish an attached garage?",
        a: "Attached garages need extra care for the shared wall, roof, and utilities. We evaluate honestly and may limit our role to debris haul-away or partial scope when a licensed contractor should lead the structure work.",
      },
    ],
  },
  {
    slug: "barn-demolition",
    name: "Barn Demolition",
    shortName: "Barn",
    title: "Barn Demolition & Farm Structure Debris | Warren County",
    description:
      "Barn demolition assessment and debris removal for Warren County acreage. Honest scoping — many barns need staged haul-away or additional equipment planning.",
    overview:
      "Barns on rural Warren County and Lincoln County land range from small livestock sheds to large hay barns. We help property owners understand what Morris can load and haul versus when a larger demolition plan is required.",
    currentlyOffers: [
      "Site walk or photo review of barn size, condition, and field access",
      "Contents and scrap cleanout when safe",
      "Staged debris haul-away after tear-down by us (when scoped) or by others",
      "Metal scrap handling notes for Free Scrap Fridays when applicable",
    ],
    equipment: [
      "Dump trailers suited to farm drive access when ground conditions allow",
      "Trucks and crew for loading debris",
      "Hand tools for limited dismantling on smaller farm buildings",
    ],
    whenLargerScope: [
      "Large dairy, hay, or commercial agricultural buildings",
      "Unstable or partially collapsed structures that need heavy equipment",
      "Wet fields, bridges, or soft ground that block trailer access",
    ],
    process: [
      "Share location, photos, and access notes (gates, creek crossings, soft ground)",
      "Receive a project-specific plan and estimate",
      "Schedule only the work we can perform safely with available equipment",
    ],
    relatedServices: ["estate-cleanouts", "construction-debris-removal"],
    relatedDemolition: ["pole-barn-demolition", "structure-removal", "shed-demolition"],
    imageKey: "demolition-barn",
    keywords: ["barn demolition", "barn removal Warren County", "farm building tear down"],
    faqs: [
      {
        q: "Do you bring an excavator for barn demolition?",
        a: "Not on every job. We are upfront when a barn needs heavier equipment or a specialty demolition partner. Many projects start with contents cleanout and staged debris haul-away.",
      },
    ],
  },
  {
    slug: "pole-barn-demolition",
    name: "Pole Barn Demolition",
    shortName: "Pole Barn",
    title: "Pole Barn Demolition | Wright City, Troy & Warren County",
    description:
      "Pole barn demolition scoping and debris haul-away in eastern Missouri. Metal and wood pole buildings evaluated for access, size, and equipment needs.",
    overview:
      "Pole barns are common for shops, storage, and equipment. Demolition often involves metal panels, lumber, and posts — with volume that can fill multiple trailer loads.",
    currentlyOffers: [
      "Evaluation of footprint, height, metal vs wood skin, and driveway access",
      "Contents removal before structure work",
      "Debris haul-away and limited dismantling when the building size fits a staged residential/light commercial approach",
      "Recycling notes for scrap metal panels when practical",
    ],
    equipment: [
      "Dump trailers for panel and lumber debris",
      "Crew labor for loading and light dismantling",
      "Multiple scheduled loads for larger buildings",
    ],
    whenLargerScope: [
      "Tall or wide pole buildings that need heavy equipment for safe take-down",
      "Concrete stem walls or thick slabs beyond a simple debris scope",
      "Active electrical service or embedded utilities",
    ],
    process: [
      "Photos of all sides and interior clear-span",
      "Estimate with trip count and exclusions",
      "Work proceeds only on the agreed scope",
    ],
    relatedServices: ["commercial-cleanouts", "construction-debris-removal"],
    relatedDemolition: ["barn-demolition", "garage-demolition", "structure-removal"],
    imageKey: "demolition-pole-barn",
    keywords: ["pole barn demolition", "pole barn removal", "metal building tear down Missouri"],
    faqs: [
      {
        q: "Can metal panels go to scrap?",
        a: "Often yes when separated and accepted by the outlet. Contaminated or mixed loads may need disposal instead. We note scrap potential in the estimate when photos support it.",
      },
    ],
  },
  {
    slug: "mobile-home-demolition",
    name: "Mobile Home Demolition",
    shortName: "Mobile Home",
    title: "Mobile Home Demolition & Removal | Missouri",
    description:
      "Mobile home demolition and haul-away scoping for Warren County and nearby. Title, utilities, and access reviewed before any work — project-by-project only.",
    overview:
      "Mobile and manufactured home removal is highly regulated and site-specific. We help owners understand debris removal and tear-down options without promising a one-size-fits-all demolition package.",
    currentlyOffers: [
      "Initial review of photos, location, and whether the unit is already stripped",
      "Interior cleanout and debris haul-away when safe and accessible",
      "Partial or staged removal scopes when they fit crew and trailer capability",
      "Clear guidance on what the customer must handle first (title, utilities, permits)",
    ],
    equipment: [
      "Dump trailers for interior and exterior debris",
      "Crew labor for loading",
      "Trucks for access on park or private roads when allowed",
    ],
    whenLargerScope: [
      "Full chassis removal, titling issues, or park rules that require approved contractors",
      "Units with mold, asbestos, or hazardous materials needing specialty handling",
      "Jobs requiring heavy equipment or certified mobile-home movers",
    ],
    process: [
      "Confirm ownership/authority to remove and utility shutoffs",
      "Photo estimate and written scope",
      "Schedule only approved portions of the work",
    ],
    relatedServices: ["estate-cleanouts", "appliance-removal", "furniture-removal"],
    relatedDemolition: ["structure-removal", "interior-demolition", "concrete-removal"],
    imageKey: "demolition-mobile-home",
    keywords: ["mobile home demolition", "manufactured home removal Missouri", "trailer home tear down"],
    faqs: [
      {
        q: "Do you handle titles and park approvals?",
        a: "Those remain the owner’s or authorized agent’s responsibility. We need confirmation you have the right to remove the unit before we schedule on-site work.",
      },
    ],
  },
  {
    slug: "concrete-removal",
    name: "Concrete Removal",
    shortName: "Concrete",
    title: "Concrete Removal & Haul-Away | Warren County MO",
    description:
      "Concrete removal and haul-away for pads, walkways, and small slabs near Warrenton. Scoped by thickness, reinforcement, and access — honest about equipment limits.",
    overview:
      "Concrete removal may mean breaking and hauling a shed pad, sidewalk section, or patio. Weight and reinforcement matter more than square footage alone.",
    currentlyOffers: [
      "Assessment of slab thickness, rebar/wire, and truck access",
      "Breakup and loading of small residential pads and sections when within our capability",
      "Haul-away of broken concrete to appropriate facilities",
      "Combined jobs with shed or fence removal when scheduled together",
    ],
    equipment: [
      "Dump trailers rated for heavy debris when conditions allow",
      "Hand tools and light breaking tools for small residential scopes",
      "Trucks for loading access",
    ],
    whenLargerScope: [
      "Thick foundation walls, driveways, or heavily reinforced commercial slabs",
      "Jobs that need skid-steer breakers or excavators beyond the agreed equipment list",
      "Sites where heavy loads would damage soft driveways or septic fields",
    ],
    process: [
      "Photos with a tape measure for thickness if possible",
      "Estimate based on volume and access",
      "Removal and haul-away of the agreed concrete",
    ],
    relatedServices: ["construction-debris-removal", "hot-tub-shed-removal"],
    relatedDemolition: ["shed-demolition", "garage-demolition", "deck-demolition"],
    imageKey: "demolition-concrete",
    keywords: ["concrete removal", "remove concrete pad", "sidewalk demolition Warren County"],
    faqs: [
      {
        q: "Do you pour new concrete?",
        a: "No. We focus on removal and haul-away. Your builder or concrete contractor handles replacement.",
      },
    ],
  },
  {
    slug: "structure-removal",
    name: "Structure Removal",
    shortName: "Structures",
    title: "Structure Removal | Sheds, Outbuildings & More — Warrenton MO",
    description:
      "Structure removal assessment for outbuildings and small residential structures in Warren County. Honest project-by-project scoping from Morris Service Group LLC.",
    overview:
      "Structure removal is the umbrella for outbuildings, small shops, and mixed tear-down jobs that do not fit a single label. We start with what you need cleared and what equipment the site allows.",
    currentlyOffers: [
      "Whole-property walkthroughs or photo reviews for mixed structures",
      "Prioritized plans: contents first, then structure debris, then optional pad work",
      "Haul-away and light tear-down within safe crew and trailer limits",
      "Referrals or clear exclusions when a job needs heavier demolition resources",
    ],
    equipment: [
      "Dump trailers and trucks",
      "Crew labor and hand tools",
      "Staged multi-load plans for larger debris volumes",
    ],
    whenLargerScope: [
      "Any structure that is unsafe to dismantle without heavy equipment",
      "Commercial buildings, multi-story structures, or engineered steel buildings",
      "Environmental or permit requirements beyond standard residential debris work",
    ],
    process: [
      "Describe every structure and share photos",
      "Receive a written scope with inclusions and exclusions",
      "Book the phases you approve",
    ],
    relatedServices: ["estate-cleanouts", "construction-debris-removal", "commercial-cleanouts"],
    relatedDemolition: [
      "shed-demolition",
      "garage-demolition",
      "barn-demolition",
      "pole-barn-demolition",
      "interior-demolition",
    ],
    imageKey: "demolition-structure",
    keywords: ["structure removal", "outbuilding removal", "building tear down Warrenton MO"],
    faqs: [
      {
        q: "How do I know if my project is too large?",
        a: "Send photos. We will tell you plainly what we can complete with our crew and trailers, what needs more planning, and what should be led by a specialty demolition contractor.",
      },
      {
        q: "Do you give free estimates?",
        a: "We provide project-by-project estimates from photos or site review. Complex structures may require an on-site visit before a firm number.",
      },
    ],
  },
];

export function allDemolitionSlugs(): string[] {
  return DEMOLITION_SERVICES.map((s) => s.slug);
}

export function getDemolitionService(slug: string): DemolitionService | undefined {
  return DEMOLITION_SERVICES.find((s) => s.slug === slug);
}
