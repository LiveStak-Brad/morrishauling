import { addDays, format } from "date-fns";

export type ArrivalSlotStatus =
  | "available"
  | "limited"
  | "almost_full"
  | "flexible"
  | "full"
  | "closed";

export interface ArrivalTimeSlot {
  id: string;
  window: "morning" | "afternoon" | "flexible";
  label: string;
  status: ArrivalSlotStatus;
  statusLabel: string;
  discountAmount?: number;
  discountLabel?: string;
  bookable: boolean;
}

export interface ArrivalDayOption {
  date: string;
  dayLabel: string;
  dateLabel: string;
  slots: ArrivalTimeSlot[];
}

const PHOTO_LABELS = [
  "Front view",
  "Side view",
  "Pickup location",
  "Additional angle",
  "Access path",
  "Load overview",
];

export function labelForPhotoIndex(index: number): string {
  return PHOTO_LABELS[index] ?? `Photo ${index + 1}`;
}

/** @deprecated Use scheduleSlotsToCalendarOptions with real schedule slots */
export function buildArrivalCalendarOptions(startDate = new Date()): ArrivalDayOption[] {
  const templates: Omit<ArrivalTimeSlot, "id">[][] = [
    [
      { window: "morning", label: "Morning", status: "available", statusLabel: "Available", bookable: true },
      { window: "afternoon", label: "Afternoon", status: "limited", statusLabel: "Only 2 spots left", bookable: true },
    ],
    [
      { window: "morning", label: "Morning", status: "almost_full", statusLabel: "Almost full", bookable: true },
      { window: "afternoon", label: "Afternoon", status: "available", statusLabel: "Available", bookable: true },
    ],
    [
      {
        window: "flexible",
        label: "Flexible pricing",
        status: "flexible",
        statusLabel: "Save $40",
        discountAmount: 40,
        discountLabel: "Best value — we route around existing jobs",
        bookable: true,
      },
    ],
    [
      { window: "morning", label: "Morning", status: "available", statusLabel: "Available", bookable: true },
      { window: "afternoon", label: "Afternoon", status: "available", statusLabel: "Available", bookable: true },
    ],
  ];

  return templates.map((slots, i) => {
    const date = addDays(startDate, i + 1);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayLabel: format(date, "EEEE"),
      dateLabel: format(date, "MMM d"),
      slots: slots.map((s) => ({ ...s, id: `${format(date, "yyyy-MM-dd")}-${s.window}` })),
    };
  });
}
