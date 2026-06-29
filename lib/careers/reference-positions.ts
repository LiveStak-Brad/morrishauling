import type { CareerCategory, EmploymentType, HiringMode } from "@/types/hr/ats";

export interface ReferencePositionSeed {
  id: string;
  slug: string;
  title: string;
  category: CareerCategory;
  departmentLabel: string;
  employmentType: EmploymentType;
  schedule: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave?: string;
  growthPath?: string;
  payRangeMin?: number;
  payRangeMax?: number;
  payNote?: string;
  location: string;
  hiringMode: HiringMode;
  sortOrder: number;
}

const LOCATION = "Warren, Lincoln & St. Charles Counties, MO";

export const REFERENCE_POSITIONS: ReferencePositionSeed[] = [
  {
    id: "posting-junk-removal-helper",
    slug: "junk-removal-helper",
    title: "Junk Removal Helper",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, 7 AM–5 PM; occasional Saturdays",
    description:
      "Join our field crew loading junk, furniture, and debris from homes and businesses. This is a hands-on role for reliable people who want to learn the hauling trade.",
    responsibilities:
      "• Load and secure items on trucks\n• Protect customer property during removal\n• Follow safety and lifting procedures\n• Assist drivers with on-site estimates when needed",
    requirements:
      "• Ability to lift 75+ lbs repeatedly\n• Valid driver's license preferred\n• Reliable transportation to yard/meet point\n• Positive attitude and teamwork",
    niceToHave: "Prior labor, moving, or warehouse experience",
    growthPath: "Helpers who show up consistently and learn the job can advance to Junk Removal Driver.",
    payNote: "Pay based on experience",
    location: LOCATION,
    hiringMode: "accepting_interest",
    sortOrder: 10,
  },
  {
    id: "posting-junk-removal-driver",
    slug: "junk-removal-driver",
    title: "Junk Removal Driver",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, 7 AM–5 PM",
    description:
      "Drive company trucks to job sites, lead small crews, and deliver professional junk removal service across our service area.",
    responsibilities:
      "• Operate box trucks safely on local routes\n• Lead helpers on residential and commercial jobs\n• Communicate with dispatch and customers\n• Complete job paperwork and disposal runs",
    requirements:
      "• Valid driver's license with clean driving record\n• Ability to lift 75+ lbs\n• 1+ year driving experience preferred\n• Professional customer service",
    niceToHave: "Box truck or commercial driving experience",
    growthPath: "Drivers can grow into Crew Leader and help train new team members.",
    payRangeMin: 18,
    payRangeMax: 24,
    location: LOCATION,
    hiringMode: "accepting_interest",
    sortOrder: 20,
  },
  {
    id: "posting-crew-leader",
    slug: "crew-leader",
    title: "Crew Leader",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, 7 AM–5 PM",
    description:
      "Run daily crews, ensure quality service, and keep jobs moving efficiently from arrival to disposal.",
    responsibilities:
      "• Lead 2–3 person crews on job sites\n• Train helpers and drivers\n• Quality-check loads and customer satisfaction\n• Report issues to operations",
    requirements:
      "• 2+ years junk removal or hauling experience\n• Valid driver's license\n• Leadership and problem-solving skills\n• Strong safety mindset",
    growthPath: "Crew Leaders may advance into Operations or dispatch leadership roles.",
    payRangeMin: 22,
    payRangeMax: 28,
    location: LOCATION,
    hiringMode: "hiring_soon",
    sortOrder: 30,
  },
  {
    id: "posting-hauling-transport-driver",
    slug: "hauling-transport-driver",
    title: "Hauling / Transport Driver",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_full_time",
    schedule: "Varies by route; early mornings common",
    description:
      "Transport materials, equipment, and loads between job sites, yards, and disposal facilities.",
    responsibilities:
      "• Operate trucks for hauling and transport\n• Secure loads per DOT and company standards\n• Coordinate with dispatch on routes\n• Maintain vehicle cleanliness and pre-trip checks",
    requirements:
      "• Valid driver's license; CDL a plus\n• Clean MVR\n• Ability to lift 50+ lbs\n• Reliable attendance",
    niceToHave: "CDL Class B, DOT medical card",
    payNote: "Pay based on experience; CDL premium available",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 40,
  },
  {
    id: "posting-equipment-operator",
    slug: "equipment-operator",
    title: "Equipment Operator",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_full_time",
    schedule: "Project-based; typically weekdays",
    description:
      "Operate skid steers, mini excavators, or other equipment for cleanouts, lot clearing, and specialty hauling projects.",
    responsibilities:
      "• Operate equipment safely on job sites\n• Coordinate with crew for loading and clearing\n• Perform basic equipment inspections\n• Follow site safety protocols",
    requirements:
      "• Equipment operation experience\n• Valid driver's license\n• Safety-conscious work habits\n• Ability to work outdoors in varied conditions",
    payNote: "Pay based on experience and certifications",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 50,
  },
  {
    id: "posting-weekend-helper",
    slug: "part-time-weekend-helper",
    title: "Part-Time Weekend Helper",
    category: "field_operations",
    departmentLabel: "Field Operations",
    employmentType: "w2_part_time",
    schedule: "Saturdays; occasional Sundays during busy season",
    description:
      "Flexible weekend role supporting our field crews during peak demand. Great for students or anyone seeking supplemental income.",
    responsibilities:
      "• Assist with loading and site cleanup\n• Follow crew leader direction\n• Maintain professional appearance with customers",
    requirements:
      "• Ability to lift 75+ lbs\n• Reliable transportation\n• Available most Saturdays",
    payRangeMin: 16,
    payRangeMax: 20,
    location: LOCATION,
    hiringMode: "accepting_interest",
    sortOrder: 60,
  },
  {
    id: "posting-dispatcher",
    slug: "dispatcher",
    title: "Dispatcher",
    category: "dispatch_office",
    departmentLabel: "Dispatch / Office",
    employmentType: "office_staff",
    schedule: "Monday–Friday, 7 AM–4 PM; on-call rotation possible",
    description:
      "Schedule crews, route jobs, and keep customers informed. The dispatcher is the hub between the field and the office.",
    responsibilities:
      "• Schedule jobs and assign crews\n• Route trucks efficiently\n• Handle customer calls and updates\n• Track job status in the system",
    requirements:
      "• Strong communication and multitasking\n• Computer and phone skills\n• Calm under pressure\n• Local area knowledge a plus",
    growthPath: "Dispatchers can grow into Operations Manager as the company scales.",
    payRangeMin: 17,
    payRangeMax: 22,
    location: LOCATION,
    hiringMode: "accepting_interest",
    sortOrder: 70,
  },
  {
    id: "posting-customer-service",
    slug: "customer-service-representative",
    title: "Customer Service Representative",
    category: "dispatch_office",
    departmentLabel: "Dispatch / Office",
    employmentType: "office_staff",
    schedule: "Monday–Friday, 8 AM–5 PM",
    description:
      "Answer calls and messages, book jobs, and provide friendly, accurate information to customers.",
    responsibilities:
      "• Answer phones, texts, and web inquiries\n• Schedule appointments and send confirmations\n• Document customer requests accurately\n• Escalate complex issues to management",
    requirements:
      "• Clear verbal and written communication\n• Customer service experience\n• Basic computer skills\n• Professional phone manner",
    growthPath: "Customer service reps can move into Estimator or dispatch roles.",
    payRangeMin: 16,
    payRangeMax: 20,
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 80,
  },
  {
    id: "posting-estimator",
    slug: "estimator",
    title: "Estimator",
    category: "dispatch_office",
    departmentLabel: "Dispatch / Office",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday; some field travel for on-site quotes",
    description:
      "Provide accurate quotes for junk removal and hauling jobs, both remotely and on-site.",
    responsibilities:
      "• Review job photos and details for pricing\n• Conduct on-site estimates when needed\n• Explain pricing clearly to customers\n• Coordinate with dispatch on job scope",
    requirements:
      "• Experience in estimates or sales in service trades\n• Valid driver's license\n• Strong math and communication skills\n• Detail-oriented",
    payNote: "Pay based on experience; commission potential",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 90,
  },
  {
    id: "posting-office-assistant",
    slug: "office-assistant",
    title: "Office Assistant",
    category: "dispatch_office",
    departmentLabel: "Dispatch / Office",
    employmentType: "office_staff",
    schedule: "Monday–Friday, 8 AM–5 PM",
    description:
      "Support daily office operations including filing, data entry, and administrative tasks.",
    responsibilities:
      "• Data entry and document organization\n• Assist with invoicing and customer records\n• Order office supplies\n• Support HR and operations as needed",
    requirements:
      "• Organized and dependable\n• Microsoft Office or Google Workspace skills\n• Professional demeanor",
    payRangeMin: 15,
    payRangeMax: 19,
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 100,
  },
  {
    id: "posting-sales-rep",
    slug: "sales-representative",
    title: "Sales Representative",
    category: "business_growth",
    departmentLabel: "Business / Growth",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday; some evenings for follow-ups",
    description:
      "Grow residential and commercial revenue through outbound outreach, referrals, and relationship building.",
    responsibilities:
      "• Prospect new customers and partners\n• Follow up on leads from marketing\n• Represent Morris Hauling professionally in the community\n• Track pipeline in CRM",
    requirements:
      "• Sales or business development experience\n• Valid driver's license\n• Self-motivated and goal-oriented",
    payNote: "Base plus commission based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 110,
  },
  {
    id: "posting-commercial-accounts",
    slug: "commercial-accounts-manager",
    title: "Commercial Accounts Manager",
    category: "business_growth",
    departmentLabel: "Business / Growth",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, flexible for client meetings",
    description:
      "Manage recurring commercial accounts including property managers, contractors, and businesses.",
    responsibilities:
      "• Maintain relationships with commercial clients\n• Coordinate recurring service schedules\n• Resolve account issues quickly\n• Identify upsell opportunities",
    requirements:
      "• B2B account management experience\n• Strong communication and negotiation skills\n• Valid driver's license",
    payNote: "Pay based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 120,
  },
  {
    id: "posting-marketing-assistant",
    slug: "marketing-social-media-assistant",
    title: "Marketing / Social Media Assistant",
    category: "business_growth",
    departmentLabel: "Business / Growth",
    employmentType: "w2_part_time",
    schedule: "Flexible; 15–25 hours per week",
    description:
      "Help tell the Morris Hauling story online through social media, reviews, and local marketing support.",
    responsibilities:
      "• Post to social channels and respond to comments\n• Plan post-launch campaigns to gather customer feedback\n• Assist with photos and simple content creation\n• Track basic marketing metrics",
    requirements:
      "• Social media experience\n• Writing and basic photo editing skills\n• Familiarity with local business marketing",
    payRangeMin: 15,
    payRangeMax: 20,
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 130,
  },
  {
    id: "posting-bookkeeper",
    slug: "bookkeeper-accountant",
    title: "Bookkeeper / Accountant",
    category: "business_growth",
    departmentLabel: "Business / Growth",
    employmentType: "office_staff",
    schedule: "Monday–Friday, 8 AM–5 PM",
    description:
      "Support financial operations including AP/AR, reconciliations, and reporting as we grow.",
    responsibilities:
      "• Process invoices and payments\n• Reconcile accounts and assist with payroll data\n• Maintain organized financial records\n• Support tax prep with external accountant",
    requirements:
      "• Bookkeeping or accounting experience\n• QuickBooks or similar software\n• Attention to detail and confidentiality",
    payNote: "Pay based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 140,
  },
  {
    id: "posting-operations-manager",
    slug: "operations-manager",
    title: "Operations Manager",
    category: "business_growth",
    departmentLabel: "Business / Growth",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday; field presence as needed",
    description:
      "Oversee daily field and dispatch operations, crew performance, and service quality.",
    responsibilities:
      "• Manage crews, routes, and dispatch coordination\n• Improve processes and safety programs\n• Hire and develop field leadership\n• Report KPIs to ownership",
    requirements:
      "• 3+ years operations leadership in trades or hauling\n• Valid driver's license\n• Strong leadership and problem-solving",
    payNote: "Salary based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 150,
  },
  {
    id: "posting-mechanic",
    slug: "mechanic-fleet-maintenance",
    title: "Mechanic / Fleet Maintenance",
    category: "future_specialty",
    departmentLabel: "Future / Specialty",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, shop hours",
    description:
      "Maintain and repair company trucks and equipment to keep our fleet on the road.",
    responsibilities:
      "• Perform preventive maintenance on fleet vehicles\n• Diagnose and repair mechanical issues\n• Track maintenance records\n• Coordinate with vendors for major repairs",
    requirements:
      "• Automotive or diesel mechanic experience\n• Own tools preferred\n• Valid driver's license",
    payNote: "Pay based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 160,
  },
  {
    id: "posting-disposal-coordinator",
    slug: "disposal-recycling-coordinator",
    title: "Disposal & Recycling Coordinator",
    category: "future_specialty",
    departmentLabel: "Future / Specialty",
    employmentType: "office_staff",
    schedule: "Monday–Friday, 8 AM–5 PM",
    description:
      "Coordinate disposal routes, vendor relationships, and recycling compliance as volume grows.",
    responsibilities:
      "• Manage disposal site relationships and pricing\n• Track load tickets and compliance\n• Optimize disposal routing with operations\n• Report on diversion and costs",
    requirements:
      "• Logistics or operations coordination experience\n• Organized and analytical\n• Valid driver's license a plus",
    payNote: "Pay based on experience",
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 170,
  },
  {
    id: "posting-warehouse-yard",
    slug: "warehouse-yard-assistant",
    title: "Warehouse / Yard Assistant",
    category: "future_specialty",
    departmentLabel: "Future / Specialty",
    employmentType: "w2_full_time",
    schedule: "Monday–Friday, 7 AM–4 PM",
    description:
      "Organize the yard, stage equipment, and support inventory as we expand facilities.",
    responsibilities:
      "• Organize yard and storage areas\n• Stage equipment for daily routes\n• Assist with inventory counts\n• Maintain a safe, clean work environment",
    requirements:
      "• Ability to lift 75+ lbs\n• Forklift experience a plus\n• Reliable attendance",
    payRangeMin: 16,
    payRangeMax: 20,
    location: LOCATION,
    hiringMode: "future_opening",
    sortOrder: 180,
  },
];

