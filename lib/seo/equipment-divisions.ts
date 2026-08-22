/**
 * High-quality marketing pages for Land Clearing, Site Work, and Equipment Services.
 * Quality over quantity — no city-cloned doorway pages.
 */

import type { DivisionId } from "@/lib/divisions";

export type EquipmentMarketingSection = {
  heading: string;
  body: string[];
};

export type EquipmentMarketingService = {
  slug: string;
  division: Extract<DivisionId, "land_clearing" | "site_work" | "equipment_services">;
  name: string;
  shortName: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  detailSections?: EquipmentMarketingSection[];
  whoFor: string[];
  included: string[];
  needed: string[];
  pricingFactors: string[];
  process: string[];
  restrictions: string[];
  related: string[];
  crossLinks: Array<{ href: string; label: string; note: string }>;
  faqs: Array<{ q: string; a: string }>;
  keywords: string[];
};

const AREA = "Warrenton and east-central Missouri";

export const LAND_CLEARING_SERVICES: EquipmentMarketingService[] = [
  {
    slug: "forestry-mulching",
    division: "land_clearing",
    name: "Forestry Mulching",
    shortName: "Forestry Mulching",
    title: `Forestry Mulching in Warrenton & East-Central Missouri | Morris Service Group`,
    description:
      "Forestry mulching for overgrown acreage, brush, and small trees around Warrenton and nearby Missouri counties. Request an upcoming project estimate — pricing depends on density, terrain, and access.",
    h1: "Forestry Mulching",
    intro: [
      `Forestry mulching turns standing brush and small trees into a usable ground cover on the same property. For many ${AREA} parcels, that is a cleaner way to reclaim land than cutting everything and hauling piles away.`,
      "We review acreage, vegetation, density, slope, and access before we quote. There is no published per-acre price — two similar-looking tracts can be very different jobs.",
      "This service is currently accepting upcoming project estimates. We confirm equipment, timing, and scope after we see photos or walk the property. We do not claim a specific machine is owned until that record is active.",
    ],
    detailSections: [
      {
        heading: "What forestry mulching is",
        body: [
          "A tracked forestry machine works the vegetation in place. Brush, honeysuckle, and small trees are ground into mulch that stays on the property instead of being stacked and hauled.",
          "The result is usually walkable or mowable ground with a wood-chip layer — not a landscaped yard and not a bare dirt pad unless we agree to a different finish.",
        ],
      },
      {
        heading: "What problems it solves",
        body: [
          "Overgrown acreage that you can no longer walk, mow, or use.",
          "Fence lines, trails, and access paths buried in brush.",
          "Invasive vegetation that has taken a woods or field edge.",
          "Land that needs to be opened for a future building site, pasture, or just to see the property again.",
        ],
      },
      {
        heading: "Typical vegetation",
        body: [
          "Mixed Missouri brush, honeysuckle, briars, saplings, and small trees are the usual fit.",
          "We will not publish a maximum tree diameter we can always handle. Size, species, lean, and what sits behind the tree all matter. Photos next to a fence post or person help more than a guess.",
        ],
      },
      {
        heading: "Benefits versus traditional clearing",
        body: [
          "Material usually stays on site as mulch, so there is less hauling and fewer burn piles.",
          "The ground cover can help with erosion compared with scraping a site bare.",
          "Traditional cut-and-haul still makes sense when logs must leave, large trees dominate, or you need a clean dirt finish. We will say so.",
        ],
      },
      {
        heading: "What happens to the mulch",
        body: [
          "The usual result is a layer of chips left where the vegetation stood. It settles over time.",
          "If you need piles removed, that is a separate hauling conversation — not assumed in a mulching estimate.",
        ],
      },
      {
        heading: "Terrain and access",
        body: [
          "Slope, wet ground, rock, overhead wires, gates, and tight turns decide whether tracked forestry equipment can work the property safely.",
          "Tell us about creeks, septic, unmarked lines, and the narrowest access point. We may decline ground that looks unsafe from photos or from an onsite look.",
        ],
      },
      {
        heading: "How estimates work",
        body: [
          "Send photos or a short walkthrough video with the address, approximate acreage, and the finish you want.",
          "We review density, access, and what should stay standing. You receive a written estimate — not an instant guaranteed price.",
        ],
      },
      {
        heading: "Why photos and video help",
        body: [
          "A phone video from the road into the thickest stand shows density, stem size, and access better than a paragraph.",
          "Include the worst patch and the thinnest patch. Note gates, wires, and trees that must stay.",
        ],
      },
      {
        heading: "When an onsite assessment may be needed",
        body: [
          "Larger acreage, mixed debris, unclear boundaries, or photos that cannot show the stand often need a walk before we finalize price.",
          "If we ask to visit, it is because a written number would be a guess.",
        ],
      },
    ],
    whoFor: [
      "Landowners opening overgrown acreage",
      "People reclaiming a yard, pasture, or building site",
      "Fence lines, trails, and access paths buried in brush",
      "Properties thick with honeysuckle or mixed saplings",
    ],
    included: [
      "Review of photos, video, and site notes",
      "A written estimate after we understand density and access",
      "Mulching vegetation in place when that matches the goal",
      "Honest limits when trees, slope, or utilities are outside a safe scope",
    ],
    needed: [
      "Address, city, county, and approximate acreage",
      "Photos or a short walkthrough video",
      "Notes on gates, wires, septic, and what should stay",
      "The finished look you want — mulch in place, mowable, or a cleared site",
    ],
    pricingFactors: [
      "Acreage and how much of it actually needs work",
      "Vegetation density and stem diameter",
      "Terrain, wet ground, and rock",
      "Access width, travel, and mobilization",
      "Whether debris must be piled, hauled, or left as mulch",
    ],
    process: [
      "Request an upcoming project estimate with photos or video",
      "We review the property and may ask for an onsite look on larger jobs",
      "You receive a written estimate — not an instant guaranteed price",
      "When equipment is scheduled, we complete the agreed area and leave it as scoped",
    ],
    restrictions: [
      "We do not publish a fixed per-acre forestry-mulching rate",
      "Larger trees, steep or saturated ground, and unmarked utilities can change or stop the job",
      "We will not claim a maximum tree size we can always handle",
    ],
    related: ["brush-clearing", "lot-clearing", "property-reclamation", "honeysuckle-clearing"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "Need piles or debris hauled after clearing? Hauling can move material off the property." },
      { href: "/site-work", label: "Morris Site Work", note: "After vegetation is down, rough grading or site preparation may be the next step." },
      { href: "/service-area", label: "Service area", note: "We work the same Missouri counties already listed for Morris Services." },
    ],
    faqs: [
      {
        q: "How much does forestry mulching cost per acre?",
        a: "We do not publish a per-acre price. Density, stem size, terrain, access, and the finished condition you want all change the number. Send photos or request an onsite assessment for a written estimate.",
      },
      {
        q: "Will the mulch stay on the property?",
        a: "That is the usual result when the goal is to reclaim ground in place. If you need piles removed, that is a separate hauling conversation.",
      },
      {
        q: "Do you own a forestry mulcher today?",
        a: "We are accepting upcoming project estimates. Equipment and timing are confirmed when we accept the job. We will not advertise a specific machine as owned until that record is active.",
      },
    ],
    keywords: ["forestry mulching", "land clearing", "brush mulching", "Warrenton MO"],
  },
  {
    slug: "brush-clearing",
    division: "land_clearing",
    name: "Brush Clearing",
    shortName: "Brush Clearing",
    title: `Brush Clearing in Warrenton & East-Central Missouri | Morris Service Group`,
    description:
      "Brush clearing for fence rows, overgrown edges, and thick undergrowth around Warrenton and nearby Missouri counties. Photo-based upcoming estimates — no thin city pages, no canned pricing.",
    h1: "Brush Clearing",
    intro: [
      "Brush clearing is for the thick edge that took over a fence, ditch, or back lot — honeysuckle, briars, saplings, and mixed undergrowth that a mower cannot handle.",
      `Around ${AREA}, that often means wooded lot lines, creek edges, and old fence rows. We focus on a usable result, not stripping every living plant unless you ask for that.`,
    ],
    whoFor: [
      "Homeowners who cannot mow the back line anymore",
      "Farms and acreage with neglected fence rows",
      "People opening a view or a walking path",
    ],
    included: [
      "A scoped pass over the area you mark",
      "Mulching in place when that fits",
      "Notes on what we will leave standing",
    ],
    needed: [
      "Photos of the thickest and thinnest parts",
      "What stays — trees, posts, outbuildings",
      "Access for a compact machine",
    ],
    pricingFactors: [
      "How thick the stand is",
      "Stem size mixed into the brush",
      "Length of fence line or acreage",
      "Soft ground and obstacles",
    ],
    process: [
      "Send photos and a simple sketch of the area",
      "We estimate after review",
      "Work is scheduled when equipment is available",
    ],
    restrictions: [
      "We do not clear protected wetlands or marked conservation ground without your documentation",
      "Wire in the brush and hidden fence can stop a mulcher",
    ],
    related: ["forestry-mulching", "fence-line-clearing", "honeysuckle-clearing"],
    crossLinks: [
      { href: "/equipment-services/grapple-services", label: "Grapple services", note: "Existing brush piles may need a grapple, not a mulcher." },
      { href: "/junk-removal", label: "Morris Junk Removal", note: "Household junk mixed into a brush pile is a junk-removal conversation." },
    ],
    faqs: [
      {
        q: "Is brush clearing the same as forestry mulching?",
        a: "They overlap. Brush clearing is usually a smaller, edge-focused job. Forestry mulching is the better label when you are opening acres of mixed vegetation.",
      },
      {
        q: "Can you clear honeysuckle?",
        a: "Honeysuckle is common in this region. Density, stem size, and what you want left standing still decide the estimate.",
      },
    ],
    keywords: ["brush clearing", "brush removal", "overgrown property", "Missouri"],
  },
  {
    slug: "lot-clearing",
    division: "land_clearing",
    name: "Lot Clearing",
    shortName: "Lot Clearing",
    title: `Lot Clearing in Warrenton & East-Central Missouri | Morris Service Group`,
    description:
      "Lot clearing for building sites, extra lots, and overgrown parcels in Warren County and nearby Missouri communities. Upcoming project estimates based on real site conditions.",
    h1: "Lot Clearing",
    intro: [
      "Lot clearing is about making a defined parcel usable again — a future house pad, a sold lot that grew up, or a second acre that has not been touched in years.",
      "We start with the result you need: mulched and walkable, opened for a survey, or prepared for later grading. We do not advertise excavation or foundation work as available until those services are turned on.",
    ],
    whoFor: [
      "Land buyers opening a wooded lot",
      "Owners preparing a site for a future build",
      "People reclaiming a neglected extra lot",
    ],
    included: [
      "Scoped vegetation work on the lot you describe",
      "Coordination notes if hauling or grading may follow",
    ],
    needed: [
      "Lot size and what must stay (trees, corners, wells)",
      "Photos from the road and from inside the stand",
      "Any survey pins or boundary marks you know about",
    ],
    pricingFactors: ["Lot size", "Vegetation mix", "Access from the road", "Desired finish"],
    process: [
      "Describe the lot and send photos",
      "We estimate after review",
      "Larger or unclear lots may need an onsite look",
    ],
    restrictions: [
      "We are not a grading or excavation contractor on this page",
      "Boundary disputes are the owner's responsibility",
    ],
    related: ["forestry-mulching", "property-reclamation", "site-preparation"],
    crossLinks: [
      { href: "/site-work/site-preparation", label: "Site preparation", note: "After the vegetation is down, site preparation may be available as a separate estimate." },
      { href: "/hauling", label: "Morris Hauling", note: "Logs or piles that must leave the lot can be a hauling job." },
    ],
    faqs: [
      {
        q: "Can you clear a lot for a new house?",
        a: "We can discuss vegetation removal for a building area. Foundation excavation and pad construction are not listed as current services.",
      },
    ],
    keywords: ["lot clearing", "land clearing", "building lot", "Warren County"],
  },
  {
    slug: "property-reclamation",
    division: "land_clearing",
    name: "Overgrown Property Reclamation",
    shortName: "Property Reclamation",
    title: `Overgrown Property Reclamation | Morris Land Clearing`,
    description:
      "Reclaim overgrown Missouri property — yards, fields, and neglected acreage around Warrenton. Upcoming estimates based on density, access, and the finish you want.",
    h1: "Overgrown Property Reclamation",
    intro: [
      "Property reclamation is the longer job: a place that slipped past mowing, a field that became a thicket, or a homestead edge that disappeared.",
      "The goal is usable ground again — not a landscaping magazine photo. We will tell you what a compact machine can reasonably restore and what should wait.",
    ],
    whoFor: [
      "Heirs opening a neglected property",
      "Owners who stopped keeping up with acreage",
      "People converting brush back toward pasture or yard",
    ],
    included: ["Phased work when the property is too large for one visit", "A clear written scope"],
    needed: ["How the property used to be used", "Photos from several angles", "What you want to walk or mow when we finish"],
    pricingFactors: ["How far the vegetation has gone", "Mixed debris vs. plants only", "Access and terrain"],
    process: ["Share photos and the story of the property", "We propose a scope", "Work proceeds when scheduled"],
    restrictions: ["Structures, trash, and farm junk mixed into vegetation may need junk removal or grapple work"],
    related: ["forestry-mulching", "brush-clearing", "lot-clearing"],
    crossLinks: [
      { href: "/junk-removal", label: "Morris Junk Removal", note: "Household or farm junk mixed through the brush is often a separate junk-removal scope." },
      { href: "/equipment-services", label: "Equipment Services", note: "Machine-assisted cleanup when the job is more debris than vegetation." },
    ],
    faqs: [
      {
        q: "Can you restore a property that has been ignored for years?",
        a: "Often we can make it usable again. Extremely large trees, structures, or dumped debris change the plan. Photos keep the estimate honest.",
      },
    ],
    keywords: ["overgrown property clearing", "land reclamation", "property cleanup Missouri"],
  },
  {
    slug: "honeysuckle-clearing",
    division: "land_clearing",
    name: "Honeysuckle / Invasive Clearing",
    shortName: "Honeysuckle Clearing",
    title: `Honeysuckle Removal in Missouri | Morris Land Clearing`,
    description:
      "Honeysuckle and invasive vegetation clearing in Warren County and nearby Missouri communities. Upcoming project estimates — density and access decide the work.",
    h1: "Honeysuckle and Invasive Vegetation Clearing",
    intro: [
      "Bush honeysuckle is a familiar problem on Missouri woodlots and fence lines. It shades out the ground, hides trash, and turns a walkable woods into a wall.",
      "We treat it as vegetation work, not a chemical program. If you have a follow-up plan with a landscaper or landowner practice, say so — it helps us leave the ground in a useful condition.",
    ],
    whoFor: ["Wooded residential lots", "Fence lines taken over by honeysuckle", "People opening a woods they used to walk"],
    included: ["Mulching or machine clearing of the stands you mark"],
    needed: ["Photos of the worst patches", "Whether desirable trees must be protected", "Access notes"],
    pricingFactors: ["How tall and thick the stand is", "Whether it is mixed with wire or trash", "Acreage"],
    process: ["Send photos", "We estimate", "Schedule after acceptance"],
    restrictions: ["We do not sell herbicide programs or guarantee the honeysuckle will never return"],
    related: ["brush-clearing", "forestry-mulching", "small-tree-clearing"],
    crossLinks: [
      { href: "/land-clearing/forestry-mulching", label: "Forestry mulching", note: "Larger mixed stands are often estimated as forestry mulching." },
    ],
    faqs: [
      {
        q: "Will honeysuckle grow back?",
        a: "It can. Clearing the standing growth is the machine part. Long-term control is a landowner or landscaping follow-up, not something we guarantee.",
      },
    ],
    keywords: ["honeysuckle removal Missouri", "invasive brush clearing", "bush honeysuckle"],
  },
  {
    slug: "small-tree-clearing",
    division: "land_clearing",
    name: "Small Tree & Sapling Clearing",
    shortName: "Small Tree Clearing",
    title: `Small Tree and Sapling Clearing | Morris Land Clearing`,
    description:
      "Clear saplings and small trees that have filled a field, lot, or fence line in east-central Missouri. Estimates after we see size, density, and access.",
    h1: "Small Tree and Sapling Clearing",
    intro: [
      "Saplings and small trees take a field back one season at a time. This page is for that in-between size — past a brush hog, not a timber sale.",
      "We will not advertise a hard maximum diameter we can always cut. Diameter, species, lean, and what sits behind the tree all matter.",
    ],
    whoFor: ["Pasture edges filling in", "Lots that were once mowed", "People opening a view"],
    included: ["Scoped removal or mulching of the stems you identify"],
    needed: ["A sense of diameter — even a photo next to a fence post helps", "What large trees stay"],
    pricingFactors: ["Count and size", "Density", "Whether material is mulched or piled"],
    process: ["Photos first", "Estimate", "Onsite look if size is unclear"],
    restrictions: ["Large, hazardous, or near-structure trees may be declined"],
    related: ["forestry-mulching", "lot-clearing", "trail-clearing"],
    crossLinks: [
      { href: "/land-clearing/forestry-mulching", label: "Forestry mulching", note: "When the stand is mixed brush and saplings across acres, mulching is usually the better fit." },
    ],
    faqs: [
      {
        q: "What size trees can you take?",
        a: "It depends on the machine, attachment, lean, and surroundings. Tell us the diameter you are seeing. We will not invent a guaranteed maximum.",
      },
    ],
    keywords: ["small tree clearing", "sapling removal", "field clearing Missouri"],
  },
  {
    slug: "fence-line-clearing",
    division: "land_clearing",
    name: "Fence-Line Clearing",
    shortName: "Fence-Line Clearing",
    title: `Fence-Line Clearing | Morris Land Clearing`,
    description:
      "Fence-line clearing for overgrown rows around Warrenton and nearby Missouri farms and homes. Upcoming estimates based on length, density, and wire.",
    h1: "Fence-Line Clearing",
    intro: [
      "A fence line that disappeared into brush is a common Missouri job. The work is usually a long, narrow strip — and hidden wire is the main risk.",
    ],
    whoFor: ["Farms resetting a line", "Homeowners reclaiming a back fence", "People preparing to rebuild fence"],
    included: ["A pass along the marked line", "Stopping if we find buried wire or unsafe obstacles"],
    needed: ["Approximate length", "Photos of the worst sections", "Whether the fence stays or comes out"],
    pricingFactors: ["Length", "Thickness", "Wire and posts in the brush"],
    process: ["Mark the line in photos", "Estimate", "Work the agreed stretch"],
    restrictions: ["We may refuse a line we cannot see well enough to work safely"],
    related: ["brush-clearing", "trail-clearing"],
    crossLinks: [
      { href: "/junk-removal", label: "Morris Junk Removal", note: "Old fence, panels, and wire that must leave the property can be a junk or scrap conversation." },
    ],
    faqs: [
      {
        q: "Can you work right against an existing fence?",
        a: "Sometimes. Standing fence, electric wire, and neighbor lines need to be marked. We stay conservative around anything that can wrap a drum or cut a hose.",
      },
    ],
    keywords: ["fence line clearing", "fence row brush", "farm fence clearing"],
  },
  {
    slug: "trail-clearing",
    division: "land_clearing",
    name: "Trail / Path Clearing",
    shortName: "Trail Clearing",
    title: `Trail and Access Clearing | Morris Land Clearing`,
    description:
      "Trail, path, and access clearing for wooded Missouri properties. Open a walking path, food-plot access, or a lane a machine can use later.",
    h1: "Trail and Access Clearing",
    intro: [
      "Trail and access clearing is a controlled cut — wide enough to walk, ride, or bring a vehicle later — not a clear-cut of the woods.",
    ],
    whoFor: ["Landowners opening a walking or ATV path", "People needing access to a back acre", "Right-of-way style lanes on private property"],
    included: ["A scoped corridor width you agree to", "Mulching or stacking as discussed"],
    needed: ["Start and end points", "Desired width", "What trees stay"],
    pricingFactors: ["Length", "Width", "Vegetation and slope"],
    process: ["Describe the route", "Estimate", "Cut the agreed path"],
    restrictions: ["Public right-of-way and utility easements need owner authority and any required permissions"],
    related: ["forestry-mulching", "fence-line-clearing"],
    crossLinks: [
      { href: "/site-work/driveway-grading", label: "Driveway grading", note: "If the path needs to become a graded drive later, that is a site-work estimate." },
    ],
    faqs: [
      {
        q: "Can you open a path for a future driveway?",
        a: "We can discuss a vegetation corridor. Building a finished driveway is a different, later conversation under site work.",
      },
    ],
    keywords: ["trail clearing", "path clearing", "access clearing Missouri"],
  },
  {
    slug: "storm-debris-clearing",
    division: "land_clearing",
    name: "Storm Debris / Vegetation Cleanup",
    shortName: "Storm Debris",
    title: `Storm Debris and Vegetation Cleanup | Morris Land Clearing`,
    description:
      "Storm-downed brush and vegetation cleanup in east-central Missouri. Grapple and mulching estimates after we see what is on the ground.",
    h1: "Storm Debris and Vegetation Cleanup",
    intro: [
      "After a storm, the job is often mixed: downed limbs, piled brush, and vegetation that is no longer standing. Grapple work and mulching can both apply.",
    ],
    whoFor: ["Homeowners with downed trees and brush", "Properties with wind-thrown piles", "People who already cut and stacked storm wood"],
    included: ["A review of what is vegetation vs. structure damage", "A scoped cleanup estimate"],
    needed: ["Photos of piles and standing hazards", "Whether wood should stay for firewood"],
    pricingFactors: ["Volume", "Piece size", "Access", "Whether material leaves the site"],
    process: ["Send photos quickly", "We estimate", "Schedule when we can get to the property"],
    restrictions: ["We are not an emergency tree service and do not claim 24/7 storm response"],
    related: ["brush-clearing", "forestry-mulching"],
    crossLinks: [
      { href: "/equipment-services/grapple-services", label: "Grapple services", note: "Piles and logs are often a grapple job." },
      { href: "/junk-removal", label: "Morris Junk Removal", note: "Household storm debris that is not vegetation may fit junk removal." },
    ],
    faqs: [
      {
        q: "Do you take downed trees off a house?",
        a: "Work on or against a damaged structure needs a careful look and may be declined. Start with photos. We will not promise crane or climber work we do not offer.",
      },
    ],
    keywords: ["storm debris cleanup", "downed tree cleanup", "vegetation cleanup Missouri"],
  },
];

