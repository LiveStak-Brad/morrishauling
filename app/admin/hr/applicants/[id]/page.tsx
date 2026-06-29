"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicantStatus } from "@/types/hr/ats";
import type { ApplicantDocument } from "@/types/hr/documents";
import { toast } from "@/lib/toast";

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<ApplicantStatus | "">("");

  const load = () => {
    fetch(`/api/hr/applicants/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setDetail(d); });
    fetch(`/api/hr/applicants/${id}/documents`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setDocuments(d.documents ?? []); });
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async () => {
    if (!newStatus) return;
    await fetch(`/api/hr/applicants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await fetch(`/api/hr/applicants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewNote: { noteType: "general", content: note } }),
    });
    setNote("");
    load();
  };

  const hire = async () => {
    const res = await fetch(`/api/hr/applicants/${id}/hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employmentType: "w2_full_time", role: "helper", hourlyRate: 18 }),
    });
    const d = await res.json();
    if (d.ok) router.push(`/admin/hr/employees/${d.employeeId}`);
  };

  if (!detail) return <AdminPageShell title="Applicant"><p>Loading…</p></AdminPageShell>;

  const app = detail.application as Record<string, unknown>;
  const applicant = app.applicant as Record<string, unknown>;
  const jobPosting = app.jobPosting as Record<string, unknown> | undefined;
  const notes = (detail.interviewNotes as Record<string, unknown>[]) ?? [];
  const employmentHistory = (detail.employmentHistory as Record<string, unknown>[]) ?? [];
  const references = (detail.references as Record<string, unknown>[]) ?? [];

  return (
    <AdminPageShell
      title={`${applicant.firstName} ${applicant.lastName}`}
      description={String(jobPosting?.title ?? "")}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <PremiumCard className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge>{String(app.status)}</Badge>
              {app.applicationType ? (
                <Badge variant="outline">{String(app.applicationType).replace(/_/g, " ")}</Badge>
              ) : null}
              {app.source ? <Badge variant="secondary">Source: {String(app.source)}</Badge> : null}
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><strong>Email:</strong> {String(applicant.email)}</p>
              <p><strong>Phone:</strong> {String(applicant.phone ?? "—")}</p>
              <p><strong>Address:</strong> {[applicant.addressLine1, applicant.city, applicant.state, applicant.zip].filter(Boolean).join(", ") || "—"}</p>
              <p><strong>Desired Pay:</strong> {applicant.desiredPay != null ? `$${applicant.desiredPay}/hr` : "—"}</p>
              <p><strong>Availability:</strong> {String(applicant.availability ?? "—")}</p>
              <p><strong>Driver&apos;s License:</strong> {applicant.hasDriversLicense ? "Yes" : "No"}</p>
              <p><strong>CDL:</strong> {applicant.hasCdl ? "Yes" : "No"}</p>
              <p><strong>Can Lift 75+ lbs:</strong> {applicant.canLift100lbs ? "Yes" : "No"}</p>
              <p><strong>Reliable Transportation:</strong> {applicant.hasReliableTransportation ? "Yes" : "No"}</p>
              <p><strong>Applied:</strong> {String(app.submittedAt ?? app.createdAt ?? "").slice(0, 10)}</p>
            </div>
          </PremiumCard>

          {applicant.experienceSummary ? (
            <PremiumCard className="p-4">
              <h3 className="font-semibold mb-2">Experience Summary</h3>
              <p className="text-sm whitespace-pre-wrap">{String(applicant.experienceSummary)}</p>
            </PremiumCard>
          ) : null}

          {applicant.whyMorris ? (
            <PremiumCard className="p-4">
              <h3 className="font-semibold mb-2">Why Morris</h3>
              <p className="text-sm whitespace-pre-wrap">{String(applicant.whyMorris)}</p>
            </PremiumCard>
          ) : null}

          {employmentHistory.length > 0 && (
            <PremiumCard className="p-4">
              <h3 className="font-semibold mb-2">Employment History</h3>
              {employmentHistory.map((e) => (
                <p key={String(e.id)} className="text-sm">{String(e.employerName)} — {String(e.jobTitle ?? "")}</p>
              ))}
            </PremiumCard>
          )}

          {references.length > 0 && (
            <PremiumCard className="p-4">
              <h3 className="font-semibold mb-2">References</h3>
              {references.map((r) => (
                <p key={String(r.id)} className="text-sm">{String(r.name)} ({String(r.relationship ?? "")}) — {String(r.phone ?? "")}</p>
              ))}
            </PremiumCard>
          )}

          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-3">Documents</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex justify-between items-center text-sm border rounded-lg p-2">
                    <span className="capitalize">{doc.documentType.replace(/_/g, " ")} — {doc.originalFilename ?? "file"}</span>
                    {doc.signedUrl && (
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Label className="text-xs">HR upload</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.append("file", file);
                  form.append("documentType", "supporting");
                  const res = await fetch(`/api/hr/applicants/${id}/documents`, { method: "POST", body: form });
                  const d = await res.json();
                  if (d.ok) {
                    toast.success("Document uploaded");
                    load();
                  } else toast.error(d.error ?? "Upload failed");
                  e.target.value = "";
                }}
              />
            </div>
          </PremiumCard>

          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-3">Interview Notes</h3>
            <div className="space-y-3 mb-4">
              {notes.map((n) => (
                <div key={String(n.id)} className="border-l-2 border-brand-primary pl-3">
                  <p className="text-sm">{String(n.content)}</p>
                  <p className="text-xs text-muted-foreground">{String(n.createdAt ?? "").slice(0, 10)}</p>
                </div>
              ))}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add interview note…" />
            <Button className="mt-2" size="sm" onClick={addNote}>Save Note</Button>
          </PremiumCard>
        </div>

        <div className="space-y-4">
          <PremiumCard className="p-4 space-y-3">
            <h3 className="font-semibold">Actions</h3>
            <Select value={newStatus} onValueChange={(v) => v && setNewStatus(v as ApplicantStatus)}>
              <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
              <SelectContent>
                {["applied", "phone_screen", "interview_scheduled", "interview_completed", "offer_sent", "offer_accepted", "rejected"].map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" variant="outline" onClick={updateStatus}>Update Status</Button>
            <Button className="w-full" onClick={hire}>Hire Applicant</Button>
          </PremiumCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
