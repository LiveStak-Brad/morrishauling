"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Application, ApplicationDetail, ApplicantStatus } from "@/types/hr/ats";
import { Mail, Phone, MapPin, Briefcase, UserCheck, UserX } from "lucide-react";
import { HireApplicantDialog } from "./HireApplicantDialog";

const STATUS_OPTIONS: ApplicantStatus[] = [
  "applied", "phone_screen", "interview_scheduled", "interview_completed",
  "offer_sent", "offer_accepted", "rejected",
];

interface ApplicantDetailDrawerProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function ApplicantDetailDrawer({ applicationId, open, onOpenChange, onUpdated }: ApplicantDetailDrawerProps) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);

  const load = () => {
    if (!applicationId) return;
    setLoading(true);
    fetch(`/api/hr/applicants/${applicationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setDetail({
            application: d.application,
            statusHistory: d.statusHistory ?? [],
            interviewNotes: d.interviewNotes ?? [],
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open && applicationId) load(); }, [open, applicationId]);

  const patch = async (body: Record<string, unknown>) => {
    if (!applicationId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/applicants/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.ok) {
        setDetail({
          application: d.application,
          statusHistory: d.statusHistory ?? [],
          interviewNotes: d.interviewNotes ?? [],
        });
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  };

  const addNote = () => {
    if (!note.trim()) return;
    patch({ interviewNote: { noteType: "general", content: note.trim() } }).then(() => setNote(""));
  };

  const app = detail?.application;
  const applicant = app?.applicant;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {applicant ? `${applicant.firstName} ${applicant.lastName}` : "Applicant"}
            </SheetTitle>
          </SheetHeader>

          {loading && <p className="text-muted-foreground mt-4">Loading…</p>}

          {app && applicant && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{app.status.replace(/_/g, " ")}</Badge>
                {app.applicationType && app.applicationType !== "standard" && (
                  <Badge variant="outline">{app.applicationType.replace(/_/g, " ")}</Badge>
                )}
                {app.source && <Badge variant="secondary">{app.source}</Badge>}
                {app.jobPosting?.title && (
                  <Badge variant="outline"><Briefcase className="mr-1 h-3 w-3" />{app.jobPosting.title}</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{applicant.email}</p>
                {applicant.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{applicant.phone}</p>}
                {(applicant.city || applicant.state) && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {[applicant.city, applicant.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              {applicant.whyMorris && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Why Morris</p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">{applicant.whyMorris}</p>
                </div>
              )}

              {app.coverLetter && !applicant.whyMorris && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Cover letter</p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">{app.coverLetter}</p>
                </div>
              )}

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Quick status</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={app.status === s ? "default" : "outline"}
                      disabled={saving || app.status === "hired"}
                      onClick={() => patch({ status: s })}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setHireOpen(true)} disabled={app.status === "hired" || app.status === "rejected"}>
                  <UserCheck className="mr-2 h-4 w-4" /> Hire
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={saving || app.status === "rejected" || app.status === "hired"}
                  onClick={() => patch({ status: "rejected", notes: "Rejected from pipeline" })}
                >
                  <UserX className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>

              <div>
                <Label>Interview notes</Label>
                <Textarea
                  className="mt-2"
                  placeholder="Add interview or phone screen notes…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
                <Button size="sm" className="mt-2" onClick={addNote} disabled={!note.trim() || saving}>
                  Save note
                </Button>
                {(detail.interviewNotes ?? []).length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {detail.interviewNotes!.map((n) => (
                      <li key={n.id} className="rounded-lg border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">{n.interviewDate ?? n.createdAt}</p>
                        <p>{n.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(detail.statusHistory ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Status history</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {detail.statusHistory!.slice(0, 8).map((h) => (
                      <li key={h.id}>{h.createdAt?.slice(0, 10)} — {h.toStatus?.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {app && (
        <HireApplicantDialog
          application={app}
          open={hireOpen}
          onOpenChange={setHireOpen}
          onHired={() => { onUpdated(); onOpenChange(false); }}
        />
      )}
    </>
  );
}
