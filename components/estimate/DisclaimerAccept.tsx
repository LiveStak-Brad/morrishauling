"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/lib/company-context";

interface DisclaimerAcceptProps {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

export function DisclaimerAccept({ accepted, onChange }: DisclaimerAcceptProps) {
  const { company } = useCompany();

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <Checkbox
        id="disclaimer"
        checked={accepted}
        onCheckedChange={(c) => onChange(!!c)}
      />
      <Label htmlFor="disclaimer" className="text-sm font-normal leading-relaxed">
        {company.estimateDisclaimer}
      </Label>
    </div>
  );
}
