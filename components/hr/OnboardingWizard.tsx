"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import type { OnboardingProgress } from "@/types/hr/onboarding";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  employeeId: string;
  readOnly?: boolean;
  onActivate?: () => void;
}

export function OnboardingWizard({ employeeId, readOnly, onActivate }: OnboardingWizardProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/hr/employees/${employeeId}/onboarding`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setProgress(d.progress); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [employeeId]);

  const completeItem = async (itemId: string) => {
    await fetch(`/api/hr/employees/${employeeId}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status: "complete" }),
    });
    load();
  };

  if (loading || !progress) return <p className="text-muted-foreground">Loading onboarding…</p>;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Onboarding Progress</span>
          <span className="font-semibold">{progress.percentComplete}%</span>
        </div>
        <Progress value={progress.percentComplete} className="h-3" />
        <p className="text-xs text-muted-foreground mt-1">
          {progress.requiredComplete} of {progress.requiredItems} required items complete
        </p>
      </div>

      <div className="space-y-2">
        {progress.items.map((item) => {
          const done = item.status === "complete" || item.status === "waived";
          return (
            <PremiumCard
              key={item.id}
              className={cn(
                "p-4 flex items-center justify-between gap-3",
                !done && item.isRequired && "border-amber-300 bg-amber-50/50"
              )}
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.isRequired && !done && (
                    <p className="text-xs text-amber-700">Required</p>
                  )}
                </div>
              </div>
              {!readOnly && !done && (
                <Button size="sm" variant="outline" onClick={() => completeItem(item.id)}>
                  Mark Complete
                </Button>
              )}
            </PremiumCard>
          );
        })}
      </div>

      {!readOnly && progress.canActivate && onActivate && (
        <Button onClick={onActivate} className="w-full">Activate Employee</Button>
      )}
      {!readOnly && !progress.canActivate && (
        <p className="text-sm text-amber-700 text-center">
          Complete all required items before activating this employee.
        </p>
      )}
    </div>
  );
}
