"use client";

import { useEffect, useState } from "react";
import { TrainingHome } from "@/components/employee/training/TrainingHome";
import type { AssignedCourseSummary } from "@/types/hr/training";

export default function EmployeeTrainingPage() {
  const [assigned, setAssigned] = useState<AssignedCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/training")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setAssigned(d.assigned ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return <TrainingHome assigned={assigned} loading={loading} />;
}
