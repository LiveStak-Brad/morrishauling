"use client";

import type { LoadSizeTier } from "@/types/job";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCompany } from "@/lib/company-context";

interface JobCompletionFormProps {
  finalLoadSize?: LoadSizeTier;
  extraFees?: number;
  priceAdjustmentNotes?: string;
  paymentCollected?: boolean;
  onChange: (patch: {
    finalLoadSizeTier?: LoadSizeTier;
    extraFees?: number;
    priceAdjustmentNotes?: string;
    paymentCollected?: boolean;
  }) => void;
}

export function JobCompletionForm({
  finalLoadSize,
  extraFees = 0,
  priceAdjustmentNotes = "",
  paymentCollected = false,
  onChange,
}: JobCompletionFormProps) {
  const { company } = useCompany();

  return (
    <div className="space-y-4">
      <div>
        <Label>Final load size</Label>
        <Select
          value={finalLoadSize}
          onValueChange={(v) => onChange({ finalLoadSizeTier: v as LoadSizeTier })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select final load" />
          </SelectTrigger>
          <SelectContent>
            {company.pricingRules.loadTiers.map((t) => (
              <SelectItem key={t.tier} value={t.tier}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Extra fees ($)</Label>
        <Input
          type="number"
          min={0}
          value={extraFees}
          onChange={(e) => onChange({ extraFees: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Price adjustment notes</Label>
        <Textarea
          value={priceAdjustmentNotes}
          onChange={(e) => onChange({ priceAdjustmentNotes: e.target.value })}
          placeholder="On-site changes, additional items..."
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Payment collected</Label>
        <Switch
          checked={paymentCollected}
          onCheckedChange={(c) => onChange({ paymentCollected: c })}
        />
      </div>
    </div>
  );
}
