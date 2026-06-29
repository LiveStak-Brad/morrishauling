"use client";

import { useEffect, useState, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import type { OnboardingProgress } from "@/types/hr/onboarding";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const DOC_REQUIREMENTS: Record<string, string> = {
  "1099_contractor": "W-9, contractor agreement, safety agreement",
  w2_full_time: "I-9, W-4, handbook, safety agreement",
  w2_part_time: "I-9, W-4, handbook, safety agreement",
};

export default function EmployeeOnboardingPage() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [employmentType, setEmploymentType] = useState<string>("w2_full_time");

  const load = useCallback(() => {
    fetch("/api/me/onboarding")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setProgress(d.progress); });
    fetch("/api/me/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.dashboard?.employee?.employmentType) {
          setEmploymentType(d.dashboard.employee.employmentType);
        }
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const completeItem = async (itemId: string) => {
    const res = await fetch("/api/me/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status: "complete" }),
    });
    const d = await res.json();
    if (d.ok) {
      setProgress(d.progress);
      toast.success("Task marked complete");
    } else {
      toast.error(d.error ?? "Could not update task");
    }
  };

  if (!progress) return <div className="p-4 text-muted-foreground">Loading onboarding…</div>;

  const docPack = DOC_REQUIREMENTS[employmentType] ?? DOC_REQUIREMENTS.w2_full_time;
  const blocked = progress.items.filter((i) => i.isRequired && i.status !== "complete" && i.status !== "waived");

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Onboarding</h1>

      <PremiumCard className="p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Overall progress</span>
          <span className="font-bold">{progress.percentComplete}%</span>
        </div>
        <Progress value={progress.percentComplete} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          {progress.requiredComplete} of {progress.requiredItems} required items complete
        </p>
        <p className="text-xs mt-2">Required documents: {docPack}</p>
        <ButtonLink href="/employee/documents" variant="outline" size="sm" className="mt-3">
          View & sign documents
        </ButtonLink>
      </PremiumCard>

      {blocked.length > 0 && (
        <PremiumCard className="p-3 border-amber-200 bg-amber-50/50 text-sm text-amber-900">
          <Lock className="inline h-4 w-4 mr-1" />
          {blocked.length} required item(s) still need attention before you&apos;re fully cleared.
        </PremiumCard>
      )}

      <div className="space-y-2">
        {progress.items.map((item) => {
          const done = item.status === "complete" || item.status === "waived";
          const needsAdmin = item.itemKey?.includes("background") || item.itemKey?.includes("drug");
          const canSelfComplete = !needsAdmin && !done;
          return (
            <PremiumCard
              key={item.id}
              className={cn(
                "p-4",
                !done && item.isRequired && "border-amber-200 bg-amber-50/30"
              )}
            >
              <div className="flex items-start gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.label}</p>
                    {item.isRequired ? (
                      <Badge variant="outline" className="text-[10px]">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                    )}
                  </div>
                  {needsAdmin && !done && (
                    <p className="text-xs text-muted-foreground mt-1">Pending admin approval</p>
                  )}
                  {canSelfComplete && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => completeItem(item.id)}>
                      Mark complete
                    </Button>
                  )}
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>
    </div>
  );
}