export const GENERAL_INTEREST_POSITION: ReferencePositionSeed = {
  id: "posting-general-interest",
  slug: "general-interest",
  title: "General Application / Future Opportunity",
  category: "field_operations",
  departmentLabel: "All Departments",
  employmentType: "w2_full_time",
  schedule: "Flexible — tell us your availability",
  description:
    "Not sure which role fits? Submit a general application and we'll keep your information on file for current and future openings.",
  responsibilities: "We'll match your skills and interests to the right role as positions open.",
  requirements: "Reliable, motivated, and interested in growing with Morris Hauling.",
  location: LOCATION,
  hiringMode: "accepting_interest",
  sortOrder: 0,
};

export const ALL_REFERENCE_POSITIONS = [GENERAL_INTEREST_POSITION, ...REFERENCE_POSITIONS];

export function referenceToJobPosting(seed: ReferencePositionSeed) {
  return {
    id: seed.id,
    companyId: "morris-hauling",
    title: seed.title,
    slug: seed.slug,
    description: seed.description,
    requirements: seed.requirements,
    responsibilities: seed.responsibilities,
    niceToHave: seed.niceToHave,
    growthPath: seed.growthPath,
    employmentType: seed.employmentType,
    payRangeMin: seed.payRangeMin,
    payRangeMax: seed.payRangeMax,
    payRangeUnit: "hourly" as const,
    payNote: seed.payNote,
    location: seed.location,
    schedule: seed.schedule,
    category: seed.category,
    departmentLabel: seed.departmentLabel,
    hiringMode: seed.hiringMode,
    isReferenceTemplate: true,
    isRemote: false,
    status: "published" as const,
    publishedAt: new Date().toISOString(),
    sortOrder: seed.sortOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
