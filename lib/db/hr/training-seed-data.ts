/**
 * Morris field training curriculum — source for migration 024 / seed script.
 */
export interface SeedLesson {
  id: string;
  title: string;
  overview: string;
  objectives: string[];
  contentHtml: string;
  sortOrder: number;
  minReadSeconds?: number;
}

export interface SeedQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  sortOrder: number;
}

export interface SeedCourse {
  id: string;
  name: string;
  description: string;
  category: string;
  expirationMonths: number;
  isRequired: boolean;
  sortOrder: number;
  lessons: SeedLesson[];
  questions: SeedQuestion[];
}

const p = (blocks: string[]) => blocks.map((b) => `<p>${b}</p>`).join("");

export const MORRIS_TRAINING_COURSES: SeedCourse[] = [
  {
    id: "tc-orientation",
    name: "Company Orientation",
    description: "Morris Hauling expectations, appearance, conduct, and customer service foundations.",
    category: "orientation",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 1,
    lessons: [
      {
        id: "tl-orient-1",
        title: "Welcome to Morris Hauling",
        overview: "Who we are and what we stand for.",
        objectives: ["State company mission", "Know chain of command", "Understand field expectations"],
        contentHtml: p([
          "Morris Junk Removal serves homeowners and businesses across the region with honest pricing, careful property protection, and respectful crews.",
          "Every employee represents the brand on every job. Punctuality, clean uniforms, and professional language are non-negotiable.",
          "Report to your crew leader or dispatcher for daily assignments. Safety concerns escalate immediately — never wait.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-orient-2",
        title: "Appearance & Conduct",
        overview: "Professional presence on customer property.",
        objectives: ["Meet uniform standards", "Follow phone/social media policy on jobs"],
        contentHtml: p([
          "Wear company shirt, work pants, and closed-toe boots. No offensive graphics. Keep shirts tucked when lifting.",
          "No smoking on customer property without explicit permission. Keep personal phones in pocket except for job photos or navigation.",
          "Treat every home like your own: knock, introduce yourself, ask about floor protection, and thank the customer before leaving.",
        ]),
        sortOrder: 2,
      },
      {
        id: "tl-orient-3",
        title: "Customer Service Basics",
        overview: "First impressions and communication.",
        objectives: ["Greet customers professionally", "Explain scope before starting work"],
        contentHtml: p([
          "Arrive in the window promised. Call ahead if delayed more than 15 minutes.",
          "Confirm what is included in the quote before loading. Point out items that may incur extra fees before moving them.",
          "End every job with a walkthrough and ask if anything was missed.",
        ]),
        sortOrder: 3,
      },
    ],
    questions: [
      { id: "tq-o1", question: "Who do you report to for daily assignments?", options: ["Crew leader or dispatcher", "Accounting", "Random customer", "Social media manager"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-o2", question: "When should you escalate a safety concern?", options: ["End of week", "Immediately", "Never", "After the job"], correctIndex: 1, sortOrder: 2 },
      { id: "tq-o3", question: "Appropriate footwear on jobs includes:", options: ["Sandals", "Closed-toe boots", "Bare feet", "Flip flops"], correctIndex: 1, sortOrder: 3 },
      { id: "tq-o4", question: "Personal phones on job sites should be:", options: ["Used freely", "Left in truck only for photos/nav", "For streaming music loudly", "Given to customer"], correctIndex: 1, sortOrder: 4 },
      { id: "tq-o5", question: "Before loading, you should:", options: ["Start immediately", "Confirm scope with customer", "Leave without talking", "Only text"], correctIndex: 1, sortOrder: 5 },
      { id: "tq-o6", question: "If running 20+ minutes late you should:", options: ["Say nothing", "Call ahead", "Skip the job", "Post online"], correctIndex: 1, sortOrder: 6 },
      { id: "tq-o7", question: "Floor protection should be:", options: ["Skipped to save time", "Offered/used per job", "Customer only", "Never discussed"], correctIndex: 1, sortOrder: 7 },
      { id: "tq-o8", question: "Morris brand values include:", options: ["Honest pricing and respect", "Hidden fees", "Property damage", "Rude service"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-safety",
    name: "Workplace Safety",
    description: "PPE, heat, winter hazards, and slip/fall prevention.",
    category: "safety",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 2,
    lessons: [
      {
        id: "tl-safe-1",
        title: "PPE Requirements",
        overview: "Required protective equipment for field work.",
        objectives: ["List required PPE", "Inspect PPE before shift"],
        contentHtml: p([
          "Minimum PPE: gloves, steel-toe boots, eye protection when cutting/drilling, hearing protection near loud equipment.",
          "Hard hats when overhead hazards exist. High-vis vest when working near traffic.",
          "Replace damaged PPE — torn gloves and cracked safety glasses do not protect you.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-safe-2",
        title: "Heat, Hydration & Winter",
        overview: "Weather-related illness prevention.",
        objectives: ["Recognize heat exhaustion", "Dress for cold loads"],
        contentHtml: p([
          "Summer: drink water every 30 minutes, take shade breaks, watch for dizziness or cramps in yourself and crew.",
          "Winter: layer clothing, watch for ice on ramps and trailer decks, keep hands warm for strap work.",
          "Never work alone in extreme heat without check-ins.",
        ]),
        sortOrder: 2,
      },
      {
        id: "tl-safe-3",
        title: "Slip, Trip & Fall",
        overview: "Common job-site hazards.",
        objectives: ["Identify slip hazards", "Use three points of contact"],
        contentHtml: p([
          "Wet grass, muddy driveways, and icy steps cause most field injuries. Slow down and plan your path.",
          "Use three points of contact entering/exiting truck cab and trailer.",
          "Clear debris from walking paths before carrying loads.",
        ]),
        sortOrder: 3,
      },
    ],
    questions: [
      { id: "tq-s1", question: "Minimum footwear is:", options: ["Sandals", "Steel-toe boots", "Crocs", "Barefoot"], correctIndex: 1, sortOrder: 1 },
      { id: "tq-s2", question: "Eye protection is required when:", options: ["Eating lunch", "Cutting or drilling", "Driving only", "Sleeping"], correctIndex: 1, sortOrder: 2 },
      { id: "tq-s3", question: "Heat exhaustion signs include:", options: ["Dizziness and cramps", "Extra energy only", "Nothing visible", "Improved focus"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-s4", question: "Hydration in summer should be:", options: ["Once a day", "About every 30 minutes", "Never on jobs", "Only soda"], correctIndex: 1, sortOrder: 4 },
      { id: "tq-s5", question: "Three points of contact means:", options: ["Two hands one foot or two feet one hand", "One hand only", "Jump from cab", "Run on ice"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-s6", question: "High-vis vests are used:", options: ["Near traffic", "Indoors only", "Never", "At home"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-s7", question: "Damaged PPE should be:", options: ["Replaced", "Taped and reused forever", "Ignored", "Shared"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-s8", question: "Icy trailer decks require:", options: ["Extra caution and slower movement", "Running", "No change", "Less straps"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-lifting",
    name: "Proper Lifting",
    description: "Safe lifting technique, team lifts, and injury prevention.",
    category: "lifting",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 3,
    lessons: [
      {
        id: "tl-lift-1",
        title: "Lifting Fundamentals",
        overview: "Protect your back on every load.",
        objectives: ["Demonstrate proper stance", "Know when to team lift"],
        contentHtml: p([
          "Feet shoulder-width, load close to body, bend knees not waist, lift with legs.",
          "Never twist while carrying — pivot with your feet.",
          "If over ~50 lbs awkward or above shoulders, get a partner or use equipment.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-lift-2",
        title: "Equipment Aids",
        overview: "Dollies, straps, and appliance carts.",
        objectives: ["Select correct tool", "Secure load on dolly"],
        contentHtml: p([
          "Use appliance dolly for fridges and washers. Furniture dolly for dressers and boxes.",
          "Strap loads to dolly before stairs. Blankets prevent scratches and improve grip.",
          "Inspect dollies for flat tires and broken straps before use.",
        ]),
        sortOrder: 2,
      },
      {
        id: "tl-lift-3",
        title: "Injury Response",
        overview: "What to do if hurt on the job.",
        objectives: ["Report injuries immediately", "Do not hide pain"],
        contentHtml: p([
          "Stop work if you feel sharp back pain, pop, or numbness. Tell your crew leader.",
          "Document what happened. Morris will guide workers comp if needed.",
          "Returning to heavy lifting before healing makes injuries worse.",
        ]),
        sortOrder: 3,
      },
    ],
    questions: [
      { id: "tq-l1", question: "Lift primarily with:", options: ["Back only", "Legs", "One arm twisted", "Momentum"], correctIndex: 1, sortOrder: 1 },
      { id: "tq-l2", question: "When carrying, avoid:", options: ["Twisting at the waist", "Keeping load close", "Planning path", "Team lifts"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-l3", question: "Team lift when load is:", options: ["Light and balanced", "Heavy or awkward", "Empty", "Already on truck"], correctIndex: 1, sortOrder: 3 },
      { id: "tq-l4", question: "Appliance dolly is best for:", options: ["Fridges and washers", "Paper clips", "Fuel only", "Sleeping"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-l5", question: "Before stairs with a dolly:", options: ["Strap the load", "Run quickly", "Tilt randomly", "Skip straps"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-l6", question: "Sharp back pain means:", options: ["Stop and report", "Hide it", "Lift more", "Leave site silently"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-l7", question: "Blankets help by:", options: ["Protecting surfaces and grip", "Decoration only", "Replacing straps", "Blocking vision"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-l8", question: "Feet should be:", options: ["Shoulder-width for stability", "Together always", "Crossed", "Off ground"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-appliance",
    name: "Appliance Removal",
    description: "Safely removing fridges, washers, and connected appliances.",
    category: "appliance_removal",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 4,
    lessons: [
      {
        id: "tl-app-1",
        title: "Preparation & Disconnects",
        overview: "Power, water, and gas safety.",
        objectives: ["Verify utilities disconnected", "Know when to refuse unsafe work"],
        contentHtml: p([
          "Customer or licensed tech must disconnect gas, water, and hardwired electric before move.",
          "Fridges: drain and secure doors. Cap lines if required locally.",
          "Never pull connected appliances — damage and injury risk.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-app-2",
        title: "Moving Heavy Appliances",
        overview: "Weight and path planning.",
        objectives: ["Use team lift and dolly", "Protect floors"],
        contentHtml: p([
          "Empty units first when possible. A full fridge exceeds safe solo lift.",
          "Use ramps and plywood over soft ground. Plan door removal if needed.",
          "Strap to dolly and truck wall — appliances are top-heavy.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-a1", question: "Gas appliances require:", options: ["Customer/pro disconnect before move", "Yanking the line", "No prep", "Open flame nearby"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-a2", question: "Full refrigerators should be:", options: ["Emptied when possible", "Solo carried always", "Dragged", "Left on site"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-a3", question: "Connected appliances:", options: ["Should not be pulled away connected", "Can be ripped out", "Need no planning", "Are light"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-a4", question: "Top-heavy loads need:", options: ["Straps and careful tipping", "Speed", "One person", "No dolly"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-a5", question: "Soft ground paths use:", options: ["Plywood/ramp planning", "Ignoring mud", "Bare wheels only", "Skipping protection"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-a6", question: "Fridge doors should be:", options: ["Secured for transport", "Left swinging open", "Removed always", "Taped shut only in rain"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-a7", question: "Hardwired electric requires:", options: ["Proper disconnect before move", "Cutting live wires yourself", "Guesswork", "Wet hands"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-a8", question: "Unsafe utility situation:", options: ["Stop and escalate", "Proceed anyway", "Hide from customer", "Leave appliance halfway"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-furniture",
    name: "Furniture Removal",
    description: "Sectionals, mattresses, pool tables, safes, and bulky items.",
    category: "furniture",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 5,
    lessons: [
      {
        id: "tl-furn-1",
        title: "Bulky Furniture Basics",
        overview: "Sectionals, dressers, and mattresses.",
        objectives: ["Disassemble when needed", "Protect walls and doors"],
        contentHtml: p([
          "Measure doorways and stairwells. Remove legs and doors when needed — bag hardware.",
          "Use furniture blankets on corners. Two-person minimum for sectionals on stairs.",
          "Mattresses: bag if required, stand on edge with two carriers.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-furn-2",
        title: "Specialty Items",
        overview: "Pool tables, safes, pianos.",
        objectives: ["Know when specialist required", "Never exceed crew capability"],
        contentHtml: p([
          "Pool tables and pianos often need pros — confirm with dispatch before promising.",
          "Small safes may need appliance dolly and 3+ crew. Floor protection critical.",
          "If customer understates weight, stop and re-quote before damage occurs.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-f1", question: "Before moving large furniture:", options: ["Measure path and doors", "Rush in blind", "Skip blankets", "One person only"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-f2", question: "Sectionals on stairs need:", options: ["Two+ people", "Solo carry", "Dragging", "No planning"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-f3", question: "Removed hardware should be:", options: ["Bagged and labeled", "Lost", "Left on lawn", "Thrown away"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-f4", question: "Pool tables often require:", options: ["Specialist/disassembly plan", "Solo tip", "No quote change", "Ignoring slate weight"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-f5", question: "Underestimated weight means:", options: ["Stop and re-quote", "Damage property silently", "Abandon customer", "Hide damage"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-f6", question: "Mattresses on stairs:", options: ["Two carriers, controlled edge carry", "Fold in half always", "Drag", "Throw"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-f7", question: "Wall protection uses:", options: ["Blankets and corner guards", "Bare metal", "Speed only", "Nothing"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-f8", question: "Pianos should be:", options: ["Confirmed with dispatch before promising", "Always included free", "Dropped", "Rolled without equipment"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-trailer",
    name: "Trailer Loading",
    description: "Weight distribution, tongue weight, stacking, and customer property.",
    category: "trailer_loading",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 6,
    lessons: [
      {
        id: "tl-trl-1",
        title: "Load Planning",
        overview: "Balance and tongue weight.",
        objectives: ["Place heavy items low and forward", "Avoid rear-heavy loads"],
        contentHtml: p([
          "Heaviest items go low, centered over axles, slightly forward of center.",
          "Too much weight at rear causes sway; too much tongue weight overloads hitch.",
          "Distribute side-to-side — don't stack all weight on one fender.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-trl-2",
        title: "Stacking & Customer Property",
        overview: "Protecting loads and surroundings.",
        objectives: ["Stack stable", "Protect driveway and lawn"],
        contentHtml: p([
          "Build stable layers — heavy base, lighter top. Fill voids so nothing shifts.",
          "Use plywood under dollies on soft driveways. Pick up stray debris before leaving.",
          "Never overload trailer GVWR — check placard.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-tr1", question: "Heaviest items go:", options: ["Low over axles, slightly forward", "High at rear", "Roof only", "One side only"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-tr2", question: "Rear-heavy trailers:", options: ["Can sway dangerously", "Are always safer", "Need no straps", "Improve MPG only"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-tr3", question: "GVWR means:", options: ["Max rated trailer weight", "Tire pressure", "Fuel level", "Driver age"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-tr4", question: "Void spaces in load should be:", options: ["Filled to prevent shift", "Left empty always", "Ignored", "Filled with people"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-tr5", question: "Soft driveways need:", options: ["Plywood/path protection", "Spinning tires", "Heavy concentration in one spot", "Nothing"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-tr6", question: "Side-to-side weight should be:", options: ["Balanced", "All on left", "All on right", "Random"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-tr7", question: "Before leaving site:", options: ["Walk property for stray debris", "Speed away", "Leave doors open", "Skip customer"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-tr8", question: "Tongue weight too high:", options: ["Overloads hitch/vehicle", "Improves braking only", "Is always fine", "Means empty trailer"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-securement",
    name: "Load Securement",
    description: "Straps, nets, tarps, and retighten checks.",
    category: "securement",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 7,
    lessons: [
      {
        id: "tl-sec-1",
        title: "Straps & Nets",
        overview: "DOT-style securement basics.",
        objectives: ["Apply ratchet straps correctly", "Use angle and tension"],
        contentHtml: p([
          "Minimum four points on large loads. Straps at 45° angles when possible.",
          "Protect strap webbing from sharp edges with blankets or edge protectors.",
          "Ratchet until snug — not so tight you crush furniture unnecessarily.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-sec-2",
        title: "En Route Checks",
        overview: "Retighten after first miles.",
        objectives: ["Stop and check within 5–10 miles", "Re-tighten after bumps"],
        contentHtml: p([
          "Loads settle — recheck straps after leaving customer and after first highway segment.",
          "Tarps and nets: verify hooks and grommets. Replace frayed straps immediately.",
          "If anything moves, stop safely and re-secure before continuing.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-se1", question: "Large loads need:", options: ["Multiple strap points", "One bungee", "Hope", "No straps"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-se2", question: "Sharp edges require:", options: ["Edge protection for straps", "Bare metal on webbing", "Cutting straps", "Ignoring"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-se3", question: "First retighten check within:", options: ["5–10 miles of departure", "100 miles only", "Never", "Next week"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-se4", question: "Frayed straps:", options: ["Replace immediately", "Use anyway", "Tie in knot only", "Hide"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-se5", question: "If load shifts while driving:", options: ["Stop safely and re-secure", "Speed up", "Ignore", "Film it"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-se6", question: "Strap angle ideal is often:", options: ["About 45 degrees", "Vertical only", "Horizontal only", "Zero tension"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-se7", question: "Nets and tarps need:", options: ["Verified hooks/grommets", "One corner loose", "No checks", "Wind only"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-se8", question: "Ratchet tension should be:", options: ["Snug without crushing needlessly", "Maximum always", "Loose", "Removed on highway"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-driving",
    name: "Defensive Driving",
    description: "Backing, spotters, weather, trailer turning, pre/post-trip.",
    category: "driving",
    expirationMonths: 24,
    isRequired: true,
    sortOrder: 8,
    lessons: [
      {
        id: "tl-drv-1",
        title: "Backing & Spotters",
        overview: "Never back blind with trailer.",
        objectives: ["Use spotter every time", "Hand signals agreement"],
        contentHtml: p([
          "Get out and look (GOAL) before backing in tight areas. Spotter visible in mirror always.",
          "Agree on hand signals before moving. Stop if you lose sight of spotter.",
          "Take wide turns — trailer cuts inside.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-drv-2",
        title: "Pre & Post Trip",
        overview: "Daily vehicle walkaround.",
        objectives: ["Check tires, lights, hitch", "Report defects before roll"],
        contentHtml: p([
          "Pre-trip: tires, lights, mirrors, hitch pin, safety chains, brake lights with trailer plugged.",
          "Post-trip: note new damage, fluid leaks, tire issues in fleet log.",
          "Weather: increase following distance in rain; avoid sudden lane changes with trailer.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-d1", question: "GOAL stands for:", options: ["Get Out And Look", "Go On All Lanes", "Gas Only At Lunch", "None"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-d2", question: "Trailer turns:", options: ["Cut inside — go wide", "Same as car", "Sharper than car", "Need no adjustment"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-d3", question: "If spotter not visible:", options: ["Stop immediately", "Speed up", "Guess", "Honk continuously"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-d4", question: "Pre-trip includes:", options: ["Hitch, chains, lights", "Only fuel", "Skipping tires", "Interior detail only"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-d5", question: "Rain with trailer means:", options: ["More following distance", "Tailgate", "No change", "Disable brakes"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-d6", question: "New vehicle damage:", options: ["Log and report", "Hide", "Blame customer always", "Ignore"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-d7", question: "Safety chains are:", options: ["Required backup connection", "Optional decoration", "Removed on highway", "For aesthetics"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-d8", question: "Hand signals should be:", options: ["Agreed before backing", "Random", "Ignored", "Only at night"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-equipment",
    name: "Equipment Usage",
    description: "Dollies, straps, blankets, ramps, winch, and power tools.",
    category: "equipment",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 9,
    lessons: [
      {
        id: "tl-eq-1",
        title: "Hand Equipment",
        overview: "Dollies, ramps, blankets.",
        objectives: ["Inspect before use", "Return clean and functional"],
        contentHtml: p([
          "Check dollies for broken straps and flat tires. Ramps rated for load — never exceed capacity.",
          "Blankets fold and store dry. Wet blankets mildew in truck.",
          "Report damage at end of shift — next crew depends on it.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-eq-2",
        title: "Power Tools & Winch",
        overview: "Safe operation only if trained.",
        objectives: ["PPE for cutting", "Winch line safety"],
        contentHtml: p([
          "Eye and hearing protection for saws and drivers. Clear area of bystanders.",
          "Winch: stand clear of line under tension. Use hooks and rated points only.",
          "Unplug batteries when storing. No improvised blades or bits.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-e1", question: "Damaged dollies should be:", options: ["Reported before next use", "Hidden", "Used anyway", "Thrown in load"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-e2", question: "Ramp capacity:", options: ["Must not be exceeded", "Is optional", "Doubles with speed", "Ignores weight"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-e3", question: "Wet blankets should be:", options: ["Dried before storage", "Left balled wet", "Discarded always", "Burned on site"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-e4", question: "Winch line under tension:", options: ["Stand clear", "Stand over it", "Wrap around hand", "Cut it"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-e5", question: "Power cutting requires:", options: ["Eye/hearing protection", "No PPE", "Crowd close by", "Wet hands"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-e6", question: "Batteries on tools:", options: ["Removed for storage when policy says", "Left on forever", "In rain open", "Given to customer"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-e7", question: "Equipment return expectation:", options: ["Clean and functional", "Broken silently", "Missing okay", "Customer keeps it"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-e8", question: "Improvised blades/bits:", options: ["Not allowed", "Encouraged", "Required", "Safer"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-customer",
    name: "Customer Service",
    description: "Greeting, floors, complaints, upsell, payment, photos, reviews.",
    category: "customer_service",
    expirationMonths: 12,
    isRequired: false,
    sortOrder: 10,
    lessons: [
      {
        id: "tl-cs-1",
        title: "On-Site Excellence",
        overview: "Every touchpoint matters.",
        objectives: ["Professional greeting", "Floor protection offer"],
        contentHtml: p([
          "Knock, smile, introduce team and company. Confirm quote scope in customer words.",
          "Offer floor runners in homes. Shoe covers when requested.",
          "Keep language positive — never argue on site.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-cs-2",
        title: "Upsell, Payment & Reviews",
        overview: "Ethical revenue and closing.",
        objectives: ["Offer additional items professionally", "Collect payment per policy"],
        contentHtml: p([
          "If customer points at more junk, offer revised price before loading extras.",
          "Payment: follow office policy — card, check, or invoice as quoted.",
          "Ask happy customers for Google review — show QR if provided.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-c1", question: "On arrival you should:", options: ["Introduce team and confirm scope", "Start loading silent", "Honk only", "Leave"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-c2", question: "Floor protection:", options: ["Offer runners/covers", "Never mention", "Damage floors", "Skip always"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-c3", question: "Customer wants more items loaded:", options: ["Re-quote before loading", "Load free", "Refuse rudely", "Hide fees"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-c4", question: "On-site disputes:", options: ["Stay calm, call dispatcher", "Yell", "Walk off", "Post online live"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-c5", question: "Payment collection follows:", options: ["Office/quote policy", "Personal preference", "Cash only always hidden", "Skip"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-c6", question: "Happy customers may be asked for:", options: ["Google review", "Social media fight", "Free work next week", "Nothing ever"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-c7", question: "Professional language means:", options: ["Positive and respectful", "Slang insults", "Ignoring customer", "Arguing"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-c8", question: "Before leaving:", options: ["Walkthrough with customer", "Drive away fast", "Leave mess", "Skip goodbye"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-route",
    name: "Route Procedures",
    description: "Clock in through yard, stops, dump, clock out.",
    category: "route",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 11,
    lessons: [
      {
        id: "tl-rt-1",
        title: "Start of Day",
        overview: "Clock in to yard routine.",
        objectives: ["Clock in on time", "Pre-trip and load-out"],
        contentHtml: p([
          "Clock in via employee portal or timeclock when starting paid time.",
          "Yard: fuel, equipment check, review route with leader. Don't roll without dispatch release.",
          "Verify dump tickets and landfill hours for the day.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-rt-2",
        title: "Stops, Dump & Clock Out",
        overview: "Executing the route.",
        objectives: ["Job order efficiency", "Proper dump documentation"],
        contentHtml: p([
          "Follow dispatch order unless re-routed. Mark job complete in system with photos if required.",
          "Dump only at approved facilities. Keep tickets for office.",
          "Clock out after truck secured, equipment stowed, and paperwork submitted.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-r1", question: "Paid time starts with:", options: ["Proper clock in", "First customer only", "Lunch", "Never recording"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-r2", question: "Before rolling from yard:", options: ["Dispatch release and pre-trip", "Immediate highway", "Skip fuel", "No equipment check"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-r3", question: "Dump tickets:", options: ["Kept for office", "Thrown away", "Given to customer", "Burned"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-r4", question: "Job order changes come from:", options: ["Dispatcher/leader", "Random choice", "Customer yelling", "Social media"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-r5", question: "Approved dumps only means:", options: ["No illegal dumping", "Any field okay", "Customer backyard", "River"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-r6", question: "End of day clock out after:", options: ["Truck secured and paperwork done", "Leaving load loose", "Mid-route", "Never"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-r7", question: "Required job photos:", options: ["Taken when policy requires", "Never", "Only selfies", "Customer house only"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-r8", question: "Landfill hours should be:", options: ["Verified before route", "Ignored", "Assumed 24h", "Guess"], correctIndex: 0, sortOrder: 8 },
    ],
  },
  {
    id: "tc-emergency",
    name: "Emergency Procedures",
    description: "Accident, injury, 911, fire, and property damage response.",
    category: "emergency",
    expirationMonths: 12,
    isRequired: true,
    sortOrder: 12,
    lessons: [
      {
        id: "tl-em-1",
        title: "Injury & Medical",
        overview: "When someone is hurt.",
        objectives: ["Call 911 when needed", "Notify supervisor immediately"],
        contentHtml: p([
          "Life-threatening: call 911 first, then supervisor. Do not move seriously injured unless immediate danger.",
          "Minor cuts: first aid kit, gloves, report in incident log same day.",
          "Workers comp paperwork starts with timely reporting — delays hurt claims.",
        ]),
        sortOrder: 1,
      },
      {
        id: "tl-em-2",
        title: "Accident, Fire & Property Damage",
        overview: "Vehicle and customer property events.",
        objectives: ["Secure scene", "Document with photos"],
        contentHtml: p([
          "Accident: hazards on, call police if injuries or major damage. Exchange info, photos, no fault admissions.",
          "Fire: evacuate, 911, extinguish only if trained and safe.",
          "Customer property damage: stop, tell customer and dispatcher, photo document before leaving.",
        ]),
        sortOrder: 2,
      },
    ],
    questions: [
      { id: "tq-em1", question: "Life-threatening injury:", options: ["911 then supervisor", "Finish job first", "Hide", "Post video"], correctIndex: 0, sortOrder: 1 },
      { id: "tq-em2", question: "Serious injury movement:", options: ["Don't move unless immediate danger", "Always drag", "For photo", "Ignore"], correctIndex: 0, sortOrder: 2 },
      { id: "tq-em3", question: "Vehicle accident with injuries:", options: ["Call police", "Leave scene", "Delete evidence", "Argue on road"], correctIndex: 0, sortOrder: 3 },
      { id: "tq-em4", question: "At accident scene admit fault:", options: ["Avoid — exchange info and photos", "Always yell guilty", "Run", "Blame customer always"], correctIndex: 0, sortOrder: 4 },
      { id: "tq-em5", question: "Fire response:", options: ["Evacuate and call 911", "Hide in truck", "Continue loading", "Film only"], correctIndex: 0, sortOrder: 5 },
      { id: "tq-em6", question: "Customer property damage:", options: ["Stop, notify, document", "Hide and leave", "Deny always", "Fix secretly"], correctIndex: 0, sortOrder: 6 },
      { id: "tq-em7", question: "Minor cut treatment:", options: ["First aid and report", "Ignore", "Keep working bleeding on load", "Customer bandages"], correctIndex: 0, sortOrder: 7 },
      { id: "tq-em8", question: "Workers comp needs:", options: ["Timely incident report", "Silent injury", "Next year paperwork", "No supervisor"], correctIndex: 0, sortOrder: 8 },
    ],
  },
];

export const ONBOARDING_COURSE_LINKS: Record<string, string> = {
  safety_training: "tc-safety",
  lift_training: "tc-lifting",
  vehicle_training: "tc-driving",
};
