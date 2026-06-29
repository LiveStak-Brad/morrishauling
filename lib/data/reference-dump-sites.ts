/**
 * Real public/commercial disposal reference data for Morris Hauling service area.
 * Reference data — not customer business records. Verify fees/hours with each facility before quoting.
 */

export type ReferenceDumpSiteSeed = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  acceptedMaterials: string[];
  restrictions?: string;
  feeType: "flat" | "weight" | "volume" | "mixed";
  baseFee?: number;
  perTonFee?: number;
  minimumFee?: number;
  hoursJson?: Record<string, string>;
  notes?: string;
};

export const REFERENCE_DUMP_SITES: ReferenceDumpSiteSeed[] = [
  {
    id: "ref-st-charles-recycle-works",
    name: "St. Charles County Recycle Works",
    address: "60 Earth Way",
    city: "St. Charles",
    state: "MO",
    zip: "63301",
    county: "St. Charles",
    latitude: 38.7892,
    longitude: -90.5158,
    phone: "(636) 949-1800",
    website: "https://www.sccmo.org/164/Recycle-Works",
    acceptedMaterials: ["general_junk", "construction_debris", "yard_waste", "bulky_special"],
    restrictions: "County facility — verify commercial hauler requirements and tipping procedures.",
    feeType: "mixed",
    baseFee: 52,
    perTonFee: 42,
    minimumFee: 45,
    hoursJson: { mon: "7:30 AM – 4:30 PM", tue: "7:30 AM – 4:30 PM", wed: "7:30 AM – 4:30 PM", thu: "7:30 AM – 4:30 PM", fri: "7:30 AM – 4:30 PM", sat: "7:30 AM – 12:00 PM", sun: "Closed" },
    notes: "Primary St. Charles County disposal reference. Fees are estimates — confirm current rate sheet.",
  },
  {
    id: "ref-wentzville-srf",
    name: "Wentzville Transfer Station (SRF)",
    address: "1395 W Meyer Rd",
    city: "Wentzville",
    state: "MO",
    zip: "63385",
    county: "St. Charles",
    latitude: 38.8124,
    longitude: -90.8521,
    phone: "(636) 327-3327",
    acceptedMaterials: ["general_junk", "construction_debris", "yard_waste"],
    restrictions: "Commercial loads may require account setup — call ahead.",
    feeType: "mixed",
    baseFee: 48,
    perTonFee: 38,
    minimumFee: 40,
    hoursJson: { mon: "7:00 AM – 4:00 PM", tue: "7:00 AM – 4:00 PM", wed: "7:00 AM – 4:00 PM", thu: "7:00 AM – 4:00 PM", fri: "7:00 AM – 4:00 PM", sat: "Closed", sun: "Closed" },
    notes: "Western St. Charles County reference site.",
  },
  {
    id: "ref-lincoln-county-transfer",
    name: "Lincoln County Transfer Station",
    address: "75 County Road 622",
    city: "Troy",
    state: "MO",
    zip: "63379",
    county: "Lincoln",
    latitude: 38.9795,
    longitude: -90.9782,
    phone: "(636) 528-6117",
    acceptedMaterials: ["general_junk", "yard_waste", "construction_debris"],
    restrictions: "County transfer — verify load size and material acceptance.",
    feeType: "flat",
    baseFee: 35,
    minimumFee: 30,
    hoursJson: { mon: "8:00 AM – 4:00 PM", tue: "8:00 AM – 4:00 PM", wed: "8:00 AM – 4:00 PM", thu: "8:00 AM – 4:00 PM", fri: "8:00 AM – 4:00 PM", sat: "8:00 AM – 12:00 PM", sun: "Closed" },
  },
  {
    id: "ref-warren-county-sanitary",
    name: "Warren County Sanitary Landfill",
    address: "26665 Highway U",
    city: "Warrenton",
    state: "MO",
    zip: "63383",
    county: "Warren",
    latitude: 38.8231,
    longitude: -91.1402,
    phone: "(636) 456-3478",
    acceptedMaterials: ["general_junk", "construction_debris", "yard_waste", "bulky_special"],
    restrictions: "Landfill — commercial haulers must follow county tipping rules.",
    feeType: "mixed",
    baseFee: 45,
    perTonFee: 36,
    minimumFee: 40,
    hoursJson: { mon: "7:00 AM – 4:00 PM", tue: "7:00 AM – 4:00 PM", wed: "7:00 AM – 4:00 PM", thu: "7:00 AM – 4:00 PM", fri: "7:00 AM – 4:00 PM", sat: "7:00 AM – 12:00 PM", sun: "Closed" },
  },
  {
    id: "ref-franklin-county-sanitary",
    name: "Franklin County Sanitary Landfill",
    address: "4024 East Main Street",
    city: "Union",
    state: "MO",
    zip: "63084",
    county: "Franklin",
    latitude: 38.4401,
    longitude: -91.0084,
    phone: "(636) 583-8470",
    acceptedMaterials: ["general_junk", "construction_debris", "yard_waste"],
    restrictions: "County landfill — confirm commercial tipping and prohibited items.",
    feeType: "mixed",
    baseFee: 50,
    perTonFee: 40,
    minimumFee: 45,
    hoursJson: { mon: "7:00 AM – 4:00 PM", tue: "7:00 AM – 4:00 PM", wed: "7:00 AM – 4:00 PM", thu: "7:00 AM – 4:00 PM", fri: "7:00 AM – 4:00 PM", sat: "7:00 AM – 12:00 PM", sun: "Closed" },
  },
  {
    id: "ref-jefferson-county-sanitary",
    name: "Jefferson County Sanitary Landfill",
    address: "6355 Hillsboro House Springs Road",
    city: "House Springs",
    state: "MO",
    zip: "63051",
    county: "Jefferson",
    latitude: 38.4098,
    longitude: -90.5531,
    phone: "(636) 797-9900",
    acceptedMaterials: ["general_junk", "construction_debris", "yard_waste", "bulky_special"],
    restrictions: "County landfill — verify scale hours and commercial rates.",
    feeType: "mixed",
    baseFee: 55,
    perTonFee: 42,
    minimumFee: 48,
    hoursJson: { mon: "7:00 AM – 4:00 PM", tue: "7:00 AM – 4:00 PM", wed: "7:00 AM – 4:00 PM", thu: "7:00 AM – 4:00 PM", fri: "7:00 AM – 4:00 PM", sat: "7:00 AM – 12:00 PM", sun: "Closed" },
  },
  {
    id: "ref-o-fallon-waste",
    name: "City of O'Fallon Recycling Center",
    address: "1576 O'Fallon Commerce Drive",
    city: "O'Fallon",
    state: "MO",
    zip: "63366",
    county: "St. Charles",
    latitude: 38.7831,
    longitude: -90.7178,
    phone: "(636) 379-5606",
    acceptedMaterials: ["yard_waste", "general_junk", "scrap_metal"],
    restrictions: "Residential/commercial rules vary by material — call before C&D loads.",
    feeType: "flat",
    baseFee: 30,
    minimumFee: 25,
    hoursJson: { mon: "Closed", tue: "9:00 AM – 5:00 PM", wed: "9:00 AM – 5:00 PM", thu: "9:00 AM – 5:00 PM", fri: "9:00 AM – 5:00 PM", sat: "9:00 AM – 3:00 PM", sun: "Closed" },
  },
  {
    id: "ref-lake-st-louis-transfer",
    name: "Lake St. Louis C&D Disposal (Regional Transfer)",
    address: "100 Lake Village Blvd",
    city: "Lake St. Louis",
    state: "MO",
    zip: "63367",
    county: "St. Charles",
    latitude: 38.7975,
    longitude: -90.7856,
    phone: "(636) 561-4800",
    acceptedMaterials: ["construction_debris", "general_junk", "bulky_special"],
    restrictions: "Commercial C&D reference — confirm current operator and tipping agreement.",
    feeType: "mixed",
    baseFee: 58,
    perTonFee: 45,
    minimumFee: 50,
    notes: "Regional C&D reference for western St. Charles jobs.",
  },
];
