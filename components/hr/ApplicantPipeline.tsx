"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicantDetailDrawer } from "./ApplicantDetailDrawer";
import { HireApplicantDialog } from "./HireApplicantDialog";
import type { Application, ApplicantStatus } from "@/types/hr/ats";
import { cn } from "@/lib/utils";
import { Mail, Phone, ChevronRight, UserCheck, UserX } from "lucide-react";

const PIPELINE: ApplicantStatus[] = [
  "applied", "phone_screen", "interview_scheduled", "interview_completed",
  "offer_sent", "offer_accepted",
];

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview_scheduled: "Interview",
  interview_completed: "Interviewed",
  offer_sent: "Offer Sent",
  offer_accepted: "Offer Accepted",
  offer_declined: "Declined",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-50 border-blue-200",
  phone_screen: "bg-indigo-50 border-indigo-200",
  interview_scheduled: "bg-purple-50 border-purple-200",
  interview_completed: "bg-violet-50 border-violet-200",
  offer_sent: "bg-amber-50 border-amber-200",
  offer_accepted: "bg-green-50 border-green-200",
  rejected: "bg-red-50 border-red-200",
  hired: "bg-emerald-50 border-emerald-200",
};

const NEXT_STATUS: Partial<Record<ApplicantStatus, ApplicantStatus>> = {
  applied: "phone_screen",
  phone_screen: "interview_scheduled",
  interview_scheduled: "interview_completed",
  interview_completed: "offer_sent",
  offer_sent: "offer_accepted",
};

export function ApplicantPipeline({ filterStatus }: { filterStatus?: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hireApp, setHireApp] = useState<Application | null>(null);

  const load = useCallback(() => {
    const url = filterStatus ? `/api/hr/applicants?status=${filterStatus}` : "/api/hr/applicants";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setApplications(d.applications); })
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (appId: string, status: ApplicantStatus) => {
    await fetch(`/api/hr/applicants/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  if (loading) return <p className="text-muted-foreground">Loading applicants…</p>;

  const activeApps = applications.filter((a) => !["rejected", "hired", "offer_declined"].includes(a.status));
  const byStatus = PIPELINE.reduce((acc, status) => {
    acc[status] = activeApps.filter((a) => a.status === status);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="space-y-6">
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {PIPELINE.map((status) => (
          <div key={status} className="min-w-[160px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {STATUS_LABELS[status]}
              </span>
              <Badge variant="secondary">{byStatus[status]?.length ?? 0}</Badge>
            </div>
            <div className="space-y-2 min-h-[140px]">
              {(byStatus[status] ?? []).map((app) => (
                <ApplicantCard
                  key={app.id}
                  app={app}
                  onOpen={() => openDrawer(app.id)}
                  onAdvance={() => {
                    const next = NEXT_STATUS[app.status];
                    if (next) updateStatus(app.id, next);
                  }}
                  onHire={() => setHireApp(app)}
                  onReject={() => updateStatus(app.id, "rejected")}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden space-y-2">
        {activeApps.map((app) => (
          <ApplicantCard
            key={app.id}
            app={app}
            onOpen={() => openDrawer(app.id)}
            onAdvance={() => {
              const next = NEXT_STATUS[app.status];
              if (next) updateStatus(app.id, next);
            }}
            onHire={() => setHireApp(app)}
            onReject={() => updateStatus(app.id, "rejected")}
            mobile
          />
        ))}
      </div>

      <ApplicantDetailDrawer
        applicationId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={load}
      />

      <HireApplicantDialog
        application={hireApp}
        open={!!hireApp}
        onOpenChange={(o) => { if (!o) setHireApp(null); }}
        onHired={load}
      />
    </div>
  );
}

function ApplicantCard({
  app,
  onOpen,
  onAdvance,
  onHire,
  onReject,
  mobile,
}: {
  app: Application;
  onOpen: () => void;
  onAdvance: () => void;
  onHire: () => void;
  onReject: () => void;
  mobile?: boolean;
}) {
  const initials = `${app.applicant?.firstName?.[0] ?? ""}${app.applicant?.lastName?.[0] ?? ""}`;
  const next = NEXT_STATUS[app.status];

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "p-3 border-2 transition-shadow hover:shadow-md cursor-pointer rounded-2xl",
        STATUS_COLORS[app.status] ?? "bg-card morris-card"
      )}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-bold text-brand-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">
            {app.applicant?.firstName} {app.applicant?.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{app.jobPosting?.title}</p>
          {app.applicationType && app.applicationType !== "standard" && (
            <p className="text-[10px] text-brand-primary">{app.applicationType.replace(/_/g, " ")}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
            {app.applicant?.email && (
              <span className="inline-flex items-center gap-0.5"><Mail className="h-3 w-3" />{app.applicant.email}</span>
            )}
            {app.applicant?.phone && (
              <span className="inline-flex items-center gap-0.5"><Phone className="h-3 w-3" />{app.applicant.phone}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
        {next && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onAdvance}>
            → {STATUS_LABELS[next]}
          </Button>
        )}
        <Button size="sm" className="h-7 text-xs" onClick={onHire}>
          <UserCheck className="mr-1 h-3 w-3" /> Hire
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={onReject}>
          <UserX className="mr-1 h-3 w-3" /> Reject
        </Button>
      </div>

      {mobile && <Badge className="mt-2">{STATUS_LABELS[app.status]}</Badge>}
    </div>
  );
}
