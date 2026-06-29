import type { LucideIcon } from "lucide-react";
import {
  Sofa,
  Warehouse,
  Home,
  HardHat,
  Refrigerator,
  BedDouble,
  Trees,
  Container,
  Waves,
  Warehouse as Shed,
  Hammer,
  Truck,
  Building2,
  Armchair,
  Monitor,
  Package,
  Trash2,
} from "lucide-react";

export interface BookingCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
}

export const BOOKING_CATEGORIES: BookingCategory[] = [
  {
    id: "furniture",
    name: "Furniture",
    description: "Couches, tables, dressers",
    icon: Sofa,
    gradient: "from-red-600/20 to-red-900/5",
    iconBg: "bg-red-600",
  },
  {
    id: "garage",
    name: "Garage Cleanout",
    description: "Full garage declutter",
    icon: Warehouse,
    gradient: "from-zinc-600/20 to-zinc-900/5",
    iconBg: "bg-zinc-700",
  },
  {
    id: "estate",
    name: "Estate Cleanout",
    description: "Whole-home cleanouts",
    icon: Home,
    gradient: "from-amber-600/20 to-amber-900/5",
    iconBg: "bg-amber-600",
  },
  {
    id: "construction",
    name: "Construction Debris",
    description: "Drywall, lumber, renovation",
    icon: HardHat,
    gradient: "from-orange-600/20 to-orange-900/5",
    iconBg: "bg-orange-600",
  },
  {
    id: "appliance",
    name: "Appliances",
    description: "Fridges, washers, dryers",
    icon: Refrigerator,
    gradient: "from-blue-600/20 to-blue-900/5",
    iconBg: "bg-blue-600",
  },
  {
    id: "mattress",
    name: "Mattresses",
    description: "Beds and mattress removal",
    icon: BedDouble,
    gradient: "from-purple-600/20 to-purple-900/5",
    iconBg: "bg-purple-600",
  },
  {
    id: "yard",
    name: "Yard Waste",
    description: "Brush, branches, outdoor",
    icon: Trees,
    gradient: "from-green-600/20 to-green-900/5",
    iconBg: "bg-green-600",
  },
  {
    id: "storage",
    name: "Storage Unit",
    description: "Unit cleanout & haul-off",
    icon: Container,
    gradient: "from-slate-600/20 to-slate-900/5",
    iconBg: "bg-slate-600",
  },
  {
    id: "hottub",
    name: "Hot Tub",
    description: "Spa removal & disposal",
    icon: Waves,
    gradient: "from-cyan-600/20 to-cyan-900/5",
    iconBg: "bg-cyan-600",
  },
  {
    id: "shed",
    name: "Shed Removal",
    description: "Outdoor structure haul-away",
    icon: Shed,
    gradient: "from-stone-600/20 to-stone-900/5",
    iconBg: "bg-stone-600",
  },
  {
    id: "demolition",
    name: "Demolition",
    description: "Light demo debris",
    icon: Hammer,
    gradient: "from-red-700/20 to-red-950/5",
    iconBg: "bg-red-800",
  },
  {
    id: "moving",
    name: "Moving Cleanup",
    description: "Left-behind move-out junk",
    icon: Truck,
    gradient: "from-indigo-600/20 to-indigo-900/5",
    iconBg: "bg-indigo-600",
  },
  {
    id: "rental",
    name: "Rental Property",
    description: "Turnover cleanouts",
    icon: Building2,
    gradient: "from-teal-600/20 to-teal-900/5",
    iconBg: "bg-teal-600",
  },
  {
    id: "commercial",
    name: "Commercial Cleanup",
    description: "Business & retail debris",
    icon: Building2,
    gradient: "from-gray-600/20 to-gray-900/5",
    iconBg: "bg-gray-700",
  },
  {
    id: "office",
    name: "Office Furniture",
    description: "Desks, chairs, cubicles",
    icon: Armchair,
    gradient: "from-violet-600/20 to-violet-900/5",
    iconBg: "bg-violet-600",
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "TVs, computers, e-waste",
    icon: Monitor,
    gradient: "from-sky-600/20 to-sky-900/5",
    iconBg: "bg-sky-600",
  },
  {
    id: "general",
    name: "General Junk",
    description: "Mixed household items",
    icon: Package,
    gradient: "from-neutral-600/20 to-neutral-900/5",
    iconBg: "bg-neutral-600",
  },
  {
    id: "other",
    name: "Other",
    description: "Tell us what you need",
    icon: Trash2,
    gradient: "from-red-500/20 to-red-900/5",
    iconBg: "bg-brand-primary",
  },
];

export function getBookingCategory(id: string) {
  return BOOKING_CATEGORIES.find((c) => c.id === id);
}
