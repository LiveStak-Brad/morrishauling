"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import type { AssignedCourseSummary } from "@/types/hr/training";
import { format, parseISO } from "date-fns";

export function EmployeeTrainingTab({ employeeId }: { employeeId: string }) {
  const [training, setTraining] = useState<AssignedCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hr/employees/${employeeId}/training`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTraining(d.training ?? []);
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <p className="text-muted-foreground">Loading training…</p>;

  return (
    <div className="space-y-2">
      {training.length === 0 ? (
        <p className="text-muted-foreground">No assigned courses.</p>
      ) : (
        training.map((t) => (
          <PremiumCard key={t.course.id} className="p-3 flex flex-wrap justify-between gap-2 items-center">
            <div>
              <p className="font-medium">{t.course.name}</p>
              <p className="text-xs text-muted-foreground">
                {t.lessonsCompleted}/{t.lessonsTotal} lessons
                {t.completion?.completedAt &&
                  ` · Completed ${format(parseISO(t.completion.completedAt), "MMM d, yyyy")}`}
                {t.completion?.expiresAt && ` · Expires ${format(parseISO(t.completion.expiresAt), "MMM d, yyyy")}`}
              </p>
            </div>
            <Badge
              variant={
                t.status === "completed" ? "default" : t.status === "overdue" || t.status === "expired" ? "destructive" : "outline"
              }
              className="capitalize"
            >
              {t.status.replace("_", " ")}
              {t.bestScore != null && ` · ${t.bestScore}%`}
            </Badge>
          </PremiumCard>
        ))
      )}
    </div>
  );
}