export const SITE_WORK_SERVICES: EquipmentMarketingService[] = [
  {
    slug: "rough-grading",
    division: "site_work",
    name: "Rough Grading",
    shortName: "Rough Grading",
    title: `Rough Grading in Warrenton & East-Central Missouri | Morris Service Group`,
    description:
      "Rough grading and property leveling with compact equipment around Warrenton and nearby Missouri counties. Upcoming estimates — no excavation advertised until it is enabled.",
    h1: "Rough Grading",
    intro: [
      "Rough grading shapes dirt that is already there — smoothing ruts, knocking down piles, and getting a yard or pad area closer to usable.",
      "This is not published as excavation, trenching, or drainage construction. Those stay off the public list until the catalog turns them on.",
    ],
    whoFor: ["Properties after clearing", "Yards with dirt piles or ruts", "People preparing a rough site area"],
    included: ["A scoped pass with a bucket", "Honest notes on what we cannot flatten"],
    needed: ["Photos of the area", "Approximate size", "The finish you want"],
    pricingFactors: ["Square footage or acres", "How much material must move", "Slope and access"],
    process: ["Describe the ground", "Estimate", "Grade the agreed area"],
    restrictions: ["We do not guarantee survey-grade elevations", "Wet or rocky ground can stop the work"],
    related: ["site-preparation", "dirt-moving", "driveway-grading"],
    crossLinks: [
      { href: "/land-clearing", label: "Land Clearing", note: "If vegetation is still standing, clearing usually comes first." },
    ],
    faqs: [
      {
        q: "Is this excavation?",
        a: "No. Rough grading is shaping existing ground with a loader bucket. Excavation is a future service and is not offered on this page.",
      },
    ],
    keywords: ["rough grading", "property leveling", "site grading Missouri"],
  },
  {
    slug: "site-preparation",
    division: "site_work",
    name: "Site Preparation",
    shortName: "Site Preparation",
    title: `Site Preparation | Morris Site Work`,
    description:
      "Site preparation for compact-equipment work in east-central Missouri — clearing follow-up, dirt work, and getting a defined area ready. Upcoming estimates.",
    h1: "Site Preparation",
    intro: [
      "Site preparation here means getting a defined area ready for the next use: a shed spot, a graveled parking edge, or ground that was just cleared.",
      "Building-pad excavation and foundation work are not currently listed.",
    ],
    whoFor: ["Owners after land clearing", "People staging a small project area", "Contractors who need a compact machine and operator"],
    included: ["Scoped dirt and cleanup work you describe"],
    needed: ["What happens after we leave", "Measurements if you have them", "Photos"],
    pricingFactors: ["Size", "Material on site", "Access"],
    process: ["Tell us the end use", "Estimate", "Complete the agreed prep"],
    restrictions: ["Not a general contractor or excavation company on this page"],
    related: ["rough-grading", "gravel-spreading", "dirt-moving"],
    crossLinks: [
      { href: "/land-clearing/lot-clearing", label: "Lot clearing", note: "Vegetation still standing? Start with land clearing." },
      { href: "/hauling", label: "Morris Hauling", note: "Need rock or fill delivered? Hauling can be a separate trip." },
    ],
    faqs: [
      {
        q: "Can you prep a foundation?",
        a: "Not as a listed service today. We can talk about rough dirt work. Foundation and pad excavation stay coming soon until enabled.",
      },
    ],
    keywords: ["site preparation", "site prep", "Missouri"],
  },
  {
    slug: "gravel-spreading",
    division: "site_work",
    name: "Gravel Spreading",
    shortName: "Gravel Spreading",
    title: `Gravel Spreading | Morris Site Work`,
    description:
      "Gravel spreading and material placement with compact equipment in Warren County and nearby Missouri communities. Upcoming estimates.",
    h1: "Gravel Spreading",
    intro: [
      "Gravel spreading is placing and rough-leveling stone that is already on site or being delivered. We are not a quarry and do not publish rock prices.",
    ],
    whoFor: ["Driveway top-ups", "Parking pads", "People who have gravel delivered and need it spread"],
    included: ["Spreading and rough leveling of the quantity you have"],
    needed: ["Material type and about how many tons or yards", "Area size", "Whether we must stay off lawns or septic"],
    pricingFactors: ["Quantity", "How far it must be moved", "Access"],
    process: ["Describe the pile and the target area", "Estimate", "Spread when scheduled"],
    restrictions: ["We do not guarantee a compacted, engineered base"],
    related: ["driveway-grading", "dirt-moving", "material-handling"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "Need the gravel hauled in? That is a hauling estimate." },
      { href: "/equipment-services/material-handling", label: "Material handling", note: "Palletized or staged materials can be a fork job." },
    ],
    faqs: [
      {
        q: "Do you supply the gravel?",
        a: "Usually you or a supplier provide it. We can talk about hauling separately if that is what you need.",
      },
    ],
    keywords: ["gravel spreading", "gravel driveway", "material spreading Missouri"],
  },
  {
    slug: "dirt-moving",
    division: "site_work",
    name: "Dirt Moving",
    shortName: "Dirt Moving",
    title: `Dirt Moving | Morris Site Work`,
    description:
      "Dirt moving and fill placement with a compact track loader around Warrenton and nearby Missouri counties. Upcoming project estimates.",
    h1: "Dirt Moving",
    intro: [
      "Dirt moving is relocating soil that is already on the property — piles, low spots, and leftover berms. Long-haul trucking of fill is hauling, not this page.",
    ],
    whoFor: ["Properties with leftover dirt piles", "People filling ruts or low corners", "Cleanup after another contractor"],
    included: ["Moving the material you point to"],
    needed: ["Where it is and where it should go", "Approximate volume", "Photos"],
    pricingFactors: ["Volume", "Distance across the property", "Ground conditions"],
    process: ["Show us the pile and the destination", "Estimate", "Move the agreed material"],
    restrictions: ["We will not bury debris or create drainage problems on purpose"],
    related: ["rough-grading", "backfilling", "gravel-spreading"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "If dirt must leave or arrive by trailer, use hauling." },
    ],
    faqs: [
      {
        q: "Can you import fill dirt?",
        a: "Bringing material in is a hauling question. On-property moving is this service.",
      },
    ],
    keywords: ["dirt moving", "fill dirt", "soil moving Missouri"],
  },
  {
    slug: "backfilling",
    division: "site_work",
    name: "Backfilling",
    shortName: "Backfilling",
    title: `Backfilling | Morris Site Work`,
    description:
      "Backfilling around structures, edges, and low areas with compact equipment. Upcoming estimates — not advertised as excavation.",
    h1: "Backfilling",
    intro: [
      "Backfilling places soil back against an edge or into a low area. We stay conservative around foundations, septic, and unmarked lines.",
    ],
    whoFor: ["Owners with leftover trenches or low edges", "People finishing a small project"],
    included: ["Placing available material where you mark"],
    needed: ["What is underground", "Photos", "Where the fill comes from"],
    pricingFactors: ["Volume", "How tight the work area is", "Access"],
    process: ["Describe the hole and the material", "Estimate", "Place fill as agreed"],
    restrictions: ["We may refuse work against a foundation or septic we cannot see clearly"],
    related: ["dirt-moving", "rough-grading"],
    crossLinks: [
      { href: "/site-work/site-preparation", label: "Site preparation", note: "Larger finish work may belong with site preparation." },
    ],
    faqs: [
      {
        q: "Will you backfill a foundation?",
        a: "Only if we can do it safely with the equipment on hand and the conditions you describe. Many foundation jobs need a different machine and are not listed yet.",
      },
    ],
    keywords: ["backfilling", "fill dirt placement", "Missouri"],
  },
  {
    slug: "driveway-grading",
    division: "site_work",
    name: "Driveway Grading",
    shortName: "Driveway Grading",
    title: `Driveway Grading and Maintenance | Morris Site Work`,
    description:
      "Driveway grading and gravel-drive maintenance in Warren County and nearby Missouri communities. Upcoming estimates based on length, material, and drainage notes.",
    h1: "Driveway Grading",
    intro: [
      "Rural Missouri driveways wash, rut, and lose crown. This service is maintenance-minded grading and spreading — not a paved-road contractor and not a drainage-engineering firm.",
    ],
    whoFor: ["Gravel driveway owners", "People after a hard rain season", "New lanes that need a first shaping"],
    included: ["A scoped pass on the length you describe"],
    needed: ["Approximate length and width", "Photos of ruts and soft spots", "Any culvert or low-water notes"],
    pricingFactors: ["Length", "How bad the ruts are", "Whether extra gravel is on site"],
    process: ["Send photos and dimensions", "Estimate", "Grade the agreed driveway"],
    restrictions: ["We do not promise a permanent fix for a driveway that needs rock or drainage work we do not offer yet"],
    related: ["gravel-spreading", "rough-grading"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "Need a load of rock delivered first? Start with hauling." },
    ],
    faqs: [
      {
        q: "Can you fix standing water on my drive?",
        a: "We can talk about shaping what is there. Culverts and designed drainage are not current listed services.",
      },
    ],
    keywords: ["driveway grading", "gravel driveway maintenance", "Missouri"],
  },
];

