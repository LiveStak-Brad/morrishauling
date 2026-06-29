"use client";

import type { FinancingRequest } from "@/types/financing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inHouseFinancingProvider } from "@/lib/financing-provider";
import { useCompany } from "@/lib/company-context";
import { useState } from "react";

interface FinancingApprovalPanelProps {
  requests: FinancingRequest[];
  onUpdate?: () => void;
}

export function FinancingApprovalPanel({
  requests,
  onUpdate,
}: FinancingApprovalPanelProps) {
  const { companyId } = useCompany();
  const [loading, setLoading] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");

  const handleApprove = async (id: string) => {
    setLoading(id);
    await inHouseFinancingProvider.approve(id, companyId);
    setLoading(null);
    onUpdate?.();
  };

  const handleDeny = async (id: string) => {
    setLoading(id);
    await inHouseFinancingProvider.deny(id, companyId, "Does not meet criteria");
    setLoading(null);
    onUpdate?.();
  };

  if (pending.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No pending financing requests
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((req) => (
        <Card key={req.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Job {req.jobId}</CardTitle>
              <Badge>{req.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total: ${req.totalAmount} · Down: ${req.downPayment}</p>
            <p>
              {req.numberOfPayments} {req.paymentFrequency} payments
            </p>
            <p className="text-muted-foreground">
              Signature: {req.signaturePlaceholder || "—"}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary/90"
                disabled={loading === req.id}
                onClick={() => handleApprove(req.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading === req.id}
                onClick={() => handleDeny(req.id)}
              >
                Deny
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
