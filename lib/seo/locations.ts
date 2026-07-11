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
  /** Residential and commercial jobs that fit this area's property mix */
  useCases?: string[];
  /** Place-specific context about access, corridors, and local property types */
  localContext?: string;
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
    useCases: [
      "Estate and whole-property cleanouts in Warrenton, Truesdale, and smaller county communities",
      "Barn, shed, and workshop clearing on rural acreage",
      "Compact tractor, mower, and job-site equipment moves",
      "Material delivery between local suppliers, farms, shops, and construction sites",
    ],
    localContext:
      "Warren County combines I-70 corridor communities with farms, wooded acreage, and properties reached by two-lane county roads. That mix makes driveway width, gate access, surface conditions, and load dimensions important details for both cleanout trucks and equipment trailers.",
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
    useCases: [
      "Garage, basement, and move-out cleanouts near established Warrenton neighborhoods",
      "Furniture and appliance removal from homes, rentals, and local offices",
      "Mower and compact-equipment transport for acreage outside town",
      "Construction material drops near the I-70 and Highway 47 commercial area",
    ],
    localContext:
      "Warrenton sits where I-70 and Highway 47 connect the commercial corridor to older in-town blocks and rural properties beyond the city limits. Being based here helps us plan short local runs, while customers still need to flag downtown parking, narrow drives, gates, or soft ground before arrival.",
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
    useCases: [
      "Garage and storage cleanouts for established homes and newer subdivisions",
      "Rental turnover debris and bulky-item removal",
      "Mower, mini-equipment, and shop-tool transport",
      "Building-material delivery to growing residential and commercial sites",
    ],
    localContext:
      "Wright City is shaped by I-70 access and continued growth between Warren and St. Charles counties. Jobs may range from compact subdivision driveways to shops and acreage outside town, so parking space, HOA timing, and trailer turnaround room can change how a pickup is planned.",
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
    useCases: [
      "Move-in, move-out, and garage cleanouts in growing subdivisions",
      "Furniture, appliance, and packaging removal for homes and offices",
      "Skid-steer and compact-equipment moves between western St. Charles County sites",
      "Material deliveries for residential construction and tenant improvements",
    ],
    localContext:
      "Wentzville's I-70, I-64, and US 61 connections make it a practical hub for both neighborhood pickups and contractor routes. Subdivision parking rules, active construction traffic, and busy commercial access points mean an accurate address and a clear staging plan are especially useful.",
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
    useCases: [
      "Home, estate, and rental-property cleanouts in and around Troy",
      "Barn, outbuilding, and workshop debris removal",
      "Tractor, mower, and compact-equipment transport for rural properties",
      "Material drops for shops, farms, and local job sites",
    ],
    localContext:
      "Troy is the Lincoln County hub for US 61 traffic, while Highway 47 and county roads lead quickly to farms and larger residential lots. In-town pickups and rural jobs have different access needs, especially when trailers must clear gates, gravel lanes, slopes, or limited turnaround areas.",
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
    useCases: [
      "Household and estate cleanouts across Troy, Moscow Mills, Foley, and Winfield",
      "Barn, shed, and storage-building cleanouts on rural land",
      "Farm mower, tractor attachment, and compact-equipment moves",
      "Contractor material delivery along US 61 and county-road routes",
    ],
    localContext:
      "Lincoln County stretches from faster US 61 access to river communities and rural roads where distances, grades, and driveway conditions vary. Photos of the load help with pricing, but gate width, overhead clearance, road surface, and a safe place to turn around matter just as much for rural service.",
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
    useCases: [
      "Estate, move-out, and renovation cleanouts from St. Charles to Wentzville",
      "Apartment, office, and retail fixture removal",
      "Compact-equipment transfers between contractor yards and job sites",
      "Building-material delivery along the I-70, I-64, and Route 364 corridors",
    ],
    localContext:
      "St. Charles County includes historic riverfront blocks, dense suburban neighborhoods, industrial parks, and fast-growing western communities. Parking restrictions, apartment loading access, subdivision rules, and interstate timing can all affect the crew size or trailer setup needed for a job.",
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
    useCases: [
      "Garage, basement, and downsizing cleanouts in established subdivisions",
      "Landlord turnovers and bulky-item pickup from rentals",
      "Landscape and compact-construction equipment moves",
      "Material delivery to residential projects and commercial tenant spaces",
    ],
    localContext:
      "O’Fallon spans busy areas near I-70 and I-64 as well as large residential subdivisions between them. Cul-de-sacs, HOA limits, school-hour traffic, and commercial loading access are practical planning details for both a junk-removal truck and an equipment trailer.",
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
    useCases: [
      "Garage and basement cleanouts in planned neighborhoods",
      "Furniture and appliance removal during moves or downsizing",
      "HOA-coordinated pickup from shared or limited-access properties",
      "Landscape equipment and project-material delivery for homes and contractors",
    ],
    localContext:
      "Lake Saint Louis is a planned community with lake neighborhoods, HOA-managed properties, and convenient I-64 access. Appointment windows, parking rules, gate instructions, and protecting shared drives or landscaped areas can be as important as the volume of the material being removed or delivered.",
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
    useCases: [
      "Furniture and estate cleanouts in older homes near central Washington",
      "Commercial and renovation debris removal where downtown access is limited",
      "Mower and compact-equipment moves to properties outside town",
      "Material delivery along Highway 100 and Franklin County routes",
    ],
    localContext:
      "Washington's Missouri River setting includes a historic downtown street grid, hillside approaches, newer neighborhoods, and rural properties beyond the city. Downtown parking, stairs, alley access, and the route back toward Warren County all help determine the most efficient setup for a crew or trailer.",
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
    useCases: [
      "Household, estate, and rental cleanouts around the county seat",
      "Office and small-commercial furniture removal",
      "Compact equipment transport between shops, acreage, and job sites",
      "Material drops using Highway 47 and US 50 connections",
    ],
    localContext:
      "Union is a Franklin County crossroads where Highway 47 and US 50 connect civic and commercial areas with rolling rural land. Jobs outside the central street grid may involve gravel lanes, steeper grades, or longer travel, so access photos and precise pickup details help avoid surprises.",
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
    useCases: [
      "Residential, estate, and rental cleanouts in Washington, Union, Pacific, and St. Clair",
      "Barn, workshop, and outbuilding clearing on rural properties",
      "Mower and compact-equipment transport between farms, shops, and job sites",
      "Contractor material delivery across the I-44 and Highway 100 sides of the county",
    ],
    localContext:
      "Franklin County covers two distinct travel patterns: the I-44 communities to the south and the Highway 100 corridor near the Missouri River. Rolling terrain and spread-out rural addresses can add travel and access considerations, making exact locations, driveway conditions, and load details essential before scheduling.",
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
    useCases: [
      "Home, rental, and estate cleanouts in Arnold, Festus, High Ridge, and nearby communities",
      "Basement and renovation debris removal on sloped residential lots",
      "Landscape and compact-equipment moves for contractors and acreage owners",
      "Material delivery along I-55, US 67, and connecting county roads",
    ],
    localContext:
      "Jefferson County combines the I-55 corridor with hilly western communities and dispersed residential roads. Steep drives, narrow shoulders, basement access, and longer routing from Warren County can affect both junk-removal labor and whether a trailer can be positioned safely.",
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
    useCases: [
      "Furniture and appliance removal from historic homes with stairs or narrow entries",
      "Apartment, office, and storefront cleanouts near downtown",
      "Renovation debris pickup where alley or curb access must be coordinated",
      "Compact-equipment and material transport to suburban and industrial sites",
    ],
    localContext:
      "St. Charles ranges from the historic Main Street and riverfront area to suburban neighborhoods and industrial access near I-70. Brick streets, alleys, limited curb space, apartment loading areas, and busy event days can require a different plan than a straightforward driveway pickup.",
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
    useCases: [
      "Downsizing, estate, and garage cleanouts in residential neighborhoods",
      "Office furniture and retail fixture removal in Chesterfield Valley",
      "Landscape and compact-equipment transport for property projects",
      "Material delivery to commercial sites with designated loading access",
    ],
    localContext:
      "Chesterfield includes established neighborhoods on rolling terrain and the broad commercial district in Chesterfield Valley along I-64. Residential HOA expectations, gated access, office loading rules, and peak corridor traffic should be identified before an extended-area appointment is confirmed.",
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
    useCases: [
      "Garage, basement, and estate cleanouts on larger residential lots",
      "Storm debris and outdoor-item removal after material is safely gathered",
      "Mower and landscape-equipment moves for acreage and property projects",
      "Material delivery where driveway grade and turnaround space are confirmed",
    ],
    localContext:
      "Wildwood's wooded lots, rolling terrain, and winding roads around the Highway 100 corridor differ from a typical grid-based suburb. Long or steep driveways, limited shoulders, gated properties, and trailer turnaround room need to be discussed before dispatch.",
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
    useCases: [
      "Household and garage cleanouts near the I-44 corridor",
      "Rental and small-commercial turnover debris removal",
      "Landscape and compact-equipment transport to hilly properties",
      "Construction material drops with grade and access reviewed in advance",
    ],
    localContext:
      "Eureka sits along I-44 in the Meramec valley, with commercial frontage near the interstate and residential roads climbing into surrounding hills. Grade, driveway geometry, and traffic around major destinations can affect safe truck positioning and extended-area scheduling.",
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
    useCases: [
      "Basement, garage, and move-out cleanouts in established neighborhoods",
      "Furniture and appliance removal from homes and rentals",
      "Landscape equipment transport for residential and contractor projects",
      "Material delivery near the I-55 and Highway 141 commercial corridors",
    ],
    localContext:
      "Arnold is a busy suburban gateway to Jefferson County, with I-55 and Highway 141 carrying traffic between shopping areas, neighborhoods, and nearby job sites. Sloped lots, limited street parking, and travel timing from Warren County are useful details when planning a truck or trailer visit.",
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
    useCases: [
      "Home and estate cleanouts across Festus and Crystal City",
      "Furniture, appliance, and rental-turnover removal",
      "Shop equipment and mower transport for nearby rural properties",
      "Material delivery to sites along the I-55 corridor",
    ],
    localContext:
      "Festus and neighboring Crystal City function as a paired commercial and residential area off I-55, surrounded by smaller communities and rural properties. Cross-town access is straightforward in many places, but distance from Warren County and any outlying gravel or sloped approach should be included in the estimate request.",
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
    useCases: [
      "Garage, shed, and whole-property cleanouts",
      "Bulky furniture and appliance pickup from homes and rentals",
      "Mower, tractor attachment, and compact-equipment transport",
      "Material drops for farms, shops, and growing residential sites",
    ],
    localContext:
      "Moscow Mills is close to the US 61 corridor but quickly transitions from newer residential growth to farms, shops, and larger lots. A subdivision pickup may require curb and HOA coordination, while an outlying job may depend on gate width, gravel conditions, and trailer turnaround space.",
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
    useCases: [
      "Garage, estate, and moving cleanouts near the county line",
      "Barn, shed, and acreage-property debris removal",
      "Mower and compact-equipment moves between Warrenton and Wentzville-area sites",
      "Material deliveries for subdivisions, shops, and rural construction",
    ],
    localContext:
      "Foristell straddles the transition between western St. Charles County growth and Warren County's more rural landscape, with I-70 providing the main east-west connection. New subdivisions, older town properties, and acreage can each present different parking, gate, driveway, and staging needs.",
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
    useCases: [
      "Residential and rental cleanouts in older in-town neighborhoods",
      "Storefront, office, and renovation debris removal",
      "Landscape and compact-equipment moves to nearby rural properties",
      "Material delivery using I-44 access when the route fits the schedule",
    ],
    localContext:
      "Pacific's historic center, I-44 access, and surrounding hills create a mix of compact in-town properties and harder-to-reach outlying sites. Alley or curb access, steep drives, and the extended route from Warrenton should be clear before the crew commits to a date.",
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
    useCases: [
      "Basement, garage, and rental-property cleanouts",
      "Furniture and appliance removal from homes on sloped lots",
      "Mower and landscape-equipment transport",
      "Project-material delivery where road and driveway access are suitable",
    ],
    localContext:
      "High Ridge is centered around the Highway 30 corridor, with residential roads spreading across hilly terrain toward House Springs and Byrnes Mill. Narrow approaches, steep or curved driveways, and limited trailer turnaround space make access notes especially important for this extended service area.",
    divisions: ["junk_removal", "hauling"],
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}

export function areasForDivision(division: "junk_removal" | "hauling"): ServiceArea[] {
  return SERVICE_AREAS.filter((a) => a.divisions.includes(division));
}