export const EQUIPMENT_SERVICES_PAGES: EquipmentMarketingService[] = [
  {
    slug: "skid-steer-services",
    division: "equipment_services",
    name: "Skid Steer Services",
    shortName: "Skid Steer Services",
    title: `Skid Steer Services near Warrenton | Morris Service Group`,
    description:
      "Professional skid steer and compact track loader services in east-central Missouri — grading, grapple, forks, and property work. Upcoming project estimates.",
    h1: "Skid Steer Services",
    intro: [
      "Some customers know they need a machine and an operator more than they know the service name. This page is for professional skid steer and compact-track-loader work on a property or jobsite.",
      "Tell us the job: cleanup, brush or log handling, gravel or dirt placement, rough grading, site preparation, or storm debris. We match a grapple, bucket, pallet forks, or forestry mulching equipment on our side.",
    ],
    whoFor: [
      "Property owners who need machine help",
      "Contractors who need an operator for a defined task",
      "People cleaning up after a project or a storm",
    ],
    included: ["A conversation about the outcome", "A written estimate after we see the site in photos"],
    needed: ["What you need accomplished", "Materials and approximate size", "Access notes and photos"],
    pricingFactors: ["Time on site", "Attachment", "Travel", "How tight or soft the ground is"],
    process: ["Describe the job in plain language", "We review", "We estimate without instant guaranteed pricing"],
    restrictions: ["We are not a rental yard. This is operated equipment, not a drop-off rental."],
    related: ["bobcat-services", "grapple-services", "material-handling"],
    crossLinks: [
      { href: "/land-clearing", label: "Land Clearing", note: "If the job is mostly vegetation, land clearing is the clearer path." },
      { href: "/site-work", label: "Site Work", note: "Grading and gravel jobs often belong under site work." },
    ],
    faqs: [
      {
        q: "Is this a skid steer rental?",
        a: "No. We estimate operated work. You are not renting an unmanned machine from this page.",
      },
    ],
    keywords: ["skid steer services near me", "skid steer operator", "compact track loader"],
  },
  {
    slug: "bobcat-services",
    division: "equipment_services",
    name: "Skid Steer / Bobcat Services",
    shortName: "Bobcat Services",
    title: `Skid Steer and Bobcat Services near Warrenton | Morris Service Group`,
    description:
      "Professional skid steer and Bobcat services in Warren County and nearby Missouri communities. Independent contractor — not affiliated with Bobcat Company.",
    h1: "Professional Skid Steer and Bobcat Services",
    intro: [
      "People search for Bobcat services when they mean a compact loader and an operator. We use that language because it is how customers ask — not because Morris Service Group is affiliated with or endorsed by Bobcat Company.",
      "What we sell is the outcome: cleanup, material placement, brush handling, or grading that a compact machine can do.",
    ],
    whoFor: ["Homeowners who asked for a Bobcat", "Jobs that need a compact machine in a tight yard", "Cleanup and placement work"],
    included: ["Operated compact-loader work as scoped"],
    needed: ["The job in your words", "Photos", "Access width"],
    pricingFactors: ["Scope", "Time", "Attachment", "Travel"],
    process: ["Request an upcoming project estimate", "We review", "We confirm what the machine can actually do"],
    restrictions: [
      "Not official Bobcat services and not a manufacturer dealer page",
      "We do not claim a specific Bobcat model is owned until an equipment record is active",
    ],
    related: ["skid-steer-services", "grapple-services", "material-handling"],
    crossLinks: [
      { href: "/equipment-services/skid-steer-services", label: "Skid steer services", note: "Same capability, more generic equipment language." },
      { href: "/junk-removal", label: "Morris Junk Removal", note: "If the job is household junk a crew can carry, start with junk removal." },
    ],
    faqs: [
      {
        q: "Are you a Bobcat dealer?",
        a: "No. We are an independent local contractor. Bobcat is a common search phrase for compact loader work.",
      },
      {
        q: "Do you own a Bobcat?",
        a: "We accept upcoming estimates for compact loader work. We will not advertise a specific model as owned until that is true in our equipment records.",
      },
    ],
    keywords: ["Bobcat services near me", "Bobcat work near me", "skid steer services"],
  },
  {
    slug: "grapple-services",
    division: "equipment_services",
    name: "Grapple Services",
    shortName: "Grapple Services",
    title: `Grapple Services | Morris Equipment Services`,
    description:
      "Grapple work for brush piles, logs, storm debris, and demolition debris around Warrenton and nearby Missouri counties. Upcoming estimates.",
    h1: "Grapple Services",
    intro: [
      "A grapple picks and piles what a bucket scoops poorly — brush piles, logs, root balls, and mixed debris. It is often the right tool after a storm or after someone else cut and stacked.",
    ],
    whoFor: ["Brush pile cleanup", "Log and limb handling", "Jobsite debris that a machine should move"],
    included: ["Grapple handling of the material you show us"],
    needed: ["Photos of the pile", "Whether material stays or leaves", "Access"],
    pricingFactors: ["Pile size", "Piece weight", "How far it must move", "Hauling if it leaves the site"],
    process: ["Send photos", "Estimate", "Handle the agreed material"],
    restrictions: ["Hazardous or unknown demolition debris may be declined"],
    related: ["skid-steer-services", "material-handling"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "If the pile has to leave, hauling is the next conversation." },
      { href: "/land-clearing/storm-debris-clearing", label: "Storm debris clearing", note: "Standing vegetation plus piles may fit land clearing." },
    ],
    faqs: [
      {
        q: "Can you load my trailer?",
        a: "Sometimes, if the trailer and ground are safe. Tell us what you have on site.",
      },
    ],
    keywords: ["grapple services", "brush pile cleanup", "log handling"],
  },
  {
    slug: "material-handling",
    division: "equipment_services",
    name: "Material Handling",
    shortName: "Material Handling",
    title: `Material Handling and Pallet Fork Services | Morris Equipment Services`,
    description:
      "Pallet fork and material handling with compact equipment in east-central Missouri — lumber, stone, and jobsite placement. Upcoming estimates.",
    h1: "Material Handling",
    intro: [
      "Pallet forks move what people should not carry: palletized stone, lumber, and staged materials. A bucket still handles loose dirt and gravel.",
    ],
    whoFor: ["Contractors staging materials", "Owners who had a delivery dropped in the wrong place", "Jobsite placement"],
    included: ["Moving the materials you list, if they fit the forks or bucket"],
    needed: ["What the material is", "Weight if you know it", "Where it sits and where it should go"],
    pricingFactors: ["Weight and count", "Distance", "Ground conditions"],
    process: ["Describe the materials", "Estimate", "Place them as agreed"],
    restrictions: ["Overloaded or unstable pallets can be refused"],
    related: ["skid-steer-services", "gravel-spreading"],
    crossLinks: [
      { href: "/hauling", label: "Morris Hauling", note: "Road transport between two addresses is hauling." },
      { href: "/site-work/gravel-spreading", label: "Gravel spreading", note: "Loose stone that needs spreading is site work." },
    ],
    faqs: [
      {
        q: "Can you unload a supplier truck?",
        a: "Ask with photos and timing. We will not promise we can meet every delivery window.",
      },
    ],
    keywords: ["pallet fork services", "material handling", "skid steer forks"],
  },
];

