"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application, EmploymentType } from "@/types/hr/ats";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; docs: string }[] = [
  { value: "w2_full_time", label: "W-2 Full Time", docs: "I-9, W-4, employment agreement" },
  { value: "w2_part_time", label: "W-2 Part Time", docs: "I-9, W-4, employment agreement" },
  { value: "1099_contractor", label: "1099 Contractor", docs: "W-9, contractor agreement" },
  { value: "seasonal", label: "Seasonal", docs: "I-9, W-4, employment agreement" },
  { value: "temporary", label: "Temporary", docs: "I-9, W-4, employment agreement" },
  { value: "office_staff", label: "Office Staff", docs: "I-9, W-4, employment agreement" },
];

interface HireApplicantDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHired: () => void;
}

export function HireApplicantDialog({ application, open, onOpenChange, onHired }: HireApplicantDialogProps) {
  const [employmentType, setEmploymentType] = useState<EmploymentType>("w2_full_time");
  const [role, setRole] = useState("helper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docPack = EMPLOYMENT_TYPES.find((t) => t.value === employmentType)?.docs ?? "";

  const hire = async () => {
    if (!application) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/applicants/${application.id}/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentType, role, hourlyRate: 18 }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error ?? "Hire failed");
      onHired();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hire failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Hire {application?.applicant?.firstName} {application?.applicant?.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Employment type</Label>
            <Select value={employmentType} onValueChange={(v) => v && setEmploymentType(v as EmploymentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Required documents: {docPack}</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="helper">Helper</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={hire} disabled={loading}>{loading ? "Hiring…" : "Confirm Hire"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
