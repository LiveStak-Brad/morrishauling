"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { MaterialHandlingAnswers } from "@/types/job";
import { cn } from "@/lib/utils";

const BASE_QUESTIONS: Array<{
  key: keyof MaterialHandlingAnswers;
  label: string;
}> = [
  { key: "reusableItems", label: "Are any items in reusable condition?" },
  { key: "electronicsIncluded", label: "Are electronics included?" },
  { key: "appliancesIncluded", label: "Are appliances included?" },
  {
    key: "specialtyItemsIncluded",
    label: "Are batteries, tires, paint, chemicals, or refrigerant appliances included?",
  },
];

export function MaterialHandlingQuestions({
  value,
  onChange,
  junkCategory,
  className,
}: {
  value: MaterialHandlingAnswers;
  onChange: (next: MaterialHandlingAnswers) => void;
  junkCategory?: string;
  className?: string;
}) {
  const showConstruction = junkCategory === "construction" || junkCategory === "demolition";
  const showYard = junkCategory === "yard";

  const questions = [
    ...BASE_QUESTIONS,
    ...(showConstruction
      ? [
          {
            key: "constructionSeparated" as const,
            label: "Is construction debris separated (not mixed with household junk)?",
          },
        ]
      : []),
    ...(showYard
      ? [
          {
            key: "yardWasteSeparated" as const,
            label: "Is yard waste separated from household junk?",
          },
        ]
      : []),
  ];

  const toggle = (key: keyof MaterialHandlingAnswers) => {
    const current = value[key];
    onChange({ ...value, [key]: current === true ? false : true });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="font-bold">Material handling notes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional — helps us plan donation, recycling, or specialty routing. Not every item can be
          diverted.
        </p>
      </div>
      <ul className="space-y-3">
        {questions.map((q) => (
          <li key={q.key} className="flex items-start gap-3">
            <Checkbox
              id={`mh-${q.key}`}
              checked={value[q.key] === true}
              onCheckedChange={() => toggle(q.key)}
              className="mt-0.5"
            />
            <Label htmlFor={`mh-${q.key}`} className="text-sm font-normal leading-snug">
              {q.label}
            </Label>
          </li>
        ))}
      </ul>
    </div>
  );
}
