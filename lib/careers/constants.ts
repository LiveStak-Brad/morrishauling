import type { CareerCategory, HiringMode } from "@/types/hr/ats";
import { PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";

export const CAREER_CATEGORIES: { id: CareerCategory; label: string }[] = [
  { id: "field_operations", label: "Field Operations" },
  { id: "dispatch_office", label: "Dispatch / Office" },
  { id: "business_growth", label: "Business / Growth" },
  { id: "future_specialty", label: "Future / Specialty" },
];

export const HIRING_MODE_LABELS: Record<HiringMode, string> = {
  active_hiring: "Active hiring",
  accepting_interest: "Accepting interest",
  future_opening: "Future opening",
  hiring_soon: "Hiring soon",
  hidden: "Hidden",
};

export const HIRING_MODE_VARIANT: Record<HiringMode, "default" | "secondary" | "outline"> = {
  active_hiring: "default",
  accepting_interest: "secondary",
  future_opening: "outline",
  hiring_soon: "secondary",
  hidden: "outline",
};

export const EMPLOYMENT_LABELS: Record<string, string> = {
  w2_full_time: "Full Time",
  w2_part_time: "Part Time",
  "1099_contractor": "Contractor",
  seasonal: "Seasonal",
  temporary: "Temporary",
  office_staff: "Office",
};

export const CAREERS_BENEFITS = [
  {
    title: "Fair compensation",
    description: "Competitive pay planned for launch roles, with room to grow as you take on more responsibility.",
  },
  {
    title: "Training & advancement",
    description: "Learn the trade on the job and move up from helper to driver to crew leader.",
  },
  {
    title: "Professional standards",
    description: "Join a team built around reliability, safety, and doing the job right.",
  },
  {
    title: "Local service area",
    description: `Preparing to serve ${PRELAUNCH_SERVICE_AREA}.`,
  },
  {
    title: "Equipment for field roles",
    description: "Company trucks, tools, and safety gear planned for field positions at launch.",
  },
  {
    title: "Growing company",
    description: "Join early and help shape operations as Morris Hauling prepares to launch.",
  },
];

export const GROWTH_PATHS = [
  { from: "Junk Removal Helper", to: "Junk Removal Driver", note: "Build skills on the truck and earn your spot behind the wheel." },
  { from: "Junk Removal Driver", to: "Crew Leader", note: "Lead jobsites, train new helpers, and run efficient crews." },
  { from: "Dispatcher", to: "Operations Manager", note: "Grow from scheduling routes to overseeing daily operations." },
  { from: "Customer Service Rep", to: "Estimator", note: "Move from intake calls to on-site quotes and pricing." },
];

export const APPLY_PROCESS_STEPS = [
  { step: "1", title: "Submit Application", description: "Complete the form and upload your resume. Future-role applications are welcome." },
  { step: "2", title: "HR Review", description: "Our team reviews your experience, availability, and fit for Morris Hauling." },
  { step: "3", title: "Phone Screen", description: "A short call to discuss the role, schedule, and next steps." },
  { step: "4", title: "Interview & Offer", description: "Meet the team, complete any required checks, and receive an offer if it's a match." },
];
