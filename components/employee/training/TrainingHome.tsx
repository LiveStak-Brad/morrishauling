"use client";

import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { AssignedCourseSummary } from "@/types/hr/training";
import { GraduationCap, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";

function statusBadge(status: AssignedCourseSummary["status"]) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-600">Complete</Badge>;
    case "in_progress":
      return <Badge variant="secondary">In progress</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired — renew</Badge>;
    default:
      return <Badge variant="outline">Not started</Badge>;
  }
}

function progressPct(a: AssignedCourseSummary) {
  if (!a.lessonsTotal) return a.status === "completed" ? 100 : 0;
  return Math.round((a.lessonsCompleted / a.lessonsTotal) * 100);
}

interface Props {
  assigned: AssignedCourseSummary[];
  loading?: boolean;
}

export function TrainingHome({ assigned, loading }: Props) {
  if (loading) {
    return <div className="p-4 text-muted-foreground animate-pulse">Loading training…</div>;
  }

  const overdue = assigned.filter((a) => a.isOverdue || a.status === "expired");
  const inProgress = assigned.filter((a) => a.status === "in_progress");
  const notStarted = assigned.filter((a) => a.status === "not_started");
  const completed = assigned.filter((a) => a.status === "completed");

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Training</h1>

      {overdue.length > 0 && (
        <PremiumCard className="p-3 border-amber-200 bg-amber-50/50 text-sm flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {overdue.length} course(s) overdue or need renewal
        </PremiumCard>
      )}

      {renderSection("Required & overdue", [...overdue, ...notStarted.filter((c) => c.course.isRequired)])}
      {renderSection("In progress", inProgress)}
      {renderSection("Completed", completed)}
    </div>
  );

  function renderSection(title: string, items: AssignedCourseSummary[]) {
    const unique = Array.from(new Map(items.map((i) => [i.course.id, i])).values());
    if (!unique.length) return null;
    return (
      <section>
        <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">{title}</h3>
        {unique.map((item) => (
          <PremiumCard key={item.course.id} className="p-4 mb-2">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.course.name}</p>
                  {statusBadge(item.status)}
                </div>
                {item.course.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.course.description}</p>
                )}
                {item.lessonsTotal > 0 && item.status !== "completed" && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary transition-all"
                        style={{ width: `${progressPct(item)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.lessonsCompleted}/{item.lessonsTotal} lessons
                      {item.quizAttempts > 0 && ` · Best quiz: ${item.bestScore ?? "—"}%`}
                    </p>
                  </div>
                )}
                <ButtonLink href={`/employee/training/${item.course.id}`} size="sm" className="mt-3 inline-flex items-center">
                    {item.status === "completed" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> View certificate
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-1" />
                        {item.status === "not_started" ? "Start course" : "Continue"}
                      </>
                    )}
                </ButtonLink>
              </div>
            </div>
          </PremiumCard>
        ))}
      </section>
    );
  }
}
