"use client";

import type { BookingCategory } from "@/lib/booking-categories";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookingCategoryCardProps {
  category: BookingCategory;
  selected: boolean;
  onSelect: () => void;
}

export function BookingCategoryCard({
  category,
  selected,
  onSelect,
}: BookingCategoryCardProps) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-300",
        "bg-gradient-to-br",
        category.gradient,
        selected
          ? "border-brand-primary shadow-lg ring-2 ring-brand-primary/20 scale-[1.02]"
          : "border-transparent morris-card-interactive hover:border-brand-primary/30"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110",
          category.iconBg
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold leading-tight">{category.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {category.description}
        </p>
      </div>
    </button>
  );
}
