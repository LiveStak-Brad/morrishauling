"use client";

import { useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { FinancingApprovalCenter } from "@/components/financing/FinancingApprovalCenter";

export default function AdminFinancingPage() {
  const [tick, setTick] = useState(0);

  return (
    <AdminPageShell
      title="Financing approval center"
      description="Review payment plan requests, approve terms, and track schedules"
    >
      <FinancingApprovalCenter key={tick} onUpdate={() => setTick((t) => t + 1)} />
    </AdminPageShell>
  );
}
