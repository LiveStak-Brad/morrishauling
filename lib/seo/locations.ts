/**
 * Curated local SEO locations — unique blurbs, not thin doorway pages.
 * Add new areas here; pages are generated from this config.
 */

export type ServiceAreaKind = "city" | "county";

export type ServiceArea = {
  slug: string;
  name: string;
  kind: ServiceAreaKind;
  county: string;
  /** Nearby communities mentioned on the page */
  nearby: string[];
  /** Unique intro for junk removal in this area */
  junkBlurb: string;
  /** Unique intro for hauling in this area */
  haulingBlurb: string;
  /** Extended-area note when farther from Warrenton base */
  travelNote?: string;
  /** Publish for junk, hauling, or both */
  divisions: Array<"junk_removal" | "hauling">;
};

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "warren-county",
    name: "Warren County",
    kind: "county",
    county: "Warren County",
    nearby: ["Warrenton", "Wright City", "Truesdale", "Foristell", "Marthasville"],
    junkBlurb:
      "Warren County is our home base. From Warrenton neighborhoods to Wright City and Truesdale properties, we handle residential clear-outs, estate cleanups, and commercial junk removal with straightforward estimates.",
    haulingBlurb:
      "Warren County contractors and property owners use Morris Hauling for equipment moves, material drops, and local trailer transport without the runaround of a national freight broker.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "warrenton",
    name: "Warrenton",
    kind: "city",
    county: "Warren County",
    nearby: ["Truesdale", "Wright City", "Foristell", "Innsbrook"],
    junkBlurb:
      "Need junk removed in Warrenton? We clear garages, basements, furniture, appliances, and full property cleanouts for homeowners, landlords, and local businesses — with photo-based estimates before we schedule.",
    haulingBlurb:
      "Warrenton is our operating hub for equipment hauling and material delivery. Share pickup and delivery details, dimensions, and weight estimates so we can confirm the right trailer and route.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "wright-city",
    name: "Wright City",
    kind: "city",
    county: "Warren County",
    nearby: ["Warrenton", "Foristell", "Wentzville", "Truesdale"],
    junkBlurb:
      "Wright City residents and property managers call us for garage cleanouts, mattress and couch removal, and estate clearances along the I-70 corridor — without surprise add-ons when the scope matches your photos.",
    haulingBlurb:
      "From Wright City shops to nearby job sites, we haul mowers, compact equipment, and building materials with verified addresses and clear load notes before the truck rolls.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "wentzville",
    name: "Wentzville",
    kind: "city",
    county: "St. Charles County",
    nearby: ["O’Fallon", "Lake Saint Louis", "Foristell", "Wright City"],
    junkBlurb:
      "Wentzville homeowners and commercial properties use Morris Junk Removal for furniture haul-away, appliance pickup, and whole-home cleanouts. Upload photos for a clear estimate before we arrive.",
    haulingBlurb:
      "Wentzville contractors rely on Morris Hauling for skid-steer moves, material delivery, and equipment transport across St. Charles and Warren counties — with manual review when loads need special handling.",
    travelNote: "Wentzville is within our primary service radius from Warren County.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "troy",
    name: "Troy",
    kind: "city",
    county: "Lincoln County",
    nearby: ["Moscow Mills", "Foley", "Elsberry", "Warrenton"],
    junkBlurb:
      "Troy and Lincoln County properties — residential, rental, and commercial — get junk removal for furniture, appliances, and property cleanouts with honest pricing based on volume and access.",
    haulingBlurb:
      "Troy-area farms, shops, and contractors use us for tractor and mower transport, equipment hauling, and material drops with verified pickup and delivery points.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "lincoln-county",
    name: "Lincoln County",
    kind: "county",
    county: "Lincoln County",
    nearby: ["Troy", "Moscow Mills", "Foley", "Winfield"],
    junkBlurb:
      "Across Lincoln County we remove junk from homes, barns, storage units, and commercial spaces. Single-item pickups and full cleanouts are both available after a photo estimate.",
    haulingBlurb:
      "Lincoln County hauling covers equipment, machinery, and contractor materials between farms, yards, and job sites — with clear limits when a load needs permits or specialized gear.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "st-charles-county",
    name: "St. Charles County",
    kind: "county",
    county: "St. Charles County",
    nearby: ["St. Charles", "O’Fallon", "Wentzville", "Lake Saint Louis", "St. Peters"],
    junkBlurb:
      "St. Charles County junk removal for residential cleanouts, estate cleanups, and commercial property clearances. We serve the corridor from St. Charles to Wentzville with scheduled arrivals and transparent estimates.",
    haulingBlurb:
      "St. Charles County businesses and contractors book Morris Hauling for local equipment transport and material delivery. Interstate or oversized loads may require manual review before confirmation.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "ofallon",
    name: "O’Fallon",
    kind: "city",
    county: "St. Charles County",
    nearby: ["St. Peters", "Wentzville", "Lake Saint Louis", "St. Charles"],
    junkBlurb:
      "O’Fallon junk removal for furniture, mattresses, appliances, garage cleanouts, and landlord turnovers. Tell us about stairs, long carries, and what stays — we price from your photos and notes.",
    haulingBlurb:
      "O’Fallon contractors and shops use Morris Hauling for equipment moves and building-material delivery across St. Charles County with verified addresses on every stop.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "lake-saint-louis",
    name: "Lake Saint Louis",
    kind: "city",
    county: "St. Charles County",
    nearby: ["Wentzville", "O’Fallon", "Dardenne Prairie", "Foristell"],
    junkBlurb:
      "Lake Saint Louis homes and HOA properties call us for discreet junk removal, furniture haul-away, and garage or basement cleanouts — scheduled windows, not vague “sometime this week.”",
    haulingBlurb:
      "Lake Saint Louis material and equipment hauling for contractors and property projects, with load details reviewed before we confirm the appointment.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "washington",
    name: "Washington",
    kind: "city",
    county: "Franklin County",
    nearby: ["Union", "Pacific", "New Haven", "St. Clair"],
    junkBlurb:
      "Washington, MO junk removal for riverside homes, downtown properties, and commercial cleanouts. Extended-area travel may apply outside our core Warren County radius — we disclose that before you book.",
    haulingBlurb:
      "Washington-area hauling for equipment and materials between Franklin County sites and the Warren County corridor. Share dimensions and weight so we can confirm capacity.",
    travelNote: "Franklin County jobs may include an extended-area travel fee depending on distance and schedule.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "union",
    name: "Union",
    kind: "city",
    county: "Franklin County",
    nearby: ["Washington", "St. Clair", "Pacific", "Villa Ridge"],
    junkBlurb:
      "Union property cleanouts, furniture removal, and commercial junk pickup with photo estimates. We serve Franklin County as an extended service area from our Warren County base.",
    haulingBlurb:
      "Union contractors book equipment and material hauling when routes fit our local schedule. Oversized or interstate loads are reviewed manually before acceptance.",
    travelNote: "Extended-area travel may apply for Franklin County appointments.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "franklin-county",
    name: "Franklin County",
    kind: "county",
    county: "Franklin County",
    nearby: ["Washington", "Union", "Pacific", "St. Clair", "Sullivan"],
    junkBlurb:
      "Franklin County junk removal for homes, rentals, and commercial spaces. We cover Washington, Union, Pacific, and nearby communities as an extended service area with clear travel expectations up front.",
    haulingBlurb:
      "Franklin County hauling supports contractor delivery and equipment transport when the route and load fit our local capacity. Manual review applies to specialized or heavy loads.",
    travelNote: "Extended-area travel may apply outside our primary Warren County radius.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "jefferson-county",
    name: "Jefferson County",
    kind: "county",
    county: "Jefferson County",
    nearby: ["Arnold", "Festus", "High Ridge", "Imperial", "Pevely"],
    junkBlurb:
      "Jefferson County junk removal for Arnold, Festus, High Ridge, and surrounding communities. Distance from our Warren County base means we confirm travel and scheduling before locking a date.",
    haulingBlurb:
      "Jefferson County equipment and material hauling is available on select schedules. Provide accurate load details — we will not confirm a job we cannot safely complete.",
    travelNote: "Jefferson County is an extended service area; travel fees and scheduling windows may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "st-charles",
    name: "St. Charles",
    kind: "city",
    county: "St. Charles County",
    nearby: ["St. Peters", "O’Fallon", "Bridgeton", "Maryland Heights"],
    junkBlurb:
      "Historic St. Charles homes, apartments, and commercial spaces get junk removal for furniture, appliances, and full cleanouts. Stairs, alley access, and parking notes help us price accurately.",
    haulingBlurb:
      "St. Charles local hauling for equipment and materials with verified pickup and delivery. Tight downtown access should be noted when you request an estimate.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "chesterfield",
    name: "Chesterfield",
    kind: "city",
    county: "St. Louis County",
    nearby: ["Wildwood", "Ballwin", "Clarkson Valley", "Ellisville"],
    junkBlurb:
      "Chesterfield junk removal for residential cleanouts and property turnovers. This is an extended service area — we confirm travel and availability before scheduling.",
    haulingBlurb:
      "Chesterfield equipment and material transport is offered when routes and capacity allow. Expect manual review for heavier machinery and multi-stop deliveries.",
    travelNote: "St. Louis County communities are extended-area service; travel fees may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "wildwood",
    name: "Wildwood",
    kind: "city",
    county: "St. Louis County",
    nearby: ["Eureka", "Ellisville", "Chesterfield", "Pacific"],
    junkBlurb:
      "Wildwood property cleanouts and furniture removal with photo-based estimates. Longer drives from Warren County mean we are selective about schedule fit and travel.",
    haulingBlurb:
      "Wildwood hauling for equipment and materials when the load and route fit our local model. We will say no rather than overpromise on specialized transport.",
    travelNote: "Extended-area travel may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "eureka",
    name: "Eureka",
    kind: "city",
    county: "St. Louis County",
    nearby: ["Pacific", "Wildwood", "High Ridge", "Byrnes Mill"],
    junkBlurb:
      "Eureka junk removal for homes and small commercial properties along the I-44 corridor. Extended-area service — we disclose travel expectations before you book.",
    haulingBlurb:
      "Eureka material and equipment hauling for contractors when capacity allows. Accurate weight and dimension notes are required for confirmation.",
    travelNote: "Extended-area travel may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "arnold",
    name: "Arnold",
    kind: "city",
    county: "Jefferson County",
    nearby: ["Imperial", "High Ridge", "Festus", "Oakville"],
    junkBlurb:
      "Arnold junk removal for residential and rental cleanouts. Jefferson County is extended service from our Warren County base — we confirm travel and timing before locking the job.",
    haulingBlurb:
      "Arnold equipment and material hauling on select days. Share load details early so we can accept or decline honestly.",
    travelNote: "Extended-area travel may apply for Jefferson County.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "festus",
    name: "Festus",
    kind: "city",
    county: "Jefferson County",
    nearby: ["Crystal City", "Pevely", "Herculaneum", "Arnold"],
    junkBlurb:
      "Festus and Crystal City area junk removal for furniture, appliances, and property cleanouts. Distance-based travel may apply; we quote that clearly with your estimate.",
    haulingBlurb:
      "Festus-area hauling for local equipment and materials when the schedule fits. Specialized or interstate loads require manual review.",
    travelNote: "Extended-area travel may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "moscow-mills",
    name: "Moscow Mills",
    kind: "city",
    county: "Lincoln County",
    nearby: ["Troy", "Foley", "Winfield", "Warrenton"],
    junkBlurb:
      "Moscow Mills junk removal for homes, outbuildings, and property cleanouts across Lincoln County. Single items and full loads both start with a photo estimate.",
    haulingBlurb:
      "Moscow Mills equipment and material hauling for farms, shops, and job sites with verified stops and clear load notes.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "foristell",
    name: "Foristell",
    kind: "city",
    county: "St. Charles County",
    nearby: ["Wright City", "Wentzville", "Warrenton", "Flint Hill"],
    junkBlurb:
      "Foristell sits on the Warren–St. Charles line — convenient for junk removal, garage cleanouts, and estate clearances with short travel from our Warrenton base.",
    haulingBlurb:
      "Foristell hauling for equipment and materials between western St. Charles County and Warren County job sites.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "pacific",
    name: "Pacific",
    kind: "city",
    county: "Franklin County",
    nearby: ["Eureka", "Wildwood", "Union", "Villa Ridge"],
    junkBlurb:
      "Pacific junk removal for residential and light commercial cleanouts. Extended-area service with travel disclosed before booking.",
    haulingBlurb:
      "Pacific material and equipment transport when routes align with our local schedule. Manual review for heavy or oversized loads.",
    travelNote: "Extended-area travel may apply.",
    divisions: ["junk_removal", "hauling"],
  },
  {
    slug: "high-ridge",
    name: "High Ridge",
    kind: "city",
    county: "Jefferson County",
    nearby: ["Arnold", "Byrnes Mill", "Eureka", "House Springs"],
    junkBlurb:
      "High Ridge junk removal for homes and rentals in Jefferson County. We confirm extended-area travel and availability before scheduling.",
    haulingBlurb:
      "High Ridge equipment and material hauling on select schedules with honest capacity limits.",
    travelNote: "Extended-area travel may apply.",
    divisions: ["junk_removal", "hauling"],
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}

export function areasForDivision(division: "junk_removal" | "hauling"): ServiceArea[] {
  return SERVICE_AREAS.filter((a) => a.divisions.includes(division));
}
