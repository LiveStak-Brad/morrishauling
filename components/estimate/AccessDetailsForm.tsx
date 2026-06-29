"use client";

import type { AccessDetails } from "@/types/job";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface AccessDetailsFormProps {
  value: AccessDetails;
  onChange: (value: AccessDetails) => void;
}

export function AccessDetailsForm({ value, onChange }: AccessDetailsFormProps) {
  const update = (patch: Partial<AccessDetails>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["stairs", "Stairs"],
            ["elevator", "Elevator"],
            ["basement", "Basement"],
            ["attic", "Attic"],
            ["tightAccess", "Tight access"],
            ["heavyItems", "Heavy items"],
            ["specialDisposal", "Special disposal"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={key}
              checked={value[key]}
              onCheckedChange={(c) => update({ [key]: !!c })}
            />
            <Label htmlFor={key} className="text-sm font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>
      {value.stairs && (
        <div>
          <Label htmlFor="stairFlights">Stair flights</Label>
          <Input
            id="stairFlights"
            type="number"
            min={1}
            value={value.stairFlights ?? 1}
            onChange={(e) =>
              update({ stairFlights: parseInt(e.target.value) || 1 })
            }
          />
        </div>
      )}
      <div>
        <Label htmlFor="longCarry">Long carry distance (ft)</Label>
        <Input
          id="longCarry"
          type="number"
          min={0}
          value={value.longCarryFt}
          onChange={(e) =>
            update({ longCarryFt: parseInt(e.target.value) || 0 })
          }
        />
      </div>
      <div>
        <Label htmlFor="notes">Access notes</Label>
        <Textarea
          id="notes"
          value={value.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Gate codes, parking, etc."
        />
      </div>
    </div>
  );
}