const ALL = [...LAND_CLEARING_SERVICES, ...SITE_WORK_SERVICES, ...EQUIPMENT_SERVICES_PAGES];

export function equipmentServicesForDivision(
  division: EquipmentMarketingService["division"]
): EquipmentMarketingService[] {
  return ALL.filter((s) => s.division === division);
}

export function getEquipmentService(
  division: EquipmentMarketingService["division"],
  slug: string
): EquipmentMarketingService | undefined {
  return ALL.find((s) => s.division === division && s.slug === slug);
}

export function allEquipmentMarketingServices(): EquipmentMarketingService[] {
  return ALL;
}

export const DIVISION_HUB_COPY: Record<
  EquipmentMarketingService["division"],
  {
    title: string;
    description: string;
    h1: string;
    lede: string;
    tone: string;
    secondary: string[];
  }
> = {
  land_clearing: {
    title: "Land Clearing in Warrenton & East-Central Missouri | Morris Land Clearing",
    description:
      "Forestry mulching, brush clearing, lot clearing, and overgrown property reclamation from Morris Service Group. Upcoming project estimates for Warren County and nearby Missouri communities.",
    h1: "Morris Land Clearing",
    lede: "Reclaim overgrown acreage, restore usable property, open trails and fence lines, and control invasive vegetation — so the land is ready for its next use.",
    tone: "capable",
    secondary: [
      "Right-of-way and access clearing on private property",
      "Brush and tree pile cleanup",
      "Honeysuckle and invasive vegetation",
    ],
  },
  site_work: {
    title: "Site Work in Warrenton & East-Central Missouri | Morris Site Work",
    description:
      "Rough grading, site preparation, gravel spreading, dirt moving, and driveway grading from Morris Service Group. Upcoming estimates. Excavation is not a current service.",
    h1: "Morris Site Work",
    lede: "Practical dirt work with a standard bucket: rough grading, site preparation, gravel spreading, backfilling, and driveway maintenance. We do not advertise excavation, trenching, or drainage work until those services are listed.",
    tone: "practical",
    secondary: [
      "Construction and demolition site cleanup with a machine",
      "Material spreading when rock or dirt is already on site",
    ],
  },
  equipment_services: {
    title: "Skid Steer and Equipment Services | Morris Equipment Services",
    description:
      "Professional skid steer and Bobcat services, grapple work, and material handling in east-central Missouri. Independent contractor. Upcoming project estimates.",
    h1: "Skid Steer & Equipment Services",
    lede: "When you know you need a machine and an operator — for property cleanup, brush and log handling, material movement, gravel or dirt placement, rough grading, site preparation, storm debris, or construction cleanup.",
    tone: "direct",
    secondary: [
      "Construction cleanup and storm debris handling",
      "Equipment-assisted property cleanup",
      "Dirt and gravel placement",
    ],
  },
};
