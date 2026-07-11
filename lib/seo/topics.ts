/** Topic cluster hubs — link related services, items, and guides. */

export type TopicCluster = {
  slug: string;
  name: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  services: string[];
  items: string[];
  guides: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    slug: "furniture-appliances",
    name: "Furniture & Appliances",
    title: "Furniture & Appliance Removal | Morris Junk Removal",
    h1: "Furniture & Appliance Removal",
    description:
      "Furniture, mattress, and appliance removal cluster for Warren County and nearby Missouri — couches, refrigerators, washers, and more.",
    keywords: ["furniture removal", "appliance removal", "couch removal", "mattress disposal"],
    summary:
      "From a single couch to a full appliance haul-away, this cluster covers residential furniture and appliance removal with honest donation and recycling notes.",
    sections: [
      {
        heading: "Furniture",
        body: "Couches, recliners, mattresses, office furniture, pianos, and pool tables each have different access and handling needs. Start with photos and stairs notes.",
      },
      {
        heading: "Appliances",
        body: "Refrigerators, freezers, washers, dryers, and water heaters may need disconnects and freon-aware routing. Empty units before pickup.",
      },
    ],
    services: ["furniture-removal", "mattress-removal", "appliance-removal"],
    items: [
      "couch-sofa",
      "recliner",
      "mattress-box-spring",
      "refrigerator",
      "washer-dryer",
      "freezer",
      "water-heater",
      "office-furniture",
      "piano",
      "pool-table",
    ],
    guides: ["donation-vs-disposal", "how-recycling-works", "prepare-for-junk-removal"],
    faqs: [
      {
        q: "Can I mix furniture and appliances in one visit?",
        a: "Yes. Tell us everything in the estimate so labor and specialty routing are planned together.",
      },
    ],
  },
  {
    slug: "cleanouts",
    name: "Property Cleanouts",
    title: "Garage, Estate & Storage Cleanouts | Morris Junk Removal",
    h1: "Property Cleanouts",
    description:
      "Garage, estate, basement, attic, and storage-unit cleanouts for Warren County homes and rentals.",
    keywords: ["garage cleanout", "estate cleanout", "storage unit cleanout"],
    summary:
      "Cleanouts are volume jobs. Sort keepers when you can, photograph the full space, and call out specialty items early.",
    sections: [
      {
        heading: "Residential cleanouts",
        body: "Garages, basements, attics, and sheds often hide more volume than expected. Checklists help families and movers stay on schedule.",
      },
      {
        heading: "Estate & storage",
        body: "Estate and storage-unit jobs mix usable goods with disposal items. Donation is condition-based — never guaranteed.",
      },
    ],
    services: [
      "garage-cleanouts",
      "estate-cleanouts",
      "basement-attic-cleanouts",
      "storage-unit-cleanouts",
      "hot-tub-shed-removal",
    ],
    items: ["shed-cleanup", "hot-tub", "yard-debris", "couch-sofa"],
    guides: [
      "garage-cleanout-checklist",
      "estate-cleanout-checklist",
      "moving-cleanup-checklist",
      "prepare-for-junk-removal",
    ],
    faqs: [
      {
        q: "How long does a garage cleanout take?",
        a: "It depends on volume and access. Your estimate includes an onsite time range based on the photos you send.",
      },
    ],
  },
  {
    slug: "construction-renovation",
    name: "Construction & Renovation",
    title: "Construction Debris Removal | Morris Junk Removal",
    h1: "Construction & Renovation Debris",
    description:
      "Construction debris, renovation cleanup, and material routing guidance for Warren County projects.",
    keywords: ["construction debris removal", "renovation cleanup", "drywall disposal"],
    summary:
      "Separated materials may have better recycling options than mixed debris. We haul — we are not a multi-day dumpster rental.",
    sections: [
      {
        heading: "Best results",
        body: "Keep clean wood, metal, cardboard, and masonry separated when practical. Tell us about roofing, concrete, and mixed bags.",
      },
      {
        heading: "Dumpster vs haul-away",
        body: "If your crew will load for several days, a dumpster rental may fit better. Same-day haul-away is our model.",
      },
    ],
    services: ["construction-debris-removal", "commercial-cleanouts"],
    items: ["construction-debris", "concrete-brick", "paint"],
    guides: ["construction-cleanup-guide", "dumpster-vs-junk-removal", "how-recycling-works"],
    faqs: [
      {
        q: "Do you take roofing shingles?",
        a: "Ask with photos and volume. Some roofing loads need specialty handling or may be declined.",
      },
    ],
  },
  {
    slug: "commercial-property",
    name: "Commercial & Property Pros",
    title: "Commercial Junk Removal | Morris Junk Removal",
    h1: "Commercial & Property Professional Cleanouts",
    description:
      "Junk removal for property managers, landlords, realtors, contractors, and offices in Warren County and nearby Missouri.",
    keywords: ["commercial junk removal", "property manager cleanout", "landlord junk removal"],
    summary:
      "Commercial work needs clear access windows, site contacts, and scoped inventories. We support turnovers, offices, and light renovation debris.",
    sections: [
      {
        heading: "Who this helps",
        body: "Property managers, landlords, realtors preparing listings, contractors clearing debris, and offices refreshing floors.",
      },
      {
        heading: "What we need",
        body: "Photos, access instructions, what must stay, and any after-hours or COI requests.",
      },
    ],
    services: ["commercial-cleanouts", "estate-cleanouts", "construction-debris-removal", "furniture-removal"],
    items: ["office-furniture", "tv-electronics", "construction-debris"],
    guides: [
      "commercial-cleanout-planning",
      "landlord-turnover-checklist",
      "preparing-house-for-sale",
      "moving-cleanup-checklist",
    ],
    faqs: [
      {
        q: "Can you invoice a company?",
        a: "Ask when you request the estimate. Approved commercial billing can be arranged.",
      },
    ],
  },
];

export function getTopic(slug: string) {
  return TOPIC_CLUSTERS.find((t) => t.slug === slug);
}

export function allTopicSlugs() {
  return TOPIC_CLUSTERS.map((t) => t.slug);
}
